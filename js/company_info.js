// Firebase Database reference for company_info
const companyInfoRef = firebase.database().ref('company_info');

// Select DOM elements
const companyNameField = document.getElementById('company-name');
const companyAddressField = document.getElementById('company-address');
const companyPhoneField = document.getElementById('company-phone');
const companyEmailField = document.getElementById('company-email');
const editButton = document.getElementById('edit-btn');
const saveButton = document.getElementById('save-btn');

// Fetch existing company info from Firebase when the page loads
function loadCompanyInfo() {
    companyInfoRef.once('value').then(function(snapshot) {
        const companyInfo = snapshot.val();
        if (companyInfo) {
            // Populate the fields with data from Firebase
            companyNameField.value = companyInfo.name || '';
            companyAddressField.value = companyInfo.address || '';
            companyPhoneField.value = companyInfo.phone || '';
            companyEmailField.value = companyInfo.email || '';
        }
    }).catch(function(error) {
        console.error('Error loading company info: ', error);
    });
}

// Call loadCompanyInfo when the page loads
window.onload = function() {
    loadCompanyInfo();
};

// Enable fields when the Edit button is clicked
editButton.addEventListener('click', function() {
    companyNameField.disabled = false;
    companyAddressField.disabled = false;
    companyPhoneField.disabled = false;
    companyEmailField.disabled = false;

    // Enable the Save button
    saveButton.disabled = false;
    saveButton.classList.add('enabled');
});

// Save the updated company info to Firebase when Save button is clicked
saveButton.addEventListener('click', function() {
    // Get the updated values from the form
    const updatedCompanyInfo = {
        name: companyNameField.value,
        address: companyAddressField.value,
        phone: companyPhoneField.value,
        email: companyEmailField.value
    };

    // Save the data to Firebase
    companyInfoRef.set(updatedCompanyInfo)
        .then(function() {
            alert('Company information saved successfully!');

            // Disable the fields after saving
            companyNameField.disabled = true;
            companyAddressField.disabled = true;
            companyPhoneField.disabled = true;
            companyEmailField.disabled = true;

            // Disable the Save button
            saveButton.disabled = true;
            saveButton.classList.remove('enabled');
        })
        .catch(function(error) {
            console.error('Error saving company info:', error);
        });
});
