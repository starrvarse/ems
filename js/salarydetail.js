document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('salary-table-body');

    // Fetch employee data from Firebase Realtime Database
    function fetchEmployeeData() {
        const employeesRef = firebase.database().ref('employees'); // Reference to the 'employees' node

        employeesRef.on('value', (snapshot) => {
            const employees = snapshot.val();
            tableBody.innerHTML = ''; // Clear the table before appending new data

            for (let id in employees) {
                const employee = employees[id];
                const employeeName = employee.name || 'N/A'; // Safeguard if name is missing
                const employeeCode = employee.code || 'N/A'; // Safeguard if code is missing
                const employeeSalary = employee.salary || 'N/A'; // Safeguard if salary is missing

                // Fetch attendance data for each employee
                fetchAttendanceData(id, employeeName, employeeCode, employeeSalary);
            }
        }, (error) => {
            console.error('Error fetching employee data:', error);
        });
    }

    // Function to fetch attendance data for a specific employee, resetting at the end of each month
    function fetchAttendanceData(employeeId, employeeName, employeeCode, employeeSalary) {
        const attendanceRef = firebase.database().ref(`attendance/${employeeId}`); // Reference to the 'attendance' node for each employee

        attendanceRef.on('value', (snapshot) => {
            const attendance = snapshot.val();
            let daysPresent = 0;

            // Get the current date and time
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-11, so add 1
            const currentDay = currentDate.getDate();

            // Get the first day and last day of the current month
            const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0); // Last day of current month

            // Loop through attendance records
            for (let date in attendance) {
                const [year, month, day] = date.split('-').map(Number); // Parse date from Firebase (YYYY-M-D)

                // Create a JavaScript Date object for comparison
                const attendanceDate = new Date(year, month - 1, day);

                // Only count days within the current month and today's date
                if (attendanceDate >= firstDayOfMonth && attendanceDate <= lastDayOfMonth) {
                    if (attendance[date].present === true) {
                        daysPresent++; // Count the number of days where 'present' is true within the current month
                    }
                }
            }

            // Calculate payable salary using the new formula: Payable Salary = Salary / 26 * Attendance
            const payableSalary = ((employeeSalary / 26) * daysPresent).toFixed(2); // Calculate payable salary

            // Save the calculated data in Firebase under 'monthly_salary' node
            saveMonthlySalary(employeeId, employeeName, employeeCode, daysPresent, payableSalary);

            // Append the row with employee and attendance data
            appendEmployeeRow(employeeName, employeeCode, employeeSalary, daysPresent, payableSalary);
        }, (error) => {
            console.error('Error fetching attendance data:', error);
        });
    }

    // Function to append a row with employee details and calculated data
    function appendEmployeeRow(employeeName, employeeCode, employeeSalary, attendance, payableSalary) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employeeName}</td>
            <td>${employeeCode}</td>
            <td>${employeeSalary}</td>
            <td>${attendance}</td> <!-- Total days present in the current month -->
            <td>${payableSalary}</td>
        `;
        tableBody.appendChild(row);
    }

    // Function to save the calculated salary data to the Realtime Database
    function saveMonthlySalary(employeeId, employeeName, employeeCode, attendance, payableSalary) {
        const monthlySalaryRef = firebase.database().ref(`monthly_salary/${employeeId}/${new Date().getFullYear()}-${new Date().getMonth() + 1}`); // Save under 'monthly_salary/{employeeId}/{year-month}'

        const salaryData = {
            employeeName: employeeName,
            employeeCode: employeeCode,
            attendance: attendance,
            payableSalary: payableSalary
        };

        // Save the data to Firebase
        monthlySalaryRef.set(salaryData, (error) => {
            if (error) {
                console.error('Error saving monthly salary data:', error);
            } else {
                console.log('Monthly salary data saved successfully for employee:', employeeName);
            }
        });
    }

    // Function to reset the monthly salary data at the start of each month
    function resetMonthlySalary() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-11
        const currentYear = currentDate.getFullYear();

        // Check if it's the first day of the month
        if (currentDate.getDate() === 1) {
            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const yearToDelete = currentMonth === 1 ? currentYear - 1 : currentYear;

            const previousMonthRef = firebase.database().ref(`monthly_salary/${yearToDelete}-${previousMonth}`);
            
            // Delete the previous month's salary data
            previousMonthRef.remove((error) => {
                if (error) {
                    console.error('Error resetting previous month data:', error);
                } else {
                    console.log('Previous month salary data reset successfully.');
                }
            });
        }
    }

    // Call the function to fetch employee data and attendance
    fetchEmployeeData();

    // Call the function to reset previous month's salary data if it's the 1st of the month
    resetMonthlySalary();
});
