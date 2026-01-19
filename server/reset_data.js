const db = require('./database');
const bcrypt = require('bcrypt');

const resetData = async () => {
    try {
        console.log("Starting Factory Reset (Postgres)...");

        // 1. Clear Data Tables
        // Usage of CASCADE to handle foreign key constraints
        await db.query("TRUNCATE transactions, students, year_departments, departments, student_years, admin RESTART IDENTITY CASCADE");
        console.log("Cleared all tables.");

        // 2. Reset Admin
        const defaultHash = bcrypt.hashSync('admin123', 10);
        await db.query("INSERT INTO admin (username, password_hash) VALUES ($1, $2)", ['admin', defaultHash]);
        console.log("Reset admin to default (admin / admin123).");

        console.log("Factory Reset Complete.");
        process.exit(0);
    } catch (err) {
        console.error("Reset Error:", err);
        process.exit(1);
    }
};

resetData();
