// Firebase reference
const db = firebase.database().ref('employees');
const loansDb = firebase.database().ref('loans');
let editLoanKey = null;
let loanToDelete = null; // Store the loan key to be deleted

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.innerText = message;
    toast.className = "toast show";
    setTimeout(function () {
        toast.className = toast.className.replace("show", "");
    }, 3000); // Hide after 3 seconds
}

// Show popup form
document.getElementById('create-btn').addEventListener('click', function () {
    document.getElementById('popup-form').classList.add('active');
    clearForm(); // Clear the form for new entries
    editLoanKey = null; // Reset edit mode
    populateEmployeeDropdown(); // Populate the employee dropdown
    generateDocumentNumber(); // Generate the document number
});

// Hide popup form
document.getElementById('cancel-btn').addEventListener('click', function () {
    document.getElementById('popup-form').classList.remove('active');
});

// Generate unique 12-digit document number
function generateDocumentNumber() {
    const randomDocumentNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString(); // Generate 12-digit random number
    document.getElementById('loan-document-number').value = randomDocumentNumber;
}

// Populate the employee dropdown
function populateEmployeeDropdown(selectedEmployeeKey = null) {
    const nameDropdown = document.getElementById('loan-employee-name');
    nameDropdown.innerHTML = `<option value="" disabled selected>Select employee name</option>`; // Reset dropdown

    db.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            const employee = childSnapshot.val();
            const option = document.createElement('option');
            option.value = childSnapshot.key; // Use the employee key as value
            option.textContent = `${employee.name} (${employee.code})`; // Show full name and code in the dropdown
            nameDropdown.appendChild(option);

            // If editing, pre-select the correct employee
            if (selectedEmployeeKey === childSnapshot.key) {
                option.selected = true;
                document.getElementById('loan-employee-code').value = employee.code;
            }
        });
    });
}

// Auto-fill employee code when name is selected
document.getElementById('loan-employee-name').addEventListener('change', function () {
    const selectedEmployeeKey = this.value;

    // Fetch the selected employee data from Firebase
    db.child(selectedEmployeeKey).once('value').then(function (snapshot) {
        const employee = snapshot.val();
        document.getElementById('loan-employee-code').value = employee.code || 'N/A'; // Auto-fill the employee code
    });
});

// Calculate EMI
document.getElementById('loan-amount').addEventListener('input', calculateEMI);
document.getElementById('loan-tenure').addEventListener('input', calculateEMI);

function calculateEMI() {
    const loanAmount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const tenure = parseFloat(document.getElementById('loan-tenure').value) || 0;

    if (tenure > 0) {
        const emi = loanAmount / tenure;
        document.getElementById('loan-emi').value = emi.toFixed(2);
    } else {
        document.getElementById('loan-emi').value = 0;
    }
}

// Submit loan data
document.getElementById('submit-btn').addEventListener('click', function () {
    const date = document.getElementById('loan-date').value;
    const documentNumber = document.getElementById('loan-document-number').value;
    const employeeName = document.getElementById('loan-employee-name').options[document.getElementById('loan-employee-name').selectedIndex].text.split(' (')[0]; // Get full name
    const employeeCode = document.getElementById('loan-employee-code').value;
    const loanAmount = parseFloat(document.getElementById('loan-amount').value).toFixed(2);
    const tenure = parseInt(document.getElementById('loan-tenure').value);
    const emi = parseFloat(document.getElementById('loan-emi').value).toFixed(2);

    const loanData = {
        date: date,
        documentNumber: documentNumber,
        employeeName: employeeName,
        employeeCode: employeeCode,
        loanAmount: loanAmount,
        tenure: tenure,
        emi: emi
    };

    if (editLoanKey) {
        // Update existing loan
        loansDb.child(editLoanKey).update(loanData);
        showToast('Loan updated successfully');
    } else {
        // Create new loan
        loansDb.push(loanData);
        showToast('Loan added successfully');
    }

    document.getElementById('popup-form').classList.remove('active');
    clearForm();
    fetchLoans(); // Refresh table
});

// Clear form
function clearForm() {
    document.getElementById('loan-date').value = '';
    document.getElementById('loan-document-number').value = '';
    document.getElementById('loan-employee-name').selectedIndex = 0;
    document.getElementById('loan-employee-code').value = '';
    document.getElementById('loan-amount').value = '';
    document.getElementById('loan-tenure').value = '';
    document.getElementById('loan-emi').value = '';
}

// Fetch and display loans
function fetchLoans() {
    loansDb.on('value', function (snapshot) {
        const loanTable = document.getElementById('loan-table-body');
        loanTable.innerHTML = '';
        snapshot.forEach(function (childSnapshot) {
            const loan = childSnapshot.val();
            const key = childSnapshot.key;
            const row = `
                <tr>
                    <td>${loan.date}</td>
                    <td>${loan.documentNumber}</td>
                    <td>${loan.employeeName}</td>
                    <td>${loan.employeeCode}</td>
                    <td>${loan.loanAmount}</td>
                    <td>${loan.tenure}</td>
                    <td>${loan.emi}</td>
                    <td>
                        <a href="#" class="edit-btn" data-key="${key}"><i class="fas fa-edit"></i></a>
                        <a href="#" class="delete-btn" data-key="${key}"><i class="fas fa-trash-alt"></i></a>
                    </td>
                </tr>
            `;
            loanTable.innerHTML += row;
        });

        // Attach event listeners to edit and delete buttons
        attachEventListeners();
    });
}

// Attach event listeners to Edit and Delete buttons
function attachEventListeners() {
    // Edit functionality
    document.querySelectorAll('.edit-btn').forEach(function (editBtn) {
        editBtn.addEventListener('click', function (event) {
            event.preventDefault();
            const key = this.getAttribute('data-key');
            loansDb.child(key).once('value').then(function (snapshot) {
                const loan = snapshot.val();
                populateEmployeeDropdown(key); // Populate and pre-select the employee
                document.getElementById('loan-date').value = loan.date;
                document.getElementById('loan-document-number').value = loan.documentNumber;
                document.getElementById('loan-amount').value = loan.loanAmount;
                document.getElementById('loan-tenure').value = loan.tenure;
                document.getElementById('loan-emi').value = loan.emi;
                document.getElementById('popup-form').classList.add('active');
                editLoanKey = key; // Set the key for updating
            });
        });
    });

    // Delete functionality
    document.querySelectorAll('.delete-btn').forEach(function (deleteBtn) {
        deleteBtn.addEventListener('click', function (event) {
            event.preventDefault();
            const key = this.getAttribute('data-key');
            openDeleteModal(key); // Open the custom delete modal
        });
    });
}

// Open custom confirmation modal
function openDeleteModal(key) {
    loanToDelete = key;
    document.getElementById('delete-confirmation-modal').style.display = 'block';
}

// Close the modal without deleting
document.getElementById('cancel-delete-btn').addEventListener('click', function () {
    document.getElementById('delete-confirmation-modal').style.display = 'none';
});

// Confirm delete
document.getElementById('confirm-delete-btn').addEventListener('click', function () {
    if (loanToDelete) {
        loansDb.child(loanToDelete).remove();
        showToast('Loan record deleted successfully');
        fetchLoans(); // Refresh table
    }
    document.getElementById('delete-confirmation-modal').style.display = 'none';
});

// Initialize and fetch loans on load
window.onload = function () {
    fetchLoans();
};
