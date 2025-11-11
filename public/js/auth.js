/**
 * Common Authentication Module
 * Provides consistent authentication across all pages
 */

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    // If token is present but expired, treat as logged out
    if (isTokenExpired(token)) {
        return false;
    }
    return true;
}

// Decode JWT payload safely
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Determine if a token is expired based on `exp`
function isTokenExpired(token) {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false; // if no exp, assume not expired
    const now = Math.floor(Date.now() / 1000);
    return now >= payload.exp;
}

// Get a valid token or redirect if missing/expired
function getTokenOrRedirect() {
    const token = localStorage.getItem('token');
    if (!token) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        localStorage.setItem('lastPage', currentPage);
        window.location.href = 'login.html';
        return null;
    }
    if (isTokenExpired(token)) {
        // Clear and redirect to login
        alert('Session expired. Please log in again.');
        logoutUser();
        return null;
    }
    return token;
}

// Get current user information
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Login user and store credentials
async function loginUser(email, password) {
    if (!email || !password) return false;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || 'Login failed');
            return false;
        }
        
        const data = await response.json();
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
        return false;
    }
}

// Register a new user
async function registerUser(name, email, password) {
    if (!name || !email || !password) return false;
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || 'Registration failed');
            return false;
        }
        
        const data = await response.json();
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        return true;
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
        return false;
    }
}

// Logout user and clear credentials
function logoutUser() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Protect page - redirect to login if not authenticated
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
        // Clear token if expired
        if (token && isTokenExpired(token)) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
        // Remember current page for redirect after login
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        localStorage.setItem('lastPage', currentPage);
        
        // Redirect to login with relative path
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect to last page or default page after login
function redirectAfterLogin() {
    const lastPage = localStorage.getItem('lastPage') || 'index.html';
    // Use relative path for redirects
    window.location.href = lastPage;
}

// Update UI based on login status
function updateUIForUser() {
    const user = getCurrentUser();
    if (user) {
        // Add user info to header if element exists
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
            userInfoElement.textContent = user.name;
        }
        
        // Show logout button if it exists
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.addEventListener('click', logoutUser);
        }
        
        // Hide login prompt if it exists
        const loginPrompt = document.getElementById('login-prompt');
        if (loginPrompt) {
            loginPrompt.style.display = 'none';
        }
    }
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = getTokenOrRedirect();
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
    };
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', function() {
    // Skip auth check on login and register pages
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
        requireAuth();
        updateUIForUser();
    }
});