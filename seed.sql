-- 카테고리 데이터
INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES 
  (1, '의류', 'clothing', '트렌디한 여성 의류'),
  (2, '슈즈', 'shoes', '스타일리시한 여성 신발'),
  (3, '액세서리', 'accessories', '패션 액세서리');

-- 상품 데이터 (의류)
INSERT OR IGNORE INTO products (name, description, price, category_id, image_url, stock) VALUES 
  ('블랙 롱 코트', '우아한 블랙 롱 코트, 겨울 필수 아이템', 189000, 1, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400', 15),
  ('화이트 니트 스웨터', '따뜻하고 부드러운 니트 스웨터', 79000, 1, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', 20),
  ('데님 재킷', '캐주얼한 데님 재킷', 95000, 1, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', 18),
  ('플리츠 스커트', '우아한 플리츠 스커트', 69000, 1, 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400', 25),
  ('실크 블라우스', '고급스러운 실크 블라우스', 129000, 1, 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400', 12);

-- 상품 데이터 (슈즈)
INSERT OR IGNORE INTO products (name, description, price, category_id, image_url, stock) VALUES 
  ('레더 앵클 부츠', '클래식한 레더 앵클 부츠', 159000, 2, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', 10),
  ('하이힐 펌프스', '세련된 하이힐 펌프스', 119000, 2, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', 15),
  ('화이트 스니커즈', '편안한 화이트 스니커즈', 89000, 2, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400', 30),
  ('로퍼', '클래식 로퍼', 139000, 2, 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400', 12);

-- 상품 데이터 (액세서리)
INSERT OR IGNORE INTO products (name, description, price, category_id, image_url, stock) VALUES 
  ('레더 핸드백', '고급 레더 핸드백', 249000, 3, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', 8),
  ('골드 목걸이', '우아한 골드 목걸이', 59000, 3, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', 20),
  ('스카프', '실크 스카프', 45000, 3, 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400', 25);
