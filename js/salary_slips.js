// Firebase references
const db = firebase.database().ref('employees');
const loansDb = firebase.database().ref('loans'); // Add loans reference for EMI selection
const salarySlipsDb = firebase.database().ref('salary_slips');
const companyInfoDb = firebase.database().ref('company_info');
const monthlySalaryDb = firebase.database().ref('monthly_salary'); // Reference to monthly_salary
let editSlipKey = null;
let slipToDelete = null; // Store the slip key to be deleted
let companyInfo = {}; // Store company info

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
    editSlipKey = null; // Reset edit mode
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
    document.getElementById('slip-document-number').value = randomDocumentNumber;
}

// Populate the employee dropdown with only active employees and get salary from monthly_salary node
function populateEmployeeDropdown(selectedEmployeeKey = null) {
    const nameDropdown = document.getElementById('slip-name');
    nameDropdown.innerHTML = `<option value="" disabled selected>Select employee name</option>`; // Reset dropdown

    db.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            const employee = childSnapshot.val();
            
            // Only show employees with status "Active"
            if (employee.status === "Active") {
                const option = document.createElement('option');
                option.value = childSnapshot.key; // Use the employee key as value
                option.textContent = `${employee.name} (${employee.code})`; // Show full name and code in the dropdown
                nameDropdown.appendChild(option);

                // If editing, pre-select the correct employee
                if (selectedEmployeeKey === childSnapshot.key) {
                    option.selected = true;
                    document.getElementById('slip-code').value = employee.code;
                    document.getElementById('employee-address').value = employee.address || 'N/A';
                    document.getElementById('employee-phone').value = employee.phone || 'N/A';
                    document.getElementById('employee-email').value = employee.email || 'N/A';
                    populateLoanEMIs(employee.code); // Populate the loan EMI dropdown based on employee code
                    // Fetch salary from monthly_salary node
                    fetchMonthlySalary(childSnapshot.key);
                }
            }
        });
    });
}

// Fetch salary from the monthly_salary node
function fetchMonthlySalary(employeeId) {
    const currentYearMonth = new Date().getFullYear() + '-' + (new Date().getMonth() + 1); // Get current year-month in format YYYY-MM
    const monthlySalaryRef = monthlySalaryDb.child(`${employeeId}/${currentYearMonth}`); // Reference to monthly_salary for this employee for the current month

    monthlySalaryRef.once('value').then(function (snapshot) {
        const salaryData = snapshot.val();
        if (salaryData && salaryData.payableSalary) {
            document.getElementById('slip-salary').value = parseFloat(salaryData.payableSalary).toFixed(2); // Fill in the salary from monthly_salary node
        } else {
            document.getElementById('slip-salary').value = '0.00'; // Default if no salary data found
        }
        calculateNetPayable(); // Recalculate net payable after fetching salary
    });
}

// Populate Loan EMI dropdown for the selected employee
function populateLoanEMIs(employeeCode) {
    const loanEMIDropdown = document.getElementById('slip-loan-emi');
    loanEMIDropdown.innerHTML = ''; // Clear previous options
    const loanDocNumbers = []; // To store selected loan document numbers

    loansDb.orderByChild('employeeCode').equalTo(employeeCode).once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const loan = childSnapshot.val();
            const option = document.createElement('option');
            option.value = loan.emi; // EMI value for the option
            option.textContent = `Loan EMI: ${loan.emi} | Loan Amount: ${loan.loanAmount}`;
            option.setAttribute('data-doc-number', loan.documentNumber); // Store loan document number
            loanEMIDropdown.appendChild(option);
        });
    });

    // Calculate total Loan Reduction based on selected EMIs
    document.getElementById('slip-loan-emi').addEventListener('change', function () {
        const selectedEMIs = Array.from(this.selectedOptions).map(option => parseFloat(option.value) || 0);
        const totalLoanReduction = selectedEMIs.reduce((acc, emi) => acc + emi, 0);

        // Populate Loan Reduction field
        document.getElementById('slip-loan').value = totalLoanReduction.toFixed(2); 

        // Populate Loan Document Numbers field without duplicates
        const selectedLoanDocumentNumbers = Array.from(this.selectedOptions)
            .map(option => option.getAttribute('data-doc-number'))
            .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

        document.getElementById('slip-loan-doc').value = selectedLoanDocumentNumbers.join(', ');

        calculateNetPayable(); // Update net payable based on selected EMIs
    });
}

