-- 의류 상품에 사이즈 옵션 추가
-- 블랙 롱 코트 (id: 1)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (1, 'size', 'S', 5),
  (1, 'size', 'M', 5),
  (1, 'size', 'L', 5);

-- 화이트 니트 스웨터 (id: 2)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (2, 'size', 'S', 7),
  (2, 'size', 'M', 7),
  (2, 'size', 'L', 6);

-- 데님 재킷 (id: 3)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (3, 'size', 'S', 6),
  (3, 'size', 'M', 6),
  (3, 'size', 'L', 6);

-- 플리츠 스커트 (id: 4)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (4, 'size', 'S', 8),
  (4, 'size', 'M', 9),
  (4, 'size', 'L', 8);

-- 실크 블라우스 (id: 5)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (5, 'size', 'S', 4),
  (5, 'size', 'M', 4),
  (5, 'size', 'L', 4);

-- 신발 상품에 사이즈 옵션 추가
-- 레더 앵클 부츠 (id: 6)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (6, 'size', '230', 3),
  (6, 'size', '235', 3),
  (6, 'size', '240', 2),
  (6, 'size', '245', 2);

-- 하이힐 펌프스 (id: 7)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (7, 'size', '230', 5),
  (7, 'size', '235', 5),
  (7, 'size', '240', 5);

-- 화이트 스니커즈 (id: 8)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (8, 'size', '230', 10),
  (8, 'size', '235', 10),
  (8, 'size', '240', 10);

-- 로퍼 (id: 9)
INSERT OR IGNORE INTO product_options (product_id, option_type, option_value, stock) VALUES 
  (9, 'size', '230', 4),
  (9, 'size', '235', 4),
  (9, 'size', '240', 4);

-- 액세서리는 사이즈 옵션 없음 (ONE SIZE)
