import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { hashPassword, verifyPassword, generateSessionToken, getSessionExpiry, isValidEmail, isValidPassword } from './auth'

type Bindings = {
  DB: D1Database
  TOSS_SECRET_KEY?: string
  JWT_SECRET?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// ======================
// 인증 미들웨어
// ======================
async function authMiddleware(c: any, next: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const { DB } = c.env
  const session = await DB.prepare(`
    SELECT us.*, u.id as user_id, u.email, u.name, u.is_admin
    FROM user_sessions us
    JOIN users u ON us.user_id = u.id
    WHERE us.session_token = ? AND us.expires_at > datetime('now')
  `).bind(token).first()
  
  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401)
  }
  
  c.set('user', session)
  await next()
}

// ======================
// 인증 API Routes
// ======================

// 회원가입
app.post('/api/auth/signup', async (c) => {
  const { DB } = c.env
  const { email, password, name, phone, marketingAgreed } = await c.req.json()
  
  // 유효성 검사
  if (!isValidEmail(email)) {
    return c.json({ error: '유효한 이메일 주소를 입력해주세요.' }, 400)
  }
  
  if (!isValidPassword(password)) {
    return c.json({ error: '비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.' }, 400)
  }
  
  if (!name || name.trim().length < 2) {
    return c.json({ error: '이름은 최소 2자 이상이어야 합니다.' }, 400)
  }
  
  // 이메일 중복 확인
  const existing = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return c.json({ error: '이미 가입된 이메일입니다.' }, 400)
  }
  
  // 비밀번호 해싱
  const passwordHash = await hashPassword(password)
  
  // 사용자 생성
  const result = await DB.prepare(`
    INSERT INTO users (email, password_hash, name, phone, marketing_agreed)
    VALUES (?, ?, ?, ?, ?)
  `).bind(email, passwordHash, name, phone || null, marketingAgreed ? 1 : 0).run()
  
  const userId = result.meta.last_row_id
  
  // 세션 생성
  const sessionToken = generateSessionToken()
  const expiresAt = getSessionExpiry()
  
  await DB.prepare(`
    INSERT INTO user_sessions (user_id, session_token, expires_at)
    VALUES (?, ?, ?)
  `).bind(userId, sessionToken, expiresAt).run()
  
  return c.json({
    success: true,
    user: {
      id: userId,
      email,
      name
    },
    token: sessionToken
  })
})

// 로그인
app.post('/api/auth/login', async (c) => {
  const { DB } = c.env
  const { email, password } = await c.req.json()
  
  // 사용자 조회
  const user = await DB.prepare(`
    SELECT id, email, password_hash, name, is_admin
    FROM users WHERE email = ?
  `).bind(email).first()
  
  if (!user) {
    return c.json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' }, 401)
  }
  
  // 비밀번호 확인
  const valid = await verifyPassword(password, user.password_hash as string)
  if (!valid) {
    return c.json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' }, 401)
  }
  
  // 마지막 로그인 시간 업데이트
  await DB.prepare(`
    UPDATE users SET last_login_at = datetime('now') WHERE id = ?
  `).bind(user.id).run()
  
  // 세션 생성
  const sessionToken = generateSessionToken()
  const expiresAt = getSessionExpiry()
  
  await DB.prepare(`
    INSERT INTO user_sessions (user_id, session_token, expires_at)
    VALUES (?, ?, ?)
  `).bind(user.id, sessionToken, expiresAt).run()
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin === 1
    },
    token: sessionToken
  })
})

// 로그아웃
app.post('/api/auth/logout', authMiddleware, async (c) => {
  const { DB } = c.env
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  await DB.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(token).run()
  
  return c.json({ success: true })
})

// 현재 사용자 정보
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  
  return c.json({
    id: user.user_id,
    email: user.email,
    name: user.name,
    isAdmin: user.is_admin === 1
  })
})

// ======================
// 상품 API Routes
// ======================

