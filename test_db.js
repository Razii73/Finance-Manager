const db = require('./server/database');

const testYear = "Test Year " + Date.now();
console.log("Attempting to insert:", testYear);

db.run("INSERT INTO student_years (name) VALUES (?)", [testYear], function (err) {
    if (err) {
        console.error("❌ DB Insert Error:", err.message);
    } else {
        console.log("✅ Successfully added year with ID:", this.lastID);

        // Verify fetch
        db.all("SELECT * FROM student_years", [], (err, rows) => {
            if (err) console.error("Fetch Error:", err);
            else console.log("Current Years:", rows);
        });
    }
});
