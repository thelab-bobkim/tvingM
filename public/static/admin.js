// 인증 확인
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user || !user.isAdmin) {
        alert('관리자 권한이 필요합니다.');
        window.location.href = '/static/auth.html';
        return false;
    }
    
    return true;
}

function getAuthHeader() {
    const token = localStorage.getItem('authToken');
    return { 'Authorization': `Bearer ${token}` };
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/static/auth.html';
}

// 섹션 전환
function showSection(section) {
    // 모든 섹션 숨기기
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('products-section').classList.add('hidden');
    document.getElementById('orders-section').classList.add('hidden');
    document.getElementById('users-section').classList.add('hidden');
    
    // 선택된 섹션 표시
    document.getElementById(section + '-section').classList.remove('hidden');
    
    // 제목 변경
    const titles = {
        'dashboard': '대시보드',
        'products': '상품 관리',
        'orders': '주문 관리',
        'users': '회원 관리'
    };
    document.getElementById('section-title').textContent = titles[section];
    
    // 데이터 로드
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'products') {
        loadProducts();
    } else if (section === 'orders') {
        loadOrders();
    } else if (section === 'users') {
        loadUsers();
    }
}

// 대시보드 데이터 로드
async function loadDashboard() {
    try {
        // 통계 데이터 가져오기 (실제로는 API 구현 필요)
        const productsResponse = await axios.get('/api/products');
        document.getElementById('total-products').textContent = productsResponse.data.length + '개';
        
        // 최근 주문 (임시)
        document.getElementById('today-sales').textContent = '0원';
        document.getElementById('today-orders').textContent = '0건';
        document.getElementById('total-users').textContent = '0명';
    } catch (error) {
        console.error('대시보드 로드 실패:', error);
    }
}

// 상품 목록 로드
async function loadProducts() {
    try {
        const response = await axios.get('/api/products');
        const products = response.data;
        
        const container = document.getElementById('products-list');
        container.innerHTML = '';
        
        if (products.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">등록된 상품이 없습니다.</p>';
            return;
        }
        
        products.forEach(product => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50';
            div.innerHTML = `
                <div class="flex items-center space-x-4">
                    <img src="${product.image_url}" alt="${product.name}" class="w-16 h-16 object-cover rounded">
                    <div>
                        <h4 class="font-semibold">${product.name}</h4>
                        <p class="text-sm text-gray-600">${product.category_name}</p>
                        <p class="text-sm font-bold text-pink-600">${formatPrice(product.price)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}">
                        재고: ${product.stock}
                    </span>
                    <button onclick="editProduct(${product.id})" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                        수정
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('상품 로드 실패:', error);
    }
}

// 주문 목록 로드
async function loadOrders() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">주문 관리 기능은 개발 중입니다.</p>';
}

// 회원 목록 로드
async function loadUsers() {
    const container = document.getElementById('users-list');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">회원 관리 기능은 개발 중입니다.</p>';
}

// 상품 수정 (간단 버전)
function editProduct(productId) {
    alert('상품 수정 기능은 개발 중입니다. 상품 ID: ' + productId);
}

// 상품 등록 폼 표시
function showProductForm() {
    alert('상품 등록 기능은 개발 중입니다.');
}

// 가격 포맷팅
function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

// 페이지 로드 시 인증 확인
document.addEventListener('DOMContentLoaded', () => {
    if (checkAdminAuth()) {
        loadDashboard();
    }
});
