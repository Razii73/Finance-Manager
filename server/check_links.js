const db = require('./database');

db.serialize(() => {
    db.get("SELECT Count(*) as count FROM year_departments", (err, row) => console.log('Year-Dept Links:', row.count));
    db.all("SELECT * FROM year_departments", (err, rows) => console.log('Links:', rows));
});
