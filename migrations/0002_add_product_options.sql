-- 상품 옵션 테이블 (사이즈, 색상 등)
CREATE TABLE IF NOT EXISTS product_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  option_type TEXT NOT NULL, -- 'size', 'color' 등
  option_value TEXT NOT NULL, -- 'S', 'M', 'L', '230', '240' 등
  stock INTEGER DEFAULT 0,
  price_adjustment INTEGER DEFAULT 0, -- 추가 금액 (0이면 기본 가격)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 장바구니에 옵션 정보 추가
ALTER TABLE cart_items ADD COLUMN size TEXT;
ALTER TABLE cart_items ADD COLUMN color TEXT;
ALTER TABLE cart_items ADD COLUMN selected INTEGER DEFAULT 1; -- 선택적 구매를 위한 체크박스

-- 주문 상품에 옵션 정보 추가
ALTER TABLE order_items ADD COLUMN size TEXT;
ALTER TABLE order_items ADD COLUMN color TEXT;

-- 결제 정보 테이블
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  payment_key TEXT, -- Toss Payments 결제 키
  amount INTEGER NOT NULL,
  method TEXT, -- 'card', 'transfer', 'virtual_account' 등
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_options_product ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_key ON payments(payment_key);