// Auto-fill employee details and calculate net payable
document.getElementById('slip-name').addEventListener('change', function () {
    const selectedEmployeeKey = this.value;

    // Fetch the selected employee data from Firebase
    db.child(selectedEmployeeKey).once('value').then(function (snapshot) {
        const employee = snapshot.val();
        document.getElementById('slip-code').value = employee.code || 'N/A'; // Auto-fill the employee code
        document.getElementById('employee-address').value = employee.address || 'N/A'; // Auto-fill the employee address
        document.getElementById('employee-phone').value = employee.phone || 'N/A'; // Auto-fill the employee phone
        document.getElementById('employee-email').value = employee.email || 'N/A'; // Auto-fill the employee email
        populateLoanEMIs(employee.code); // Populate Loan EMIs for this employee
        fetchMonthlySalary(selectedEmployeeKey); // Fetch the employee salary from monthly_salary
    });
});

// Calculate net payable
function calculateNetPayable() {
    const salary = parseFloat(document.getElementById('slip-salary').value) || 0;
    const loanReduction = parseFloat(document.getElementById('slip-loan').value) || 0;
    const ta_da = parseFloat(document.getElementById('slip-ta-da').value) || 0;
    const netPayable = salary - loanReduction + ta_da;
    document.getElementById('slip-net-payable').value = netPayable.toFixed(2);
}

// Update net payable when TA/DA or loan reduction is updated
document.getElementById('slip-loan').addEventListener('input', calculateNetPayable);
document.getElementById('slip-ta-da').addEventListener('input', calculateNetPayable);

// Submit salary slip data
document.getElementById('submit-btn').addEventListener('click', function () {
    const name = document.getElementById('slip-name').options[document.getElementById('slip-name').selectedIndex].text.split(' (')[0]; // Get full name
    const code = document.getElementById('slip-code').value;
    const loan = parseFloat(document.getElementById('slip-loan').value).toFixed(2);
    const ta_da = parseFloat(document.getElementById('slip-ta-da').value).toFixed(2);
    const salary = parseFloat(document.getElementById('slip-salary').value).toFixed(2);
    const netPayable = parseFloat(document.getElementById('slip-net-payable').value).toFixed(2);
    const date = document.getElementById('slip-date').value;
    const documentNumber = document.getElementById('slip-document-number').value;
    const salaryMonth = document.getElementById('slip-salary-month').value;
    const address = document.getElementById('employee-address').value;
    const phone = document.getElementById('employee-phone').value;
    const email = document.getElementById('employee-email').value;
    const loanDocumentNumbers = document.getElementById('slip-loan-doc').value; // Loan document numbers

    const salarySlipData = {
        name: name,
        code: code,
        loan: loan,
        ta_da: ta_da,
        salary: salary,
        netPayable: netPayable,
        date: date,
        documentNumber: documentNumber,
        salaryMonth: salaryMonth,
        address: address,
        phone: phone,
        email: email,
        loanDocumentNumbers: loanDocumentNumbers // Add loan document numbers to the data
    };

    if (editSlipKey) {
        // Update existing salary slip
        salarySlipsDb.child(editSlipKey).update(salarySlipData);
        showToast('Salary slip updated successfully');
    } else {
        // Create new salary slip
        salarySlipsDb.push(salarySlipData);
        showToast('Salary slip added successfully');
    }

    document.getElementById('popup-form').classList.remove('active');
    clearForm();
    fetchSalarySlips(); // Refresh table
});

