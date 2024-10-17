import inquirer from "inquirer";
import { pool, connectToDb } from "./connection.js";
// call function from connection.ts to connect to database
async function startApp() {
    // Call the function to connect to the database
    try {
        await connectToDb();
        console.log("Connected to the database.");
        performActions();
    }
    catch (err) {
        console.error("Error connecting to the database:", err);
    }
}
// function to prompt user with options
function performActions() {
    inquirer
        .prompt([
        {
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
                "View all Employees",
                "Add Employee",
                "Update Employee Role",
                "View All Roles",
                "Add Role",
                "View All Departments",
                "Add Department",
                "Quit",
            ],
        },
    ])
        .then((answers) => {
        switch (answers.action) {
            case "View all Employees":
                viewAll("employee");
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "View All Roles":
                viewAll("role");
                break;
            case "Add Role":
                addRole();
                break;
            case "View All Departments":
                viewAll("department");
                break;
            case "Add Department":
                addDepartment();
                break;
            case "Quit":
                break;
        }
    });
}
function viewAll(tableName) {
    const sql = `SELECT * FROM ${tableName}`;
    pool.query(sql, (err, result) => {
        if (err) {
            console.log(`Error: ${err.message}`);
            return;
        }
        else {
            if (result.rows.length === 0) {
                // no results in database
                console.log(`No ${tableName}s in database.`);
            }
            else {
                console.table(result.rows); // prints all results in table format
            }
        }
        performActions(); // return to prompter
    });
}
async function checkExistence(tableName, roleID) {
    // create SQL statement to check if it exists
    const roleCheckSQL = `SELECT * FROM ${tableName} WHERE id = $1`;
    try {
        const result = await pool.query(roleCheckSQL, [roleID]);
        if (result.rows.length === 0) {
            // no matching id was found
            return false;
        }
        else {
            return true;
        }
    }
    catch (err) {
        console.log("Error checking role", err);
        return false;
    }
}
async function addEmployee() {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "firstName",
            message: "Enter employee's first name: ",
        },
        {
            type: "input",
            name: "lastName",
            message: "Enter employee's last name: ",
        },
        {
            type: "input",
            name: "roleID",
            message: "Enter employee's role ID: ",
        },
        {
            type: "input",
            name: "managerID",
            message: "Enter employee's manger's ID (leave blank if none): ",
        },
    ]);
    try {
        // Set managerID to null if blank
        const managerID = answers.managerID.trim() === "" ? null : answers.managerID;
        const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
        // check if role exists
        const roleExists = await checkExistence("role", answers.roleID);
        if (roleExists) {
            // call sql statement to add employee if role exists using parametrization to avoid SQL injection (prevent vulnerabilities)
            await pool.query(sql, [
                answers.firstName,
                answers.lastName,
                answers.roleID,
                managerID,
            ]);
            console.log(`Employee ${answers.firstName} ${answers.lastName} added.`);
        }
        else {
            console.log("Role ID does not exist!");
        }
    }
    catch (err) {
        console.log("Error adding employee: ", err);
    }
    // return to prompter
    performActions();
}
async function addRole() {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "title",
            message: "Enter role title: ",
        },
        {
            type: "input",
            name: "salary",
            message: "Enter role salary: ",
        },
        {
            type: "input",
            name: "departmentID",
            message: "Enter role department ID: ",
        },
    ]);
    try {
        const sql = `INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)`;
        const departmentExists = await checkExistence("department", answers.departmentID);
        if (departmentExists) {
            await pool.query(sql, [
                answers.title,
                answers.salary,
                answers.departmentID,
            ]);
            console.log(`Role ${answers.title} with salary ${answers.salary} added with a department ID: ${answers.departmentID} successfully.`);
        }
        else {
            console.log("Department ID does not exist!");
        }
    }
    catch (err) {
        console.log("Error adding role: ", err);
    }
    // return to prompter
    performActions();
}
async function addDepartment() {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "departmentName",
            message: "Enter the department's name: ",
        },
    ]);
    try {
        const sql = `INSERT INTO department (name) VALUES ($1)`;
        pool.query(sql, [answers.departmentName]);
        console.log(`Department ${answers.departmentName} added successfully.`);
    }
    catch (err) {
        console.log("Error adding department: ", err);
    }
    // return to prompter
    performActions();
}
async function updateEmployeeRole() {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "employeeID",
            message: `Enter the employee's ID: `,
        },
        {
            type: "input",
            name: "newRoleID",
            message: `Enter the new role's ID: `,
        },
    ]);
    try {
        const sql = `UPDATE employee SET role_id = $1 WHERE id = $2`;
        const employeeExists = await checkExistence("employee", answers.employeeID);
        const roleExists = await checkExistence("role", answers.newRoleID);
        if (employeeExists && roleExists) {
            await pool.query(sql, [answers.newRoleID, answers.employeeID]);
        }
        else if (employeeExists && !roleExists) {
            console.log("This ID for role does not exist!");
        }
        else if (!employeeExists && roleExists) {
            console.log("An employee with this ID does not exist!");
        }
    }
    catch (err) {
        console.log("Error adding role: ", err);
    }
    // return to prompter
    performActions();
}
// Start the application
startApp();
