// Firebase references
const employeesDb = firebase.database().ref('employees');
const salarySlipsDb = firebase.database().ref('salary_slips');
const loansDb = firebase.database().ref('loans');

// Fetch dashboard data on load
window.onload = function () {
    fetchEmployeeCount();
    fetchSalaryData();
    fetchLoanData();
    populateSalaryChart();
};

// Fetch the number of employees
function fetchEmployeeCount() {
    employeesDb.once('value', (snapshot) => {
        const employeeCount = snapshot.numChildren(); // Get the number of employees
        document.getElementById('employee-count').textContent = employeeCount;
    });
}

// Fetch salary slips data for the current month and total salary paid
function fetchSalaryData() {
    const currentMonth = new Date().getMonth(); // Get current month as index (0 = January)

    salarySlipsDb.once('value', (snapshot) => {
        let salarySlipCount = 0;
        let totalSalary = 0;

        snapshot.forEach((childSnapshot) => {
            const salarySlip = childSnapshot.val();
            const slipDate = new Date(salarySlip.date);
            const slipMonth = slipDate.getMonth(); // Get the month of the salary slip

            // If the salary slip is from the current month
            if (slipMonth === currentMonth) {
                salarySlipCount++; // Count salary slips for the current month
            }

            totalSalary += parseFloat(salarySlip.netPayable) || 0; // Calculate total salary paid
        });

        // Update the DOM with the calculated values
        document.getElementById('salary-slip-count').textContent = salarySlipCount; // Salary slips for current month
        document.getElementById('total-salary').textContent = totalSalary.toFixed(2); // Total salary paid
    });
}

// Fetch loan data
function fetchLoanData() {
    loansDb.once('value', (snapshot) => {
        let loansGivenCount = 0;
        let totalLoanAmount = 0;

        snapshot.forEach((childSnapshot) => {
            const loan = childSnapshot.val();

            loansGivenCount++; // Count number of loans given
            totalLoanAmount += parseFloat(loan.loanAmount) || 0; // Calculate total loan amount given
        });

        document.getElementById('loans-given-count').textContent = loansGivenCount;
        document.getElementById('total-loan-amount').textContent = totalLoanAmount.toFixed(2);
    });
}

// Populate the salary chart with data from salary slips
function populateSalaryChart() {
    // Create an array to store total salary paid for each month
    const salaryData = new Array(12).fill(0); // Initialize array with 12 months (index 0 for January, etc.)

    salarySlipsDb.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const salarySlip = childSnapshot.val();
            const monthIndex = new Date(salarySlip.date).getMonth(); // Get the month index (0 = January, 11 = December)

            salaryData[monthIndex] += parseFloat(salarySlip.netPayable) || 0; // Add the net payable salary to the respective month
        });

        // Update the chart with the salary data
        salaryChart.data.datasets[0].data = salaryData; // Populate chart with salary data
        salaryChart.update(); // Update the chart
    });
}

// Sample Chart.js setup (for graphing salary data per month)
const ctx = document.getElementById('salary-chart').getContext('2d');
const salaryChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [{
            label: 'Total Salary Paid (Per Month)',
            data: [], // Initially empty, will be populated with Firebase data
            backgroundColor: 'rgba(0, 128, 128, 0.8)', // Teal color
            borderColor: 'rgba(0, 128, 128, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // Allows chart resizing
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString(); // Format numbers with commas
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#333' // Color for labels
                }
            }
        }
    }
});

// Show toast notification function (for user feedback)
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.innerText = message;
    toast.classList.add('show');

    // Automatically hide the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // Duration of toast visibility (3 seconds)
}
