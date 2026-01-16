const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./database");

console.log("Starting College Finance Server...");

const app = express();
const JWT_SECRET = "super_secret_college_key";

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Session expired or invalid token." });
        req.user = user;
        next();
    });
};

// --- AUTH ---
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admin WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "Invalid credentials" });
        if (bcrypt.compareSync(password, user.password_hash)) {
            const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token, username: user.username });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

app.put("/api/auth/change-password", authenticateToken, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const username = req.user.username;

    db.get("SELECT * FROM admin WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "User not found" });

        // Verify old password
        if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
            return res.status(401).json({ error: "Incorrect old password" });
        }

        // Hash new password and update
        const newHash = bcrypt.hashSync(newPassword, 10);
        db.run("UPDATE admin SET password_hash = ? WHERE username = ?", [newHash, username], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Password updated successfully" });
        });
    });
});

app.put("/api/auth/change-username", authenticateToken, (req, res) => {
    const { newUsername, password } = req.body;
    const currentUsername = req.user.username;

    db.get("SELECT * FROM admin WHERE username = ?", [currentUsername], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "User not found" });

        // Verify password before allowing username change
        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Update username
        db.run("UPDATE admin SET username = ? WHERE username = ?", [newUsername, currentUsername], (err) => {
            if (err) return res.status(500).json({ error: "Username already taken or error occurred" });

            // Issue new token with new username
            const newToken = jwt.sign({ username: newUsername }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token: newToken, username: newUsername, message: "Username updated successfully" });
        });
    });
});

// --- YEARS & DEPARTMENTS CONFIG ---

// Get all Years
app.get("/api/years", authenticateToken, (req, res) => {
    db.all("SELECT * FROM student_years ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add new Year
app.post("/api/years", authenticateToken, (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO student_years (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name });
    });
});

// Add a master Department (Robust Find-or-Create)
app.post("/api/departments", authenticateToken, (req, res) => {
    const { name } = req.body;
    // 1. Try to insert
    db.run("INSERT OR IGNORE INTO departments (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // 2. Fetch the ID (whether inserted or ignored)
        db.get("SELECT id, name FROM departments WHERE name = ?", [name], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(500).json({ error: "Failed to retrieve department" });
            res.json(row);
        });
    });
});

