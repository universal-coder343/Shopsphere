// Handle the auth logic for auth.html

let authMode = 'login'; // 'login' or 'register'

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    try {
        const user = await window.checkSession();
        if (user) {
            // Already logged in, redirect to store
            window.location.replace('index.html');
        }
    } catch (e) {
        // Not logged in, stay on page
    }

    const form = document.getElementById('authForm');
    const toggleLink = document.getElementById('authToggleLink');

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });

    form.addEventListener('submit', handleAuthSubmit);
});

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.style.display = 'none';
    
    if (authMode === 'register') {
        document.getElementById('authTitle').innerText = 'Create Account';
        document.getElementById('nameField').style.display = 'block';
        document.getElementById('authName').required = true;
        document.getElementById('authSubmitBtn').innerText = 'Sign Up';
        document.getElementById('authToggleText').innerText = 'Already have an account?';
        document.getElementById('authToggleLink').innerText = 'Log in';
    } else {
        document.getElementById('authTitle').innerText = 'Welcome Back';
        document.getElementById('nameField').style.display = 'none';
        document.getElementById('authName').required = false;
        document.getElementById('authSubmitBtn').innerText = 'Log In';
        document.getElementById('authToggleText').innerText = "Don't have an account?";
        document.getElementById('authToggleLink').innerText = 'Sign up';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const pwd = document.getElementById('authPassword').value;
    const errorMsg = document.getElementById('errorMsg');
    
    errorMsg.style.display = 'none';

    try {
        if (authMode === 'login') {
            await window.loginUser(email, pwd);
            // Login successful, redirect via replace to avoid back-button loops
            window.location.replace('index.html');
        } else {
            const name = document.getElementById('authName').value;
            await window.registerUser(name, email, pwd);
            // Auto-login after register
            await window.loginUser(email, pwd); 
            window.location.replace('index.html');
        }
    } catch(err) {
        errorMsg.textContent = err.message || 'Authentication failed. Please try again.';
        errorMsg.style.display = 'block';
    }
}
