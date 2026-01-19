const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./database");

console.log("Starting College Finance Server (Postgres Mode)...");

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
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query("SELECT * FROM admin WHERE username = $1", [username]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: "Invalid credentials" });
        if (bcrypt.compareSync(password, user.password_hash)) {
            const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token, username: user.username });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/auth/change-password", authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const username = req.user.username;

    try {
        const result = await db.query("SELECT * FROM admin WHERE username = $1", [username]);
        const user = result.rows[0];

        if (!user) return res.status(404).json({ error: "User not found" });

        // Verify old password
        if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
            return res.status(401).json({ error: "Incorrect old password" });
        }

        // Hash new password and update
        const newHash = bcrypt.hashSync(newPassword, 10);
        await db.query("UPDATE admin SET password_hash = $1 WHERE username = $2", [newHash, username]);
        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/auth/change-username", authenticateToken, async (req, res) => {
    const { newUsername, password } = req.body;
    const currentUsername = req.user.username;

    try {
        const result = await db.query("SELECT * FROM admin WHERE username = $1", [currentUsername]);
        const user = result.rows[0];

        if (!user) return res.status(404).json({ error: "User not found" });

        // Verify password
        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Update username
        await db.query("UPDATE admin SET username = $1 WHERE username = $2", [newUsername, currentUsername]);

        // Issue new token
        const newToken = jwt.sign({ username: newUsername }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token: newToken, username: newUsername, message: "Username updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Username already taken or error occurred" });
    }
});

// --- YEARS & DEPARTMENTS CONFIG ---

