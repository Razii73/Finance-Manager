const db = require('./database');

db.serialize(() => {
    db.get("SELECT Count(*) as count FROM student_years", (err, row) => console.log('Years:', row.count));
    db.get("SELECT Count(*) as count FROM departments", (err, row) => console.log('Departments:', row.count));
    db.get("SELECT Count(*) as count FROM transactions", (err, row) => console.log('Transactions:', row.count));
    db.get("SELECT * FROM transactions LIMIT 5", (err, row) => console.log('Sample Tx:', row));
});
