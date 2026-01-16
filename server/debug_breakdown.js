const db = require('./database');

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

console.log('Running Breakdown Query...');

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error("SQL Error:", err);
    } else {
        console.log(`Found ${rows.length} rows.`);
        console.log(rows);
    }
});
