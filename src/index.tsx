import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// ======================
// API Routes
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

// 상품 상세
app.get('/api/products/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  const result = await DB.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ?
  `).bind(id).first()
  
  if (!result) {
    return c.json({ error: 'Product not found' }, 404)
  }
  
  return c.json(result)
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

// 장바구니에 상품 추가
app.post('/api/cart', async (c) => {
  const { DB } = c.env
  const { sessionId, productId, quantity } = await c.req.json()
  
  // 이미 장바구니에 있는지 확인
  const existing = await DB.prepare(`
    SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?
  `).bind(sessionId, productId).first()
  
  if (existing) {
    // 수량 업데이트
    await DB.prepare(`
      UPDATE cart_items SET quantity = quantity + ? WHERE id = ?
    `).bind(quantity, existing.id).run()
  } else {
    // 새로운 항목 추가
    await DB.prepare(`
      INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)
    `).bind(sessionId, productId, quantity).run()
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

// 장바구니 항목 삭제
app.delete('/api/cart/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  await DB.prepare('DELETE FROM cart_items WHERE id = ?').bind(id).run()
  
  return c.json({ success: true })
})

// 주문 생성
app.post('/api/orders', async (c) => {
  const { DB } = c.env
  const { sessionId, customerName, customerEmail, customerPhone, shippingAddress, items } = await c.req.json()
  
  // 주문 번호 생성
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  // 총액 계산
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  
  // 주문 생성
  const orderResult = await DB.prepare(`
    INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).bind(orderNumber, customerName, customerEmail, customerPhone, shippingAddress, totalAmount).run()
  
  const orderId = orderResult.meta.last_row_id
  
  // 주문 상품 추가
  for (const item of items) {
    await DB.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `).bind(orderId, item.product_id, item.name, item.price, item.quantity).run()
  }
  
  // 장바구니 비우기
  await DB.prepare('DELETE FROM cart_items WHERE session_id = ?').bind(sessionId).run()
  
  return c.json({ 
    success: true, 
    orderNumber,
    orderId 
  })
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
  
  return c.json({
    ...order,
    items: items.results
  })
})

// ======================
// Frontend Pages
// ======================

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NADA FASHION - 트렌디한 여성 의류와 슈즈</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- 헤더 -->
        <header class="bg-white shadow-sm sticky top-0 z-50">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-pink-600">NADA FASHION</h1>
                        <p class="text-sm text-gray-600">트렌디한 여성 의류와 슈즈</p>
                    </div>
                    <nav class="flex items-center space-x-6">
                        <a href="#" class="text-gray-700 hover:text-pink-600" onclick="showProducts()">상품</a>
                        <a href="#" class="text-gray-700 hover:text-pink-600 relative" onclick="showCart()">
                            <i class="fas fa-shopping-cart"></i>
                            장바구니
                            <span id="cart-count" class="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
                        </a>
                    </nav>
                </div>
            </div>
        </header>

        <!-- 메인 컨텐츠 -->
        <main class="container mx-auto px-4 py-8">
            <!-- 히어로 섹션 -->
            <section id="hero-section" class="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg p-12 mb-8">
                <h2 class="text-4xl font-bold mb-4">2024 신상품 컬렉션</h2>
                <p class="text-xl mb-6">트렌디한 스타일로 당신의 개성을 표현하세요</p>
                <button onclick="showProducts()" class="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                    쇼핑 시작하기
                </button>
            </section>

            <!-- 카테고리 필터 -->
            <div id="category-filter" class="mb-6 hidden">
                <div class="flex space-x-4">
                    <button onclick="filterByCategory('')" class="category-btn active px-6 py-2 rounded-full bg-pink-600 text-white hover:bg-pink-700">
                        전체
                    </button>
                    <button onclick="filterByCategory('clothing')" class="category-btn px-6 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300">
                        의류
                    </button>
                    <button onclick="filterByCategory('shoes')" class="category-btn px-6 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300">
                        슈즈
                    </button>
                    <button onclick="filterByCategory('accessories')" class="category-btn px-6 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300">
                        액세서리
                    </button>
                </div>
            </div>

            <!-- 상품 목록 -->
            <div id="products-container" class="hidden">
                <h2 class="text-2xl font-bold mb-6">상품 목록</h2>
                <div id="products-grid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- 상품들이 여기에 동적으로 추가됩니다 -->
                </div>
            </div>

            <!-- 장바구니 -->
            <div id="cart-container" class="hidden">
                <h2 class="text-2xl font-bold mb-6">장바구니</h2>
                <div id="cart-items" class="bg-white rounded-lg shadow p-6 mb-6">
                    <!-- 장바구니 항목들이 여기에 동적으로 추가됩니다 -->
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-center text-xl font-bold mb-4">
                        <span>총 금액:</span>
                        <span id="cart-total" class="text-pink-600">0원</span>
                    </div>
                    <button onclick="showCheckout()" class="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition">
                        주문하기
                    </button>
                </div>
            </div>

            <!-- 주문/결제 -->
            <div id="checkout-container" class="hidden">
                <h2 class="text-2xl font-bold mb-6">주문/결제</h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-xl font-bold mb-4">배송 정보</h3>
                        <form id="checkout-form">
                            <div class="mb-4">
                                <label class="block text-gray-700 mb-2">이름</label>
                                <input type="text" id="customer-name" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600">
                            </div>
                            <div class="mb-4">
                                <label class="block text-gray-700 mb-2">이메일</label>
                                <input type="email" id="customer-email" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600">
                            </div>
                            <div class="mb-4">
                                <label class="block text-gray-700 mb-2">전화번호</label>
                                <input type="tel" id="customer-phone" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600">
                            </div>
                            <div class="mb-4">
                                <label class="block text-gray-700 mb-2">배송 주소</label>
                                <textarea id="shipping-address" required rows="3" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-xl font-bold mb-4">주문 상품</h3>
                        <div id="checkout-items" class="mb-4">
                            <!-- 주문 상품 목록 -->
                        </div>
                        <div class="border-t pt-4">
                            <div class="flex justify-between items-center text-xl font-bold mb-4">
                                <span>결제 금액:</span>
                                <span id="checkout-total" class="text-pink-600">0원</span>
                            </div>
                            <button onclick="submitOrder()" class="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition">
                                결제하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 주문 완료 -->
            <div id="order-complete-container" class="hidden">
                <div class="bg-white rounded-lg shadow p-8 text-center">
                    <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                    <h2 class="text-3xl font-bold mb-4">주문이 완료되었습니다!</h2>
                    <p class="text-gray-600 mb-2">주문번호: <span id="order-number" class="font-bold"></span></p>
                    <p class="text-gray-600 mb-6">이메일로 주문 확인서가 발송되었습니다.</p>
                    <button onclick="location.reload()" class="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition">
                        쇼핑 계속하기
                    </button>
                </div>
            </div>
        </main>

        <!-- 푸터 -->
        <footer class="bg-gray-800 text-white py-8 mt-12">
            <div class="container mx-auto px-4 text-center">
                <p>&copy; 2024 NADA FASHION. All rights reserved.</p>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
