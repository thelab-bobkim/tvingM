// 탭 전환
function showTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (tab === 'login') {
        loginTab.classList.add('bg-pink-600', 'text-white');
        loginTab.classList.remove('text-gray-700');
        signupTab.classList.remove('bg-pink-600', 'text-white');
        signupTab.classList.add('text-gray-700');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('bg-pink-600', 'text-white');
        signupTab.classList.remove('text-gray-700');
        loginTab.classList.remove('bg-pink-600', 'text-white');
        loginTab.classList.add('text-gray-700');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await axios.post('/api/auth/login', {
            email,
            password
        });
        
        if (response.data.success) {
            // 토큰 저장
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // 메인 페이지로 이동
            alert(`환영합니다, ${response.data.user.name}님!`);
            
            // 관리자면 관리자 페이지로, 아니면 메인 페이지로
            if (response.data.user.isAdmin) {
                window.location.href = '/static/admin.html';
            } else {
                window.location.href = '/static/index.html';
            }
        }
    } catch (error) {
        console.error('로그인 실패:', error);
        const message = error.response?.data?.error || '로그인에 실패했습니다.';
        alert(message);
    }
}

// 회원가입 처리
async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const marketingAgreed = document.getElementById('marketing-agree').checked;
    
    // 비밀번호 확인
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 비밀번호 유효성 검사
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        alert('비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.');
        return;
    }
    
    try {
        const response = await axios.post('/api/auth/signup', {
            email,
            password,
            name,
            phone,
            marketingAgreed
        });
        
        if (response.data.success) {
            // 토큰 저장
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            alert('회원가입이 완료되었습니다!');
            window.location.href = '/static/index.html';
        }
    } catch (error) {
        console.error('회원가입 실패:', error);
        const message = error.response?.data?.error || '회원가입에 실패했습니다.';
        alert(message);
    }
}

// 소셜 로그인 (준비중)
function socialLogin(provider) {
    alert(`${provider} 로그인은 준비 중입니다.`);
}

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        // 이미 로그인된 상태
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        if (redirect) {
            window.location.href = redirect;
        } else {
            window.location.href = '/static/index.html';
        }
    }
});
