// Logout function
document.getElementById('logout-btn').addEventListener('click', function() {
    firebase.auth().signOut().then(() => {
        alert('Logged out successfully');
        window.location.href = 'index.html'; // Redirect to login page
    }).catch((error) => {
        console.error('Error signing out: ', error);
    });
});
