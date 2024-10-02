// Firebase reference
const db = firebase.database().ref('employees');
let editEmployeeKey = null;
let employeeToDelete = null; // Store the employee key to be deleted

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.innerText = message;
    toast.className = "toast show";
    setTimeout(function() {
        toast.className = toast.className.replace("show", "");
    }, 3000); // Hide after 3 seconds
}

// Show popup form
document.getElementById('create-btn').addEventListener('click', function() {
    document.getElementById('popup-form').classList.add('active');
    clearForm(); // Clear the form for new entries
    generateEmployeeCode(); // Generate new employee code
    editEmployeeKey = null; // Reset edit mode
});

// Hide popup form
document.getElementById('cancel-btn').addEventListener('click', function() {
    document.getElementById('popup-form').classList.remove('active');
});

// Function to generate unique 13-digit employee code
function generateEmployeeCode() {
    const prefix = "682776"; // Fixed prefix
    let randomPart = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6 random digits
    const newEmployeeCode = prefix + randomPart; // Combine prefix and random part

    // Check if the generated code is unique
    db.orderByChild('code').equalTo(newEmployeeCode).once('value', function(snapshot) {
        if (snapshot.exists()) {
            // If code exists, generate a new one recursively
            generateEmployeeCode();
        } else {
            // Set the generated code in the input field
            document.getElementById('employee-code').value = newEmployeeCode;
        }
    });
}

// Submit employee data
document.getElementById('submit-btn').addEventListener('click', function() {
    const name = document.getElementById('employee-name').value;
    const code = document.getElementById('employee-code').value; // Now auto-generated
    const password = document.getElementById('employee-password').value; // Get the password value
    const address = document.getElementById('employee-address').value;
    const phone = document.getElementById('employee-phone').value;
    const email = document.getElementById('employee-email').value;
    const salary = parseFloat(document.getElementById('employee-salary').value).toFixed(2); // Ensure two decimals
    const joiningDate = document.getElementById('employee-joining-date').value; // Get joining date
    const status = document.getElementById('employee-status').value; // Get status

    if (editEmployeeKey) {
        // Update existing employee
        db.child(editEmployeeKey).update({
            name: name,
            code: code,
            password: password, // Save the password
            address: address,
            phone: phone,
            email: email,
            salary: salary,
            joiningDate: joiningDate, // Save the joining date
            status: status // Save the status
        });
        showToast('Employee updated successfully');
    } else {
        // Create new employee
        const newEmployee = db.push();
        newEmployee.set({
            name: name,
            code: code, // Auto-generated employee code
            password: password, // Save the password
            address: address,
            phone: phone,
            email: email,
            salary: salary,
            joiningDate: joiningDate, // Save the joining date
            status: status // Save the status
        });
        showToast('Employee added successfully');
    }

    document.getElementById('popup-form').classList.remove('active');
    clearForm();
    fetchEmployees(); // Refresh table
});

// Clear form
function clearForm() {
    document.getElementById('employee-name').value = '';
    document.getElementById('employee-code').value = ''; // Clear code too
    document.getElementById('employee-password').value = '1234'; // Reset password to default
    document.getElementById('employee-address').value = '';
    document.getElementById('employee-phone').value = '';
    document.getElementById('employee-email').value = '';
    document.getElementById('employee-salary').value = '';
    document.getElementById('employee-joining-date').value = ''; // Clear joining date
    document.getElementById('employee-status').value = 'Active'; // Reset status to Active
}

// Fetch and display employees
function fetchEmployees() {
    db.on('value', function(snapshot) {
        const employeeTable = document.getElementById('employee-table-body');
        employeeTable.innerHTML = '';
        snapshot.forEach(function(childSnapshot) {
            const employee = childSnapshot.val();
            const key = childSnapshot.key;
            const row = `
                <tr>
                    <td>${employee.name}</td>
                    <td>${employee.code}</td>
                    <td>${employee.password}</td> <!-- Display Password -->
                    <td>${employee.address}</td>
                    <td>${employee.phone}</td>
                    <td>${employee.email}</td>
                    <td>${employee.salary}</td>
                    <td>${employee.joiningDate}</td> <!-- Display Joining Date -->
                    <td>${employee.status}</td> <!-- Display Status -->
                    <td>
                        <a href="#" class="edit-btn" data-key="${key}"><i class="fas fa-edit"></i></a>
                        <a href="#" class="delete-btn" data-key="${key}"><i class="fas fa-trash-alt"></i></a>
                    </td>
                </tr>
            `;
            employeeTable.innerHTML += row;
        });

        // Attach event listeners to edit and delete buttons
        attachEventListeners();
        filterTable(); // Apply filtering after fetching data
    });
}

// Attach event listeners to Edit and Delete buttons
function attachEventListeners() {
    // Edit functionality
    document.querySelectorAll('.edit-btn').forEach(function(editBtn) {
        editBtn.addEventListener('click', function(event) {
            event.preventDefault();
            const key = this.getAttribute('data-key');
            db.child(key).once('value').then(function(snapshot) {
                const employee = snapshot.val();
                document.getElementById('employee-name').value = employee.name;
                document.getElementById('employee-code').value = employee.code; // Pre-fill code for edit
                document.getElementById('employee-password').value = employee.password; // Pre-fill password for edit
                document.getElementById('employee-address').value = employee.address;
                document.getElementById('employee-phone').value = employee.phone;
                document.getElementById('employee-email').value = employee.email;
                document.getElementById('employee-salary').value = employee.salary;
                document.getElementById('employee-joining-date').value = employee.joiningDate; // Pre-fill joining date for edit
                document.getElementById('employee-status').value = employee.status; // Pre-fill status for edit
                document.getElementById('popup-form').classList.add('active');
                editEmployeeKey = key; // Set the key for updating
            });
        });
    });

    // Delete functionality
    document.querySelectorAll('.delete-btn').forEach(function(deleteBtn) {
        deleteBtn.addEventListener('click', function(event) {
            event.preventDefault();
            const key = this.getAttribute('data-key');
            openDeleteModal(key); // Open the custom delete modal
        });
    });
}

// Searchable filter
document.getElementById('search-input').addEventListener('keyup', function() {
    filterTable();
});

function filterTable() {
    const filter = document.getElementById('search-input').value.toUpperCase();
    const rows = document.querySelectorAll('#employee-table tbody tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let match = false;
        cells.forEach(cell => {
            if (cell.textContent.toUpperCase().indexOf(filter) > -1) {
                match = true;
            }
        });
        row.style.display = match ? '' : 'none';
    });
}

// Open custom confirmation modal
function openDeleteModal(key) {
    employeeToDelete = key;
    document.getElementById('delete-confirmation-modal').style.display = 'block';
}

// Close the modal without deleting
document.getElementById('cancel-delete-btn').addEventListener('click', function() {
    document.getElementById('delete-confirmation-modal').style.display = 'none';
});

// Confirm delete
document.getElementById('confirm-delete-btn').addEventListener('click', function() {
    if (employeeToDelete) {
        db.child(employeeToDelete).remove();
        showToast('Employee deleted successfully');
        fetchEmployees(); // Refresh table
    }
    document.getElementById('delete-confirmation-modal').style.display = 'none';
});

// Initialize and fetch employees on load
window.onload = function() {
    fetchEmployees();
}
