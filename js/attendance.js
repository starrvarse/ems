document.addEventListener('DOMContentLoaded', function () {
    const employeeSelect = document.getElementById('employee-select');
    const monthSelect = document.getElementById('month-select');
    const daysGrid = document.getElementById('days-grid');
    const monthTitle = document.getElementById('month-title');
    let employeesData = {};  // Store employee data after fetching it
    let attendanceData = {};  // Store attendance data for the selected employee

    // Month and days mapping (to handle February leap year)
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Fetch employees from Firebase real-time database
    fetchEmployees();

    // Update the calendar when an employee or month is selected
    employeeSelect.addEventListener('change', function () {
        if (employeeSelect.value) {
            fetchAttendanceData(employeeSelect.value, parseInt(monthSelect.value));
        }
    });

    monthSelect.addEventListener('change', function () {
        if (employeeSelect.value) {
            fetchAttendanceData(employeeSelect.value, parseInt(monthSelect.value));
        }
    });

    // Function to fetch employees from Firebase real-time database
    function fetchEmployees() {
        const employeesRef = firebase.database().ref('employees'); // Reference to 'employees' in the database

        employeesRef.on('value', (snapshot) => {
            employeesData = snapshot.val();  // Store all employee data
            employeeSelect.innerHTML = '<option value="">Select Employee</option>'; // Clear previous options

            // Populate the dropdown with employee data from Firebase
            for (let id in employeesData) {
                const employee = employeesData[id];
                const option = document.createElement('option');
                option.value = id;
                option.textContent = employee.name;
                employeeSelect.appendChild(option);
            }
        }, (error) => {
            console.error('Error fetching employee data:', error);
        });
    }

    // Function to fetch attendance data for a specific employee and month
    function fetchAttendanceData(employeeId, monthIndex) {
        const attendanceRef = firebase.database().ref(`attendance/${employeeId}`);
        attendanceRef.on('value', (snapshot) => {
            attendanceData = snapshot.val() || {};  // Get attendance data or empty object
            generateCalendar(monthIndex);  // Re-generate the calendar with attendance data
        });
    }

    // Initialize the calendar with January by default
    generateCalendar(0);

    // Function to generate the calendar based on the selected month
    function generateCalendar(monthIndex) {
        // Clear previous days
        daysGrid.innerHTML = "";

        // Set the month title
        monthTitle.textContent = monthNames[monthIndex];

        // Calculate the number of days in the selected month
        const numDays = monthDays[monthIndex];
        const firstDay = new Date(2024, monthIndex, 1).getDay(); // 2024 to handle leap year correctly

        // Add blank days for alignment (for days before the first day of the month)
        for (let i = 0; i < firstDay; i++) {
            const blankDay = document.createElement('div');
            blankDay.classList.add('day');
            daysGrid.appendChild(blankDay);
        }

        // Generate the days of the month
        for (let day = 1; day <= numDays; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');
            dayDiv.textContent = day;

            // Check if this date is already marked as present in attendance data
            const dateKey = `${2024}-${monthIndex + 1}-${day}`;
            if (attendanceData[dateKey] && attendanceData[dateKey].present) {
                dayDiv.classList.add('selected');  // Mark as selected if already present
            }

            // Highlight weekends
            const dayOfWeek = (firstDay + day - 1) % 7;
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayDiv.classList.add('weekend');
            }

            // Add a click event listener to each day
            dayDiv.addEventListener('click', function () {
                if (employeeSelect.value) {
                    const selectedEmployeeId = employeeSelect.value;
                    const selectedEmployee = employeesData[selectedEmployeeId];  // Get employee details
                    const selectedDate = `${2024}-${monthIndex + 1}-${day}`; // Format: YYYY-MM-DD

                    if (dayDiv.classList.contains('selected')) {
                        // Unselect the date (remove from Firebase)
                        removeAttendance(selectedEmployeeId, selectedDate);
                        dayDiv.classList.remove('selected');
                    } else {
                        // Select the date (save in Firebase)
                        saveAttendance(selectedEmployeeId, selectedEmployee, selectedDate);
                        dayDiv.classList.add('selected');
                    }
                } else {
                    alert("Please select an employee first!");
                }
            });

            daysGrid.appendChild(dayDiv);
        }
    }

    // Function to save attendance data to Firebase
    function saveAttendance(employeeId, employee, date) {
        const attendanceRef = firebase.database().ref(`attendance/${employeeId}/${date}`);

        // Store attendance with the selected date, employee name, and employee code
        attendanceRef.set({
            present: true,
            employeeName: employee.name,  // Store employee name
            employeeCode: employee.code  // Store employee code
        }, (error) => {
            if (error) {
                console.error('Error saving attendance data:', error);
            } else {
                console.log(`Attendance saved for ${date} for employee ${employeeId}`);
            }
        });
    }

    // Function to remove attendance data from Firebase
    function removeAttendance(employeeId, date) {
        const attendanceRef = firebase.database().ref(`attendance/${employeeId}/${date}`);

        // Remove the attendance entry for the given date
        attendanceRef.remove((error) => {
            if (error) {
                console.error('Error removing attendance data:', error);
            } else {
                console.log(`Attendance removed for ${date} for employee ${employeeId}`);
            }
        });
    }
});