// Get all master Departments
app.get("/api/departments", authenticateToken, (req, res) => {
    db.all("SELECT * FROM departments ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Departments mapped to a specific Year
app.get("/api/years/:yearId/departments", authenticateToken, (req, res) => {
    const { yearId } = req.params;
    const sql = `
        SELECT d.* 
        FROM departments d
        JOIN year_departments yd ON d.id = yd.dept_id
        WHERE yd.year_id = ?
        ORDER BY d.name
    `;
    db.all(sql, [yearId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Toggle Dept in Year (Add/Remove)
app.post("/api/years/:yearId/departments", authenticateToken, (req, res) => {
    const { yearId } = req.params;
    const { deptId, action } = req.body; // action: 'add' or 'remove'

    if (action === 'add') {
        db.run("INSERT OR IGNORE INTO year_departments (year_id, dept_id) VALUES (?, ?)", [yearId, deptId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else {
        db.run("DELETE FROM year_departments WHERE year_id = ? AND dept_id = ?", [yearId, deptId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }
});

// --- STUDENTS API ---
app.get("/api/students", authenticateToken, (req, res) => {
    const { yearId, deptId } = req.query;
    let sql = "SELECT * FROM students WHERE 1=1";
    const params = [];

    if (yearId) { sql += " AND year_id = ?"; params.push(yearId); }
    if (deptId) { sql += " AND department_id = ?"; params.push(deptId); }

    sql += " ORDER BY name ASC";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/students", authenticateToken, (req, res) => {
    const { name, names, year_id, department_id } = req.body;

    // Logic: Find the most common/recent 'total_fee' to use as default for new students
    // This supports the "Global Budget" requirement without a separate settings table
    const getFeeSql = `SELECT total_fee FROM students ORDER BY updated_at DESC LIMIT 1`;

    db.get(getFeeSql, [], (err, row) => {
        const defaultFee = row ? row.total_fee : 0;

        if (names && Array.isArray(names)) {
            // Bulk Insert
            const placeholders = names.map(() => '(?, ?, ?, ?, 0)').join(',');
            const sql = `INSERT INTO students (name, year_id, department_id, total_fee, amount_paid) VALUES ${placeholders}`;
            const params = [];
            names.forEach(n => params.push(n, year_id, department_id, defaultFee));

            db.run(sql, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, count: names.length });
            });
        } else {
            // Single Insert
            const sql = "INSERT INTO students (name, year_id, department_id, total_fee, amount_paid) VALUES (?, ?, ?, ?, 0)";
            db.run(sql, [name, year_id, department_id, defaultFee], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID });
            });
        }
    });
});

app.put("/api/students/:id/fees", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { total_fee, amount_paid } = req.body;

    // Auto-update is_paid status based on balance
    const is_paid = (total_fee - amount_paid) <= 0 ? 1 : 0;

    const sql = "UPDATE students SET total_fee = ?, amount_paid = ?, is_paid = ? WHERE id = ?";
    db.run(sql, [total_fee, amount_paid, is_paid, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, is_paid });
    });
});

// --- TRANSACTIONS ---
app.get("/api/transactions", authenticateToken, (req, res) => {
    const { yearId, deptId } = req.query;
    let query = `
        SELECT t.*, sy.name as year_name, d.name as dept_name 
        FROM transactions t
        LEFT JOIN student_years sy ON t.year_id = sy.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE 1=1
    `;
    const params = [];
    if (yearId) { query += " AND t.year_id = ?"; params.push(yearId); }
    if (deptId) { query += " AND t.department_id = ?"; params.push(deptId); }
    query += " ORDER BY t.date DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/transactions", authenticateToken, (req, res) => {
    const { type, amount, payment_mode, date, description, year_id, department_id } = req.body;
    db.run(
        `INSERT INTO transactions (type, amount, payment_mode, date, description, spent_by, year_id, department_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, amount, payment_mode, date, description, type === 'expense' ? req.body.spent_by : null, year_id, department_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// --- DASHBOARD ---
app.get("/api/dashboard", authenticateToken, (req, res) => {
    const { yearId, deptId } = req.query;
    let whereClause = "WHERE 1=1";
    const params = [];
    if (yearId) { whereClause += " AND year_id = ?"; params.push(yearId); }
    if (deptId) { whereClause += " AND department_id = ?"; params.push(deptId); }

    const sql = `
        SELECT 
            SUM(CASE WHEN type='collection' THEN amount ELSE 0 END) as total_collection,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
        FROM transactions
        ${whereClause}
    `;

    const yearStatsSql = `
        SELECT sy.name as year, SUM(t.amount) as total 
        FROM transactions t 
        JOIN student_years sy ON t.year_id = sy.id 
        WHERE t.type = 'collection' 
        GROUP BY sy.name
        ORDER BY sy.name
    `;

    const modeStatsSql = `
        SELECT payment_mode, SUM(amount) as total
        FROM transactions
        WHERE type = 'collection'
        GROUP BY payment_mode
    `;

    db.get(sql, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        const collection = row.total_collection || 0;
        const expense = row.total_expense || 0;

        db.all(yearStatsSql, [], (err, yearRows) => {
            if (err) return res.status(500).json({ error: err.message });

            db.all(modeStatsSql, [], (err, modeRows) => {
                if (err) return res.status(500).json({ error: err.message });

                // Process modes into object { cash: 0, gpay: 0 }
                const modeStats = { cash: 0, gpay: 0 };
                modeRows.forEach(r => {
                    if (r.payment_mode && r.payment_mode.toLowerCase() === 'cash') modeStats.cash = r.total;
                    if (r.payment_mode && r.payment_mode.toLowerCase() === 'gpay') modeStats.gpay = r.total;
                });

                res.json({
                    collection,
                    expense,
                    balance: collection - expense,
                    yearStats: yearRows,
                    modeStats
                });
            });
        });
    });
});

// --- REPORTS ---
app.get("/api/reports/breakdown", authenticateToken, (req, res) => {
    const sql = `
        SELECT 
            sy.name as year_name,
            d.name as dept_name,
            t.payment_mode,
            SUM(t.amount) as total
        FROM transactions t
        JOIN student_years sy ON t.year_id = sy.id
        JOIN departments d ON t.department_id = d.id
        WHERE t.type = 'collection'
        GROUP BY sy.name, d.name, t.payment_mode
        ORDER BY sy.name, d.name
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Transform flat rows into hierarchy
        // Structure: [{ yearName: "1st", departments: [{ deptName: "CSE", cash: 0, gpay: 0, total: 0 }] }]
        const hierarchy = [];

        rows.forEach(row => {
            let year = hierarchy.find(y => y.yearName === row.year_name);
            if (!year) {
                year = { yearName: row.year_name, departments: [] };
                hierarchy.push(year);
            }

            let dept = year.departments.find(d => d.deptName === row.dept_name);
            if (!dept) {
                dept = { deptName: row.dept_name, cash: 0, gpay: 0, total: 0 };
                year.departments.push(dept);
            }

            const amount = row.total;
            const mode = row.payment_mode ? row.payment_mode.toLowerCase() : 'unknown';

            if (mode === 'cash') dept.cash += amount;
            if (mode === 'gpay') dept.gpay += amount;
            dept.total += amount;
        });

        res.json(hierarchy);
    });
});

// --- STUDENTS API ---
app.get("/api/students", authenticateToken, (req, res) => {
    const { yearId, deptId } = req.query;
    let sql = "SELECT * FROM students WHERE 1=1";
    const params = [];

    if (yearId) { sql += " AND year_id = ?"; params.push(yearId); }
    if (deptId) { sql += " AND department_id = ?"; params.push(deptId); }

    sql += " ORDER BY name ASC";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
    });
});

app.put("/api/students/:id/fees", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { total_fee, amount_paid } = req.body;

    // Auto-update is_paid status based on balance
    const is_paid = (total_fee - amount_paid) <= 0 ? 1 : 0;

    const sql = "UPDATE students SET total_fee = ?, amount_paid = ?, is_paid = ? WHERE id = ?";
    db.run(sql, [total_fee, amount_paid, is_paid, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, is_paid });
    });
});
app.put("/api/students/bulk-fees", authenticateToken, (req, res) => {
    const { year_id, department_id, total_fee } = req.body;

    let sql = `
        UPDATE students 
        SET total_fee = ?, 
            is_paid = CASE WHEN (? - amount_paid) <= 0 THEN 1 ELSE 0 END
    `;
    const params = [total_fee, total_fee];

    // Conditional filtering if keys exist
    const conditions = [];
    if (year_id) {
        conditions.push("year_id = ?");
        params.push(year_id);
    }
    if (department_id && department_id !== 'all') {
        conditions.push("department_id = ?");
        params.push(department_id);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, count: this.changes });
    });
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
