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

        // 2. Reset Admin to Default (Delete all and recreate)
        db.run("DELETE FROM admin", (err) => {
            if (err) console.error("Error clearing admin:", err);
            else console.log("Cleared old admin records.");

            const defaultHash = bcrypt.hashSync('admin123', 10);
            db.run("INSERT INTO admin (username, password_hash) VALUES (?, ?)", ['admin', defaultHash], (err) => {
                if (err) console.log(err);
                else console.log("Reset admin to default (admin / admin123).");
            });
        });

        console.log("Factory Reset Complete.");
    });
};

resetData();
