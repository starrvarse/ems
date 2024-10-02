document.addEventListener('DOMContentLoaded', () => {
    // Function to include the navbar dynamically
    function includeNavbar() {
        const navbarElement = document.getElementById("navbar-container");

        if (navbarElement) {
            fetch("navbar.html")
                .then(response => response.text())
                .then(data => {
                    navbarElement.innerHTML = data;
                    // Call the function to add the logout event listener AFTER the navbar is loaded
                    addLogoutListener();
                })
                .catch(error => console.error('Error loading the navbar:', error));
        }
    }

    // Call the function to include the navbar
    includeNavbar();

    // Function to add logout event listener
    function addLogoutListener() {
        const logoutButton = document.getElementById('logout-btn');

        // Ensure logout button exists before adding the listener
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                firebase.auth().signOut().then(() => {
                    showToast('Logged out successfully');
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Redirect to login page after logout
                    }, 1500); // Delay redirection to show the toast message
                }).catch((error) => {
                    console.error('Error signing out:', error);
                    showToast('Error logging out');
                });
            });
        } else {
            console.error("Logout button not found.");
        }
    }

    // Show toast notification function
    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');

        // Check if elements exist
        if (toast && toastMessage) {
            toastMessage.innerText = message;
            toast.classList.add('show');

            // Hide toast after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else {
            console.error("Toast notification elements not found.");
        }
    }
});
