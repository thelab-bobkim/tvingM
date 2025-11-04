// 전역 상태
let products = [];
let cart = [];
let currentCategory = '';
const sessionId = getOrCreateSessionId();

// 세션 ID 생성 또는 가져오기
function getOrCreateSessionId() {
  let sid = localStorage.getItem('sessionId');
  if (!sid) {
    sid = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sid);
  }
  return sid;
}

// 숫자를 한국 원화 형식으로 포맷
function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

// 페이지 초기화
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  await loadCart();
  updateCartCount();
});

// 상품 목록 로드
async function loadProducts(category = '') {
  try {
    const url = category ? `/api/products?category=${category}` : '/api/products';
    const response = await axios.get(url);
    products = response.data;
    renderProducts();
  } catch (error) {
    console.error('상품 로드 실패:', error);
  }
}

// 상품 목록 렌더링
function renderProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition';
    card.innerHTML = `
      <img src="${product.image_url}" alt="${product.name}" class="w-full h-64 object-cover">
      <div class="p-4">
        <div class="text-sm text-gray-500 mb-1">${product.category_name || ''}</div>
        <h3 class="text-lg font-semibold mb-2">${product.name}</h3>
        <p class="text-gray-600 text-sm mb-3">${product.description || ''}</p>
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold text-pink-600">${formatPrice(product.price)}</span>
          <button onclick="addToCart(${product.id})" class="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition">
            <i class="fas fa-shopping-cart mr-1"></i>
            담기
          </button>
        </div>
        <div class="mt-2 text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}">
          ${product.stock > 0 ? `재고: ${product.stock}개` : '품절'}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 장바구니에 상품 추가
async function addToCart(productId) {
  try {
    await axios.post('/api/cart', {
      sessionId,
      productId,
      quantity: 1
    });
    await loadCart();
    updateCartCount();
    alert('장바구니에 추가되었습니다!');
  } catch (error) {
    console.error('장바구니 추가 실패:', error);
    alert('장바구니 추가에 실패했습니다.');
  }
}

// 장바구니 로드
async function loadCart() {
  try {
    const response = await axios.get(`/api/cart/${sessionId}`);
    cart = response.data;
  } catch (error) {
    console.error('장바구니 로드 실패:', error);
  }
}

// 장바구니 렌더링
function renderCart() {
  const container = document.getElementById('cart-items');
  
  if (cart.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">장바구니가 비어있습니다.</p>';
    document.getElementById('cart-total').textContent = '0원';
    return;
  }
  
  container.innerHTML = '';
  let total = 0;
  
  cart.forEach(item => {
    total += item.price * item.quantity;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex items-center justify-between border-b pb-4 mb-4';
    itemDiv.innerHTML = `
      <div class="flex items-center space-x-4 flex-1">
        <img src="${item.image_url}" alt="${item.name}" class="w-20 h-20 object-cover rounded">
        <div class="flex-1">
          <h4 class="font-semibold">${item.name}</h4>
          <p class="text-gray-600">${formatPrice(item.price)}</p>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})" class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">-</button>
          <span class="px-3">${item.quantity}</span>
          <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})" class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">+</button>
        </div>
        <span class="font-bold w-24 text-right">${formatPrice(item.price * item.quantity)}</span>
        <button onclick="removeCartItem(${item.id})" class="text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(itemDiv);
  });
  
  document.getElementById('cart-total').textContent = formatPrice(total);
}

// 장바구니 수량 업데이트
async function updateCartItemQuantity(itemId, quantity) {
  if (quantity < 1) {
    return removeCartItem(itemId);
  }
  
  try {
    await axios.put(`/api/cart/${itemId}`, { quantity });
    await loadCart();
    renderCart();
    updateCartCount();
  } catch (error) {
    console.error('수량 업데이트 실패:', error);
  }
}

// 장바구니 항목 삭제
async function removeCartItem(itemId) {
  if (!confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    await axios.delete(`/api/cart/${itemId}`);
    await loadCart();
    renderCart();
    updateCartCount();
  } catch (error) {
    console.error('항목 삭제 실패:', error);
  }
}

// 장바구니 개수 업데이트
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
}

// 카테고리 필터링
async function filterByCategory(category) {
  currentCategory = category;
  
  // 버튼 스타일 업데이트
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-pink-600', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-700');
  });
  event.target.classList.add('active', 'bg-pink-600', 'text-white');
  event.target.classList.remove('bg-gray-200', 'text-gray-700');
  
  await loadProducts(category);
}

// 상품 페이지 표시
function showProducts() {
  hideAllSections();
  document.getElementById('category-filter').classList.remove('hidden');
  document.getElementById('products-container').classList.remove('hidden');
}

// 장바구니 페이지 표시
function showCart() {
  hideAllSections();
  document.getElementById('cart-container').classList.remove('hidden');
  renderCart();
}

// 주문/결제 페이지 표시
function showCheckout() {
  if (cart.length === 0) {
    alert('장바구니가 비어있습니다.');
    return;
  }
  
  hideAllSections();
  document.getElementById('checkout-container').classList.remove('hidden');
  renderCheckoutItems();
}

// 주문 상품 렌더링
function renderCheckoutItems() {
  const container = document.getElementById('checkout-items');
  container.innerHTML = '';
  
  let total = 0;
  
  cart.forEach(item => {
    total += item.price * item.quantity;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex justify-between items-center mb-3 pb-3 border-b';
    itemDiv.innerHTML = `
      <div>
        <div class="font-semibold">${item.name}</div>
        <div class="text-sm text-gray-600">${formatPrice(item.price)} x ${item.quantity}</div>
      </div>
      <div class="font-bold">${formatPrice(item.price * item.quantity)}</div>
    `;
    container.appendChild(itemDiv);
  });
  
  document.getElementById('checkout-total').textContent = formatPrice(total);
}

// 주문 제출
async function submitOrder() {
  const name = document.getElementById('customer-name').value.trim();
  const email = document.getElementById('customer-email').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('shipping-address').value.trim();
  
  if (!name || !email || !phone || !address) {
    alert('모든 배송 정보를 입력해주세요.');
    return;
  }
  
  try {
    const response = await axios.post('/api/orders', {
      sessionId,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: address,
      items: cart
    });
    
    if (response.data.success) {
      document.getElementById('order-number').textContent = response.data.orderNumber;
      hideAllSections();
      document.getElementById('order-complete-container').classList.remove('hidden');
      cart = [];
      updateCartCount();
    }
  } catch (error) {
    console.error('주문 실패:', error);
    alert('주문 처리 중 오류가 발생했습니다.');
  }
}

// 모든 섹션 숨기기
function hideAllSections() {
  document.getElementById('hero-section').classList.add('hidden');
  document.getElementById('category-filter').classList.add('hidden');
  document.getElementById('products-container').classList.add('hidden');
  document.getElementById('cart-container').classList.add('hidden');
  document.getElementById('checkout-container').classList.add('hidden');
  document.getElementById('order-complete-container').classList.add('hidden');
}