// 카테고리 목록
app.get('/api/categories', async (c) => {
  const { DB } = c.env
  const result = await DB.prepare('SELECT * FROM categories ORDER BY name').all()
  return c.json(result.results)
})

// 상품 목록 (카테고리별 필터링 가능)
app.get('/api/products', async (c) => {
  const { DB } = c.env
  const category = c.req.query('category')
  
  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id
  `
  
  if (category) {
    query += ` WHERE c.slug = ?`
    const result = await DB.prepare(query).bind(category).all()
    return c.json(result.results)
  }
  
  const result = await DB.prepare(query + ' ORDER BY p.created_at DESC').all()
  return c.json(result.results)
})

// 상품 상세 (옵션 포함)
app.get('/api/products/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  // 상품 정보
  const product = await DB.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ?
  `).bind(id).first()
  
  if (!product) {
    return c.json({ error: 'Product not found' }, 404)
  }
  
  // 상품 옵션 (사이즈 등)
  const options = await DB.prepare(`
    SELECT * FROM product_options WHERE product_id = ? ORDER BY option_value
  `).bind(id).all()
  
  return c.json({
    ...product,
    options: options.results
  })
})

// 장바구니 조회
app.get('/api/cart/:sessionId', async (c) => {
  const { DB } = c.env
  const sessionId = c.req.param('sessionId')
  
  const result = await DB.prepare(`
    SELECT ci.*, p.name, p.price, p.image_url 
    FROM cart_items ci 
    JOIN products p ON ci.product_id = p.id 
    WHERE ci.session_id = ?
  `).bind(sessionId).all()
  
  return c.json(result.results)
})

