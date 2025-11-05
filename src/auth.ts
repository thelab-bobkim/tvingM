// 간단한 비밀번호 해싱 (실제 프로덕션에서는 bcrypt 사용)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// 세션 토큰 생성
export function generateSessionToken(): string {
  return crypto.randomUUID()
}

// 세션 만료 시간 (7일)
export function getSessionExpiry(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString()
}

// JWT 생성 (간단 버전)
export async function createJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`
  
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
  
  return `${data}.${encodedSignature}`
}

// JWT 검증
export async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
    
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const data = `${encodedHeader}.${encodedPayload}`
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0))
    
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data))
    
    if (!valid) {
      return null
    }
    
    return JSON.parse(atob(encodedPayload))
  } catch {
    return null
  }
}

// 이메일 유효성 검사
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 비밀번호 유효성 검사 (최소 8자, 영문+숫자)
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}

// 전화번호 포맷팅
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  return phone
}
