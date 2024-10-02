// Select DOM elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

// Switch between login and sign-up forms
showSignup.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLogin.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.innerText = message;
    toast.classList.add('show');
    
    // Automatically hide the toast after 3 seconds
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000); // Duration of toast visibility (3 seconds)
}

// Firebase Auth for Sign-Up
signupBtn.addEventListener('click', () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Validate form inputs
    if (email === '' || password === '') {
        showToast('Please fill in all fields');
        return;
    }

    // Firebase sign-up function
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sign-up successful
            showToast('Sign-Up successful!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';  // Redirect to dashboard after signup
            }, 1500);
        })
        .catch((error) => {
            showToast(error.message);
        });
});

// Firebase Auth for Login
loginBtn.addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Validate form inputs
    if (email === '' || password === '') {
        showToast('Please fill in all fields');
        return;
    }

    // Firebase login function
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful
            showToast('Login successful!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';  // Redirect to dashboard after login
            }, 1500);
        })
        .catch((error) => {
            showToast(error.message);
        });
});
