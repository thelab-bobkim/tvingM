// 전역 상태
let products = [];
let cart = [];
let currentProduct = null;
let currentCategory = '';
let paymentWidget = null;
let currentOrderData = null;
const sessionId = getOrCreateSessionId();

// Toss Payments 클라이언트 키 (실제로는 환경 변수로 관리해야 함)
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

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

// 인증 관련 함수
function checkAuth() {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (token && user) {
    // 로그인 상태
    document.getElementById('auth-links').classList.add('hidden');
    document.getElementById('user-menu').classList.remove('hidden');
    document.getElementById('user-name').textContent = user.name + '님';
    return user;
  } else {
    // 비로그인 상태
    document.getElementById('auth-links').classList.remove('hidden');
    document.getElementById('user-menu').classList.add('hidden');
    return null;
  }
}

function handleLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  alert('로그아웃되었습니다.');
  location.reload();
}

function getAuthHeader() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 페이지 초기화
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
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
    card.className = 'bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition cursor-pointer';
    card.onclick = () => showProductDetail(product.id);
    card.innerHTML = `
      <img src="${product.image_url}" alt="${product.name}" class="w-full h-64 object-cover">
      <div class="p-4">
        <div class="text-sm text-gray-500 mb-1">${product.category_name || ''}</div>
        <h3 class="text-lg font-semibold mb-2">${product.name}</h3>
        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || ''}</p>
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold text-pink-600">${formatPrice(product.price)}</span>
          <button onclick="event.stopPropagation(); showProductDetail(${product.id})" class="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition">
            상세보기
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 상품 상세 페이지 표시
async function showProductDetail(productId) {
  try {
    const response = await axios.get(`/api/products/${productId}`);
    currentProduct = response.data;
    
    hideAllSections();
    document.getElementById('product-detail-container').classList.remove('hidden');
    
    const container = document.getElementById('product-detail');
    
    // 사이즈 옵션 그룹화
    const sizeOptions = currentProduct.options?.filter(opt => opt.option_type === 'size') || [];
    const hasOptions = sizeOptions.length > 0;
    
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        <div>
          <img src="${currentProduct.image_url}" alt="${currentProduct.name}" class="w-full rounded-lg">
        </div>
        <div>
          <div class="text-sm text-gray-500 mb-2">${currentProduct.category_name}</div>
          <h1 class="text-3xl font-bold mb-4">${currentProduct.name}</h1>
          <div class="text-3xl font-bold text-pink-600 mb-6">${formatPrice(currentProduct.price)}</div>
          
          <div class="mb-6">
            <h3 class="font-semibold mb-2">상품 설명</h3>
            <p class="text-gray-600">${currentProduct.description || '상세 설명이 없습니다.'}</p>
          </div>
          
          ${hasOptions ? `
          <div class="mb-6">
            <h3 class="font-semibold mb-2">사이즈 선택 <span class="text-red-500">*</span></h3>
            <div class="grid grid-cols-4 gap-2">
              ${sizeOptions.map(opt => `
                <button 
                  onclick="selectSize('${opt.option_value}')" 
                  class="size-option px-4 py-2 border rounded hover:border-pink-600 ${opt.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                  data-size="${opt.option_value}"
                  ${opt.stock === 0 ? 'disabled' : ''}
                >
                  ${opt.option_value}
                  ${opt.stock === 0 ? '<br><span class="text-xs text-red-500">품절</span>' : ''}
                </button>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <div class="mb-6">
            <h3 class="font-semibold mb-2">수량</h3>
            <div class="flex items-center space-x-4">
              <button onclick="changeQuantity(-1)" class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">-</button>
              <span id="quantity" class="text-xl font-semibold">1</span>
              <button onclick="changeQuantity(1)" class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">+</button>
            </div>
          </div>
          
          <div class="flex space-x-4">
            <button onclick="addProductToCart()" class="flex-1 bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition">
              <i class="fas fa-shopping-cart mr-2"></i>
              장바구니 담기
            </button>
            <button onclick="buyNow()" class="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition">
              바로 구매
            </button>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('상품 상세 로드 실패:', error);
    alert('상품 정보를 불러올 수 없습니다.');
  }
}

// 사이즈 선택
function selectSize(size) {
  document.querySelectorAll('.size-option').forEach(btn => {
    btn.classList.remove('border-pink-600', 'bg-pink-50');
  });
  
  const selectedBtn = document.querySelector(`[data-size="${size}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('border-pink-600', 'bg-pink-50');
  }
}

// 수량 변경
function changeQuantity(delta) {
  const qtyElement = document.getElementById('quantity');
  let qty = parseInt(qtyElement.textContent);
  qty = Math.max(1, qty + delta);
  qtyElement.textContent = qty;
}

// 장바구니에 상품 추가
async function addProductToCart() {
  const sizeOptions = currentProduct.options?.filter(opt => opt.option_type === 'size') || [];
  let selectedSize = null;
  
  if (sizeOptions.length > 0) {
    const selectedBtn = document.querySelector('.size-option.border-pink-600');
    if (!selectedBtn) {
      alert('사이즈를 선택해주세요.');
      return;
    }
    selectedSize = selectedBtn.dataset.size;
  }
  
  const quantity = parseInt(document.getElementById('quantity').textContent);
  
  try {
    await axios.post('/api/cart', {
      sessionId,
      productId: currentProduct.id,
      quantity,
      size: selectedSize,
      color: null
    });
    await loadCart();
    updateCartCount();
    alert('장바구니에 추가되었습니다!');
  } catch (error) {
    console.error('장바구니 추가 실패:', error);
    alert('장바구니 추가에 실패했습니다.');
  }
}

// 바로 구매
async function buyNow() {
  await addProductToCart();
  showCart();
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
    document.getElementById('select-all').checked = false;
    return;
  }
  
  container.innerHTML = '';
  let total = 0;
  let allSelected = true;
  
  cart.forEach(item => {
    if (item.selected) {
      total += item.price * item.quantity;
    } else {
      allSelected = false;
    }
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex items-center space-x-4 border-b pb-4 mb-4';
    itemDiv.innerHTML = `
      <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="toggleCartItem(${item.id}, this.checked)" class="w-5 h-5 text-pink-600 rounded">
      <img src="${item.image_url}" alt="${item.name}" class="w-20 h-20 object-cover rounded">
      <div class="flex-1">
        <h4 class="font-semibold">${item.name}</h4>
        ${item.size ? `<p class="text-sm text-gray-600">사이즈: ${item.size}</p>` : ''}
        <p class="text-gray-600">${formatPrice(item.price)}</p>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})" class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">-</button>
        <span class="px-3">${item.quantity}</span>
        <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})" class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">+</button>
      </div>
      <span class="font-bold w-24 text-right">${formatPrice(item.price * item.quantity)}</span>
      <button onclick="removeCartItem(${item.id})" class="text-red-500 hover:text-red-700">
        <i class="fas fa-trash"></i>
      </button>
    `;
    container.appendChild(itemDiv);
  });
  
  document.getElementById('cart-total').textContent = formatPrice(total);
  document.getElementById('select-all').checked = allSelected;
}