// Clear form
function clearForm() {
    document.getElementById('slip-name').selectedIndex = 0;
    document.getElementById('slip-code').value = '';
    document.getElementById('slip-loan').value = '';
    document.getElementById('slip-ta-da').value = '';
    document.getElementById('slip-salary').value = '';
    document.getElementById('slip-net-payable').value = '';
    document.getElementById('slip-date').value = '';
    document.getElementById('slip-document-number').value = '';
    document.getElementById('slip-salary-month').selectedIndex = 0;
    document.getElementById('employee-address').value = 'N/A';
    document.getElementById('employee-phone').value = 'N/A';
    document.getElementById('employee-email').value = 'N/A';
    document.getElementById('slip-loan-doc').value = ''; // Clear Loan Document Numbers
    document.getElementById('slip-loan-emi').innerHTML = ''; // Clear Loan EMI options
}

// Fetch and display salary slips
function fetchSalarySlips() {
    salarySlipsDb.on('value', function (snapshot) {
        const slipTable = document.getElementById('salary-slip-table-body');
        slipTable.innerHTML = '';
        snapshot.forEach(function (childSnapshot) {
            const slip = childSnapshot.val();
            const key = childSnapshot.key;
            const row = `
                <tr>
                    <td>${slip.name}</td>
                    <td>${slip.code}</td>
                    <td>${slip.loan}</td>
                    <td>${slip.loanDocumentNumbers || 'N/A'}</td> <!-- Display Loan Document Numbers -->
                    <td>${slip.ta_da}</td>
                    <td>${slip.salary}</td>
                    <td>${slip.netPayable}</td>
                    <td>${slip.date}</td>
                    <td>${slip.documentNumber}</td>
                    <td>${slip.salaryMonth}</td>
                    <td>${slip.address}</td>
                    <td>${slip.phone}</td>
                    <td>${slip.email}</td>
                    <td>
                        <a href="#" class="edit-btn" data-key="${key}"><i class="fas fa-edit"></i></a>
                        <a href="#" class="delete-btn" data-key="${key}"><i class="fas fa-trash-alt"></i></a>
                        <a href="#" class="print-btn" data-key="${key}"><i class="fas fa-print"></i></a>
                    </td>
                </tr>
            `;
            slipTable.innerHTML += row;
        });

        // Attach event listeners to edit, delete, and print buttons
        attachEventListeners();
    });
}

