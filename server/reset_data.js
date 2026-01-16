const db = require('./database');
const bcrypt = require('bcrypt');

const resetData = () => {
    db.serialize(() => {
        console.log("Starting Factory Reset...");

        // 1. Clear Data Tables
        db.run("DELETE FROM transactions", (err) => {
            if (err) console.error("Error clearing transactions:", err);
            else console.log("Cleared transactions.");
        });

        db.run("DELETE FROM students", (err) => {
            if (err) console.error("Error clearing students:", err);
            else console.log("Cleared students.");
        });

        db.run("DELETE FROM year_departments", (err) => {
            if (err) console.error("Error clearing year_departments:", err);
            else console.log("Cleared year_departments.");
        });

        db.run("DELETE FROM departments", (err) => {
            if (err) console.error("Error clearing departments:", err);
            else console.log("Cleared departments.");
        });

        db.run("DELETE FROM student_years", (err) => {
            if (err) console.error("Error clearing student_years:", err);
            else console.log("Cleared student_years.");
        });

        // 2. Reset Admin to Default
        const defaultHash = bcrypt.hashSync('admin123', 10);
        db.run("UPDATE admin SET username = 'admin', password_hash = ? WHERE id = 1", [defaultHash], (err) => {
            if (err) console.error("Error resetting admin:", err);
            else console.log("Reset admin to default (admin / admin123).");
        });

        // Also ensure if admin was deleted, it's recreated (though id=1 update handles the main case, insert ignores if exists)
        db.run("INSERT OR IGNORE INTO admin (id, username, password_hash) VALUES (1, 'admin', ?)", [defaultHash], (err) => {
            if (err) console.error("Error seeding admin:", err);
        });

        console.log("Factory Reset Complete.");
    });
};

resetData();