// 장바구니 항목 선택/해제
async function toggleCartItem(itemId, selected) {
  try {
    await axios.put(`/api/cart/${itemId}/select`, { selected });
    await loadCart();
    renderCart();
  } catch (error) {
    console.error('선택 상태 변경 실패:', error);
  }
}

// 전체 선택/해제
async function selectAllCartItems(checked) {
  try {
    for (const item of cart) {
      await axios.put(`/api/cart/${item.id}/select`, { selected: checked });
    }
    await loadCart();
    renderCart();
  } catch (error) {
    console.error('전체 선택 실패:', error);
  }
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

// 홈 페이지 표시
function showHome() {
  hideAllSections();
  document.getElementById('hero-section').classList.remove('hidden');
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
async function showCheckout() {
  const selectedItems = cart.filter(item => item.selected);
  
  if (selectedItems.length === 0) {
    alert('선택한 상품이 없습니다.');
    return;
  }
  
  hideAllSections();
  document.getElementById('checkout-container').classList.remove('hidden');
  renderCheckoutItems();
  
  // Toss Payments 위젯 초기화
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  try {
    paymentWidget = await TossPayments(TOSS_CLIENT_KEY).widgets({
      customerKey: sessionId
    });
    
    await paymentWidget.renderPaymentMethods('#payment-widget', { value: totalAmount });
  } catch (error) {
    console.error('결제 위젯 로드 실패:', error);
  }
}

// 주문 상품 렌더링
function renderCheckoutItems() {
  const container = document.getElementById('checkout-items');
  container.innerHTML = '';
  
  const selectedItems = cart.filter(item => item.selected);
  let total = 0;
  
  selectedItems.forEach(item => {
    total += item.price * item.quantity;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'flex justify-between items-center mb-3 pb-3 border-b';
    itemDiv.innerHTML = `
      <div>
        <div class="font-semibold">${item.name}</div>
        ${item.size ? `<div class="text-sm text-gray-600">사이즈: ${item.size}</div>` : ''}
        <div class="text-sm text-gray-600">${formatPrice(item.price)} x ${item.quantity}</div>
      </div>
      <div class="font-bold">${formatPrice(item.price * item.quantity)}</div>
    `;
    container.appendChild(itemDiv);
  });
  
  document.getElementById('checkout-total').textContent = formatPrice(total);
}

// 결제 요청
async function requestPayment() {
  const name = document.getElementById('customer-name').value.trim();
  const email = document.getElementById('customer-email').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('shipping-address').value.trim();
  
  if (!name || !email || !phone || !address) {
    alert('모든 배송 정보를 입력해주세요.');
    return;
  }
  
  try {
    // 주문 준비
    const response = await axios.post('/api/payments/prepare', {
      sessionId,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: address
    });
    
    currentOrderData = response.data;
    
    // Toss Payments 결제 요청
    await paymentWidget.requestPayment({
      orderId: currentOrderData.orderNumber,
      orderName: `NADA FASHION 주문`,
      customerName: name,
      customerEmail: email,
      successUrl: window.location.origin + '/static/payment-success.html',
      failUrl: window.location.origin + '/static/payment-fail.html',
    });
  } catch (error) {
    console.error('결제 요청 실패:', error);
    alert('결제 처리 중 오류가 발생했습니다.');
  }
}

// 모든 섹션 숨기기
function hideAllSections() {
  document.getElementById('hero-section').classList.add('hidden');
  document.getElementById('category-filter').classList.add('hidden');
  document.getElementById('products-container').classList.add('hidden');
  document.getElementById('product-detail-container').classList.add('hidden');
  document.getElementById('cart-container').classList.add('hidden');
  document.getElementById('checkout-container').classList.add('hidden');
  document.getElementById('order-complete-container').classList.add('hidden');
}
