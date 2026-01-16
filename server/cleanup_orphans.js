const db = require('./database');

const cleanUp = () => {
    console.log("Starting cleanup...");

    // 1. Find the 1st year ID
    db.get("SELECT id FROM student_years WHERE name = '1st year'", [], (err, yearRow) => {
        if (err || !yearRow) {
            console.error("Could not find 1st year", err);
            return;
        }

        // 2. Find the ECE dept ID
        db.get("SELECT id FROM departments WHERE name = 'ECE'", [], (err, deptRow) => {
            if (err || !deptRow) {
                console.error("Could not find ECE department", err);
                return;
            }

            console.log(`Found 1st Year ID: ${yearRow.id}, ECE Dept ID: ${deptRow.id}`);

            // 3. Delete transactions matching both
            db.run(
                "DELETE FROM transactions WHERE year_id = ? AND department_id = ?",
                [yearRow.id, deptRow.id],
                function (err) {
                    if (err) {
                        console.error("Error deleting:", err);
                    } else {
                        console.log(`Deleted ${this.changes} invalid transactions.`);
                    }
                }
            );
        });
    });
};

cleanUp();
