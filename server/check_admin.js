const db = require('./database');
const bcrypt = require('bcrypt');

db.get("SELECT * FROM admin", (err, row) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Current Admin Username:", row ? row.username : "No admin found");
        if (row) {
            const isDefault = bcrypt.compareSync("admin123", row.password_hash);
            console.log("Is Password 'admin123'?:", isDefault);
        }
    }
});