// 장바구니에 상품 추가 (사이즈/색상 포함)
app.post('/api/cart', async (c) => {
  const { DB } = c.env
  const { sessionId, productId, quantity, size, color } = await c.req.json()
  
  // 동일한 상품+옵션이 이미 장바구니에 있는지 확인
  const existing = await DB.prepare(`
    SELECT * FROM cart_items 
    WHERE session_id = ? AND product_id = ? AND size = ? AND color = ?
  `).bind(sessionId, productId, size || null, color || null).first()
  
  if (existing) {
    // 수량 업데이트
    await DB.prepare(`
      UPDATE cart_items SET quantity = quantity + ? WHERE id = ?
    `).bind(quantity, existing.id).run()
  } else {
    // 새로운 항목 추가
    await DB.prepare(`
      INSERT INTO cart_items (session_id, product_id, quantity, size, color, selected) 
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(sessionId, productId, quantity, size || null, color || null).run()
  }
  
  return c.json({ success: true })
})

// 장바구니 항목 수량 업데이트
app.put('/api/cart/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { quantity } = await c.req.json()
  
  await DB.prepare(`
    UPDATE cart_items SET quantity = ? WHERE id = ?
  `).bind(quantity, id).run()
  
  return c.json({ success: true })
})

// 장바구니 항목 선택/해제
app.put('/api/cart/:id/select', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  const { selected } = await c.req.json()
  
  await DB.prepare(`
    UPDATE cart_items SET selected = ? WHERE id = ?
  `).bind(selected ? 1 : 0, id).run()
  
  return c.json({ success: true })
})

// 장바구니 항목 삭제
app.delete('/api/cart/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM cart_items WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// Toss Payments 결제 준비
app.post('/api/payments/prepare', async (c) => {
  const { DB } = c.env
  const { sessionId, customerName, customerEmail, customerPhone, shippingAddress } = await c.req.json()
  
  // 선택된 장바구니 항목만 조회
  const cartItems = await DB.prepare(`
    SELECT ci.*, p.name, p.price, p.image_url 
    FROM cart_items ci 
    JOIN products p ON ci.product_id = p.id 
    WHERE ci.session_id = ? AND ci.selected = 1
  `).bind(sessionId).all()
  
  if (!cartItems.results || cartItems.results.length === 0) {
    return c.json({ error: 'No items selected' }, 400)
  }
  
  // 총액 계산
  const totalAmount = cartItems.results.reduce((sum: number, item: any) => 
    sum + (item.price * item.quantity), 0
  )
  
  // 주문 번호 생성
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  // 주문 생성
  const orderResult = await DB.prepare(`
    INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).bind(orderNumber, customerName, customerEmail, customerPhone, shippingAddress, totalAmount).run()
  
  const orderId = orderResult.meta.last_row_id
  
  // 주문 상품 추가
  for (const item of cartItems.results as any[]) {
    await DB.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, size, color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(orderId, item.product_id, item.name, item.price, item.quantity, item.size, item.color).run()
  }
  
  // 결제 레코드 생성
  await DB.prepare(`
    INSERT INTO payments (order_id, amount, status)
    VALUES (?, ?, 'pending')
  `).bind(orderId, totalAmount).run()
  
  return c.json({
    success: true,
    orderId,
    orderNumber,
    amount: totalAmount,
    customerName,
    customerEmail
  })
})

// Toss Payments 결제 승인
app.post('/api/payments/confirm', async (c) => {
  const { DB, TOSS_SECRET_KEY } = c.env
  const { orderId, paymentKey, amount } = await c.req.json()
  
  try {
    // Toss Payments API 호출
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(TOSS_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount
      })
    })
    
    const tossData = await tossResponse.json()
    
    if (tossResponse.ok) {
      // 결제 성공 - DB 업데이트
      await DB.prepare(`
        UPDATE payments SET payment_key = ?, method = ?, status = 'completed', approved_at = datetime('now')
        WHERE order_id = (SELECT id FROM orders WHERE order_number = ?)
      `).bind(paymentKey, tossData.method, orderId).run()
      
      await DB.prepare(`
        UPDATE orders SET status = 'paid' WHERE order_number = ?
      `).bind(orderId).run()
      
      // 선택된 장바구니 항목 삭제
      const order = await DB.prepare(`
        SELECT id FROM orders WHERE order_number = ?
      `).bind(orderId).first()
      
      if (order) {
        // 주문에 포함된 상품의 sessionId 가져오기
        const sessionResult = await DB.prepare(`
          SELECT DISTINCT ci.session_id 
          FROM cart_items ci
          JOIN order_items oi ON ci.product_id = oi.product_id
          WHERE oi.order_id = ? AND ci.selected = 1
        `).bind(order.id).first()
        
        if (sessionResult) {
          await DB.prepare(`
            DELETE FROM cart_items WHERE session_id = ? AND selected = 1
          `).bind(sessionResult.session_id).run()
        }
      }
      
      return c.json({ success: true, payment: tossData })
    } else {
      // 결제 실패
      await DB.prepare(`
        UPDATE payments SET status = 'failed' WHERE order_id = (SELECT id FROM orders WHERE order_number = ?)
      `).bind(orderId).run()
      
      return c.json({ success: false, error: tossData }, 400)
    }
  } catch (error) {
    return c.json({ success: false, error: 'Payment confirmation failed' }, 500)
  }
})

// 주문 조회
app.get('/api/orders/:orderNumber', async (c) => {
  const { DB } = c.env
  const orderNumber = c.req.param('orderNumber')
  
  const order = await DB.prepare(`
    SELECT * FROM orders WHERE order_number = ?
  `).bind(orderNumber).first()
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }
  
  const items = await DB.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `).bind(order.id).all()
  
  const payment = await DB.prepare(`
    SELECT * FROM payments WHERE order_id = ?
  `).bind(order.id).first()
  
  return c.json({
    ...order,
    items: items.results,
    payment
  })
})

// ======================
// Frontend Pages  
// ======================

// 메인 페이지는 별도 파일로 분리하여 관리 (코드가 너무 길어서)
app.get('/', (c) => {
  return c.redirect('/static/index.html')
})

export default app
