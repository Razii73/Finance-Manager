const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to PostgreSQL database.');

    // Initialize Schema
    initializeSchema(client, release);
});

const initializeSchema = async (client, release) => {
    try {
        // 1. Admin Table
        await client.query(`CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT
    )`);

        // 2. Student Years Table
        await client.query(`CREATE TABLE IF NOT EXISTS student_years (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        is_active INTEGER DEFAULT 1
    )`);

        // 3. Departments Master Table
        await client.query(`CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE
    )`);

        // 4. Year-Department Mapping Link
        await client.query(`CREATE TABLE IF NOT EXISTS year_departments (
        id SERIAL PRIMARY KEY,
        year_id INTEGER REFERENCES student_years(id),
        dept_id INTEGER REFERENCES departments(id),
        UNIQUE(year_id, dept_id)
    )`);

        // 5. Transactions Table
        await client.query(`CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type TEXT CHECK(type IN ('collection', 'expense')),
        amount REAL,
        payment_mode TEXT CHECK(payment_mode IN ('cash', 'gpay')),
        date TEXT,
        description TEXT,
        spent_by TEXT,
        year_id INTEGER REFERENCES student_years(id),
        department_id INTEGER REFERENCES departments(id)
    )`);

        // 6. Students Table
        await client.query(`CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT,
        year_id INTEGER REFERENCES student_years(id),
        department_id INTEGER REFERENCES departments(id),
        is_paid INTEGER DEFAULT 0,
        total_fee REAL DEFAULT 0,
        amount_paid REAL DEFAULT 0
    )`);

        // Seed Admin only
        const res = await client.query("SELECT * FROM admin WHERE username = $1", ['admin']);
        if (res.rows.length === 0) {
            const hash = bcrypt.hashSync('admin123', 10);
            await client.query("INSERT INTO admin (username, password_hash) VALUES ($1, $2)", ['admin', hash]);
            console.log("Default admin created: admin / admin123");
        }

    } catch (err) {
        console.error("Schema Initialization Error:", err);
    } finally {
        release();
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
};