// Attach event listeners to Edit, Delete, and Print buttons
function attachEventListeners() {
    // Edit functionality
    document.querySelectorAll('.edit-btn').forEach(function (editBtn) {
        editBtn.addEventListener('click', function (event) {
            event.preventDefault();
            const key = this.getAttribute('data-key');
            salarySlipsDb.child(key).once('value').then(function (snapshot) {
                const slip = snapshot.val();
                populateEmployeeDropdown(key); // Populate and pre-select the employee
                document.getElementById('slip-loan').value = slip.loan;
                document.getElementById('slip-loan-doc').value = slip.loanDocumentNumbers || ''; // Populate Loan Document Numbers
                document.getElementById('slip-ta-da').value = slip.ta_da;
                document.getElementById('slip-salary').value = slip.salary;
                document.getElementById('slip-net-payable').value = slip.netPayable;
                document.getElementById('slip-date').value = slip.date;
                document.getElementById('slip-document-number').value = slip.documentNumber;
                document.getElementById('slip-salary-month').value = slip.salaryMonth;
                document.getElementById('employee-address').value = slip.address || 'N/A';
                document.getElementById('employee-phone').value = slip.phone || 'N/A';
                document.getElementById('employee-email').value = slip.email || 'N/A';
                document.getElementById('popup-form').classList.add('active');
                editSlipKey = key; // Set the key for updating
            });
        });
    });

    // Print functionality
    document.querySelectorAll('.print-btn').forEach(function (printBtn) {
        printBtn.addEventListener('click', function (event) {
            event.preventDefault();
            const key = this.getAttribute('data-key');
            printSalarySlip(key); // Trigger print functionality
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
    slipToDelete = key;
    document.getElementById('delete-confirmation-modal').style.display = 'block';
}

// Close the modal without deleting
document.getElementById('cancel-delete-btn').addEventListener('click', function () {
    document.getElementById('delete-confirmation-modal').style.display = 'none';
});

// Confirm delete
document.getElementById('confirm-delete-btn').addEventListener('click', function () {
    if (slipToDelete) {
        salarySlipsDb.child(slipToDelete).remove();
        showToast('Salary slip deleted successfully');
        fetchSalarySlips(); // Refresh table
    }
    document.getElementById('delete-confirmation-modal').style.display = 'none';
});

// Initialize and fetch salary slips on load
window.onload = function () {
    fetchSalarySlips();
    fetchCompanyInfo(); // Fetch company info on load
};

// Fetch company info from the database
function fetchCompanyInfo() {
    companyInfoDb.once('value').then(function (snapshot) {
        companyInfo = snapshot.val();
    });
}

// Print the salary slip with professional design and company info
function printSalarySlip(key) {
    salarySlipsDb.child(key).once('value').then(function (snapshot) {
        const slip = snapshot.val();
        
        // Use the employee's key stored in the salary slip to fetch employee details
        db.orderByChild('code').equalTo(slip.code).once('value').then(function (employeeSnapshot) {
            let employee = null;
            
            // Firebase returns an object, so we need to extract the first result
            employeeSnapshot.forEach(function(childSnapshot) {
                employee = childSnapshot.val();
            });

            // Create a new window for the printout
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Salary Slip</title>
                    <style>
                        /* Add styling for print window */
                        body {
                            font-family: Arial, sans-serif;
                            padding: 20px;
                        }
                        .salary-slip-container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: white;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        h2 {
                            text-align: center;
                            margin-bottom: 20px;
                            color: teal;
                        }
                        .company-info, .employee-info {
                            margin-bottom: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            padding: 10px;
                            border: 1px solid #ddd;
                            text-align: left;
                        }
                        th {
                            background-color: teal;
                            color: white;
                        }
                        .total {
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="salary-slip-container">
                        <h2>Salary Slip</h2>
                        <div class="company-info">
                            <strong>${companyInfo.name}</strong><br>
                            ${companyInfo.address}<br>
                            ${companyInfo.phone} | ${companyInfo.email}
                        </div>
                        <div class="employee-info">
                            <strong>Employee:</strong> ${slip.name}<br>
                            <strong>Code:</strong> ${slip.code}<br>
                            <strong>Address:</strong> ${employee ? employee.address : 'N/A'}<br>
                            <strong>Phone:</strong> ${employee ? employee.phone : 'N/A'}<br>
                            <strong>Email:</strong> ${employee ? employee.email : 'N/A'}
                        </div>
                        <table>
                            <tr><th>Loan Reduction</th><td>${slip.loan}</td></tr>
                            <tr><th>Loan Document Number(s)</th><td>${slip.loanDocumentNumbers || 'N/A'}</td></tr> <!-- Added Loan Document Numbers -->
                            <tr><th>TA/DA</th><td>${slip.ta_da}</td></tr>
                            <tr><th>Salary</th><td>${slip.salary}</td></tr>
                            <tr><th>Net Payable</th><td>${slip.netPayable}</td></tr>
                            <tr><th>Date</th><td>${slip.date}</td></tr>
                            <tr><th>Document Number</th><td>${slip.documentNumber}</td></tr>
                            <tr><th>Salary Month</th><td>${slip.salaryMonth}</td></tr>
                        </table>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        });
    });
}
