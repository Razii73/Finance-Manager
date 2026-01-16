const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'finance.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // 1. Admin Table
    db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT
    )`);

    // 2. Student Years Table (1st Year, 2nd Year, etc.)
    db.run(`CREATE TABLE IF NOT EXISTS student_years (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        is_active INTEGER DEFAULT 1
    )`);

    // 3. Departments Master Table
    db.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
    )`);

    // 4. Year-Department Mapping Link
    db.run(`CREATE TABLE IF NOT EXISTS year_departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year_id INTEGER,
        dept_id INTEGER,
        FOREIGN KEY (year_id) REFERENCES student_years(id),
        FOREIGN KEY (dept_id) REFERENCES departments(id),
        UNIQUE(year_id, dept_id)
    )`);

    // 5. Transactions Table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT CHECK(type IN ('collection', 'expense')),
        amount REAL,
        payment_mode TEXT CHECK(payment_mode IN ('cash', 'gpay')),
        date TEXT,
        description TEXT,
        spent_by TEXT,
        year_id INTEGER,
        department_id INTEGER,
        FOREIGN KEY (year_id) REFERENCES student_years(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
    )`);

    // 6. Students Table
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        year_id INTEGER,
        department_id INTEGER,
        is_paid INTEGER DEFAULT 0,
        total_fee REAL DEFAULT 0,
        amount_paid REAL DEFAULT 0,
        FOREIGN KEY (year_id) REFERENCES student_years(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
    )`, (err) => {
        if (!err) {
            // Attempt to add columns if they don't exist (Migration for existing DB)
            db.run("ALTER TABLE students ADD COLUMN total_fee REAL DEFAULT 0", () => { });
            db.run("ALTER TABLE students ADD COLUMN amount_paid REAL DEFAULT 0", () => { });
        }
    });

    // Seed Admin only
    db.get("SELECT * FROM admin WHERE username = ?", ['admin'], (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('admin123', 10);
            db.run("INSERT INTO admin (username, password_hash) VALUES (?, ?)", ['admin', hash], (err) => {
                if (err) console.log(err);
                else console.log("Default admin created: admin / admin123");
            });
        }
    });

    // NO Default Years/Depts as per user request
});

module.exports = db;
