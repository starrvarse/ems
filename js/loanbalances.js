// Firebase references
const loansDb = firebase.database().ref('loans');
const salarySlipsDb = firebase.database().ref('salary_slips');
const companyInfoDb = firebase.database().ref('company_info'); // Reference for company info

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

// Fetch and display loan balances
function fetchLoanBalances() {
    loansDb.once('value', function (snapshot) {
        const loanBalanceTable = document.getElementById('loan-balance-table-body');
        loanBalanceTable.innerHTML = '';

        snapshot.forEach(function (childSnapshot) {
            const loan = childSnapshot.val();
            const loanDocumentNumber = loan.documentNumber || 'N/A'; // Loan ID (Document Number)
            const employeeName = loan.employeeName || 'N/A';
            const employeeCode = loan.employeeCode || 'N/A';
            const loanAmount = parseFloat(loan.loanAmount) || 0; // Loan Amount from loans
            const tenure = loan.tenure || 'N/A'; // Tenure (Months)
            const emi = parseFloat(loan.emi) || 0; // EMI value from the loan record

            // Fetch salary slips related to the employee and loan document number
            calculateEMIs(employeeName, employeeCode, loanDocumentNumber, loanAmount, tenure, emi);
        });
    });
}

// Function to calculate Passed EMI, Total EMI Paid, and Balance
function calculateEMIs(employeeName, employeeCode, loanDocumentNumber, loanAmount, tenure, emi) {
    salarySlipsDb.once('value', function (snapshot) {
        let totalEMIPaid = 0;
        let passedEMICount = 0;

        snapshot.forEach(function (slipSnapshot) {
            const slip = slipSnapshot.val();

            // Check if the Loan Document Number in salary slips matches the Loan Document Number in loans
            if (slip.loanDocumentNumbers && slip.loanDocumentNumbers.split(', ').includes(loanDocumentNumber)) {
                passedEMICount += 1; // Increment Passed EMI count
            }
        });

        // Calculate Total EMI Paid as EMI * Passed EMI
        totalEMIPaid = emi * passedEMICount;

        // Calculate the balance
        const balance = loanAmount - totalEMIPaid;

        // Add the data to the table
        const row = `
            <tr>
                <td>${employeeName}</td>
                <td>${loanDocumentNumber}</td> <!-- Loan ID (Document Number) -->
                <td>${tenure}</td> <!-- Tenure (Months) -->
                <td>${passedEMICount}</td> <!-- Passed EMI -->
                <td>${emi.toFixed(2)}</td> <!-- EMI -->
                <td>${totalEMIPaid.toFixed(2)}</td> <!-- Total EMI Paid -->
                <td>${loanAmount.toFixed(2)}</td> <!-- Loan Amount -->
                <td>${balance.toFixed(2)}</td> <!-- Balance = Loan Amount - Total EMI Paid -->
            </tr>
        `;
        document.getElementById('loan-balance-table-body').innerHTML += row;
    });
}

// Function to fetch company info for printing
function fetchCompanyInfo(callback) {
    companyInfoDb.once('value', function (snapshot) {
        const companyInfo = snapshot.val();
        callback(companyInfo);
    });
}

// Print function for loan balances with company info
document.getElementById('print-btn').addEventListener('click', function () {
    fetchCompanyInfo(function (companyInfo) {
        // Create a print window
        const printWindow = window.open('', '_blank');
        
        const tableContent = document.getElementById('loan-balance-table').outerHTML;

        // Add company info and table in print-friendly format
        printWindow.document.write(`
            <html>
            <head>
                <title>Loan Balances Statement</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    h1, h2 {
                        text-align: center;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 14px;
                    }
                    table, th, td {
                        border: 1px solid black;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #4CAF50;
                        color: white;
                    }
                </style>
            </head>
            <body>
                <h1>${companyInfo.name}</h1>
                <p><strong>Address:</strong> ${companyInfo.address}</p>
                <p><strong>Email:</strong> ${companyInfo.email} | <strong>Phone:</strong> ${companyInfo.phone}</p>
                <h2>Loan Balances Statement</h2>
                ${tableContent}
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    });
});

// Search and filter the table content based on user input
document.getElementById('search-input').addEventListener('keyup', function () {
    const filter = this.value.toUpperCase();
    const rows = document.querySelectorAll('#loan-balance-table tbody tr');

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
});

// Initialize and fetch loan balances on page load
window.onload = function () {
    fetchLoanBalances();
};