app.get("/api/years", authenticateToken, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM student_years ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/years", authenticateToken, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await db.query("INSERT INTO student_years (name) VALUES ($1) RETURNING id, name", [name]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("DB Insert Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/departments", authenticateToken, async (req, res) => {
    const { name } = req.body;
    try {
        // Try insert, do nothing on conflict
        await db.query("INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
        const result = await db.query("SELECT id, name FROM departments WHERE name = $1", [name]);

        if (result.rows.length === 0) return res.status(500).json({ error: "Failed to retrieve department" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/departments", authenticateToken, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM departments ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/years/:yearId/departments", authenticateToken, async (req, res) => {
    const { yearId } = req.params;
    const sql = `
        SELECT d.* 
        FROM departments d
        JOIN year_departments yd ON d.id = yd.dept_id
        WHERE yd.year_id = $1
        ORDER BY d.name
    `;
    try {
        const result = await db.query(sql, [yearId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/years/:yearId/departments", authenticateToken, async (req, res) => {
    const { yearId } = req.params;
    const { deptId, action } = req.body;

    try {
        if (action === 'add') {
            await db.query("INSERT INTO year_departments (year_id, dept_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [yearId, deptId]);
        } else {
            await db.query("DELETE FROM year_departments WHERE year_id = $1 AND dept_id = $2", [yearId, deptId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- STUDENTS API ---

app.get("/api/students", authenticateToken, async (req, res) => {
    const { yearId, deptId } = req.query;
    let sql = "SELECT * FROM students WHERE 1=1";
    const params = [];
    let pIdx = 1;

    if (yearId) { sql += ` AND year_id = $${pIdx++}`; params.push(yearId); }
    if (deptId) { sql += ` AND department_id = $${pIdx++}`; params.push(deptId); }

    sql += " ORDER BY name ASC";

    try {
        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/students", authenticateToken, async (req, res) => {
    const { name, names, year_id, department_id } = req.body;

    try {
        const feeRes = await db.query("SELECT total_fee FROM students ORDER BY id DESC LIMIT 1");
        const defaultFee = feeRes.rows.length > 0 ? feeRes.rows[0].total_fee : 0;

        if (names && Array.isArray(names)) {
            // Bulk Insert
            if (names.length === 0) return res.json({ count: 0 });

            // Generate placeholders like ($1, $2, $3, $4, 0), ($5, $6, $7, $8, 0)...
            const values = [];
            const placeholders = [];
            let pIdx = 1;

            names.forEach(n => {
                values.push(n, year_id, department_id, defaultFee);
                placeholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, 0)`);
            });

            const sql = `INSERT INTO students (name, year_id, department_id, total_fee, amount_paid) VALUES ${placeholders.join(',')} RETURNING id`;
            const result = await db.query(sql, values);
            res.json({ id: result.rows[result.rows.length - 1].id, count: names.length });
        } else {
            // Single Insert
            const sql = "INSERT INTO students (name, year_id, department_id, total_fee, amount_paid) VALUES ($1, $2, $3, $4, 0) RETURNING id";
            const result = await db.query(sql, [name, year_id, department_id, defaultFee]);
            res.json({ id: result.rows[0].id });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/students/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, year_id, department_id } = req.body;

    try {
        await db.query("UPDATE students SET name = $1, year_id = $2, department_id = $3 WHERE id = $4", [name, year_id, department_id, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/students/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM students WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/students/:id/fees", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { total_fee, amount_paid } = req.body;
    const is_paid = (total_fee - amount_paid) <= 0 ? 1 : 0;

    try {
        await db.query("UPDATE students SET total_fee = $1, amount_paid = $2, is_paid = $3 WHERE id = $4", [total_fee, amount_paid, is_paid, id]);
        res.json({ success: true, is_paid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/students/bulk-fees", authenticateToken, async (req, res) => {
    const { year_id, department_id, total_fee } = req.body;

    let sql = `
        UPDATE students 
        SET total_fee = $1, 
            is_paid = CASE WHEN ($2 - amount_paid) <= 0 THEN 1 ELSE 0 END
    `;
    const params = [total_fee, total_fee];
    let pIdx = 3;

    const conditions = [];
    if (year_id) {
        conditions.push(`year_id = $${pIdx++}`);
        params.push(year_id);
    }
    if (department_id && department_id !== 'all') {
        conditions.push(`department_id = $${pIdx++}`);
        params.push(department_id);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    try {
        const result = await db.query(sql, params);
        res.json({ success: true, count: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TRANSACTIONS ---

app.get("/api/transactions", authenticateToken, async (req, res) => {
    const { yearId, deptId } = req.query;
    let query = `
        SELECT t.*, sy.name as year_name, d.name as dept_name 
        FROM transactions t
        LEFT JOIN student_years sy ON t.year_id = sy.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (yearId) { query += ` AND t.year_id = $${pIdx++}`; params.push(yearId); }
    if (deptId) { query += ` AND t.department_id = $${pIdx++}`; params.push(deptId); }

    query += " ORDER BY t.date DESC";

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/transactions", authenticateToken, async (req, res) => {
    const { type, amount, payment_mode, date, description, year_id, department_id, spent_by } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO transactions (type, amount, payment_mode, date, description, spent_by, year_id, department_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [type, amount, payment_mode, date, description, type === 'expense' ? spent_by : null, year_id, department_id]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DASHBOARD ---

app.get("/api/dashboard", authenticateToken, async (req, res) => {
    const { yearId, deptId } = req.query;
    let whereClause = "WHERE 1=1";
    const params = [];
    let pIdx = 1;

    if (yearId) { whereClause += ` AND year_id = $${pIdx++}`; params.push(yearId); }
    if (deptId) { whereClause += ` AND department_id = $${pIdx++}`; params.push(deptId); }

    const sql = `
        SELECT 
            SUM(CASE WHEN type='collection' THEN amount ELSE 0 END) as total_collection,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
        FROM transactions
        ${whereClause}
    `;

    // Note: Reusing params logic is tricky if executed separately, but here we can just execute sequentially or use pool helper.
    // For simplicity, we re-run parameter binding logic or use separate variables. 
    // Since queries are independent but share filters, simple sequential await is fine.

    try {
        const filters = [];
        let fIdx = 1;
        if (yearId) filters.push(yearId);
        if (deptId) filters.push(deptId);

        const mainRes = await db.query(sql, filters);
        const collection = parseFloat(mainRes.rows[0].total_collection || 0);
        const expense = parseFloat(mainRes.rows[0].total_expense || 0);

        const yearStatsSql = `
            SELECT sy.name as year, SUM(t.amount) as total 
            FROM transactions t 
            JOIN student_years sy ON t.year_id = sy.id 
            WHERE t.type = 'collection' 
            GROUP BY sy.name
            ORDER BY sy.name
        `;
        const yearRes = await db.query(yearStatsSql);

        const modeStatsSql = `
            SELECT payment_mode, SUM(amount) as total
            FROM transactions
            WHERE type = 'collection'
            GROUP BY payment_mode
        `;
        const modeRes = await db.query(modeStatsSql);

        const modeStats = { cash: 0, gpay: 0 };
        modeRes.rows.forEach(r => {
            if (r.payment_mode && r.payment_mode.toLowerCase() === 'cash') modeStats.cash = r.total;
            if (r.payment_mode && r.payment_mode.toLowerCase() === 'gpay') modeStats.gpay = r.total;
        });

        res.json({
            collection,
            expense,
            balance: collection - expense,
            yearStats: yearRes.rows,
            modeStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REPORTS ---

app.get("/api/reports/breakdown", authenticateToken, async (req, res) => {
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

    try {
        const result = await db.query(sql);
        const rows = result.rows;

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

            const amount = parseFloat(row.total);
            const mode = row.payment_mode ? row.payment_mode.toLowerCase() : 'unknown';

            if (mode === 'cash') dept.cash += amount;
            if (mode === 'gpay') dept.gpay += amount;
            dept.total += amount;
        });

        res.json(hierarchy);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
