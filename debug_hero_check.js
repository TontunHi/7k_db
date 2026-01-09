const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve('./database/seven_knights_rebirth.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err);
});

db.all("SELECT id, name, image_name FROM codex_heroes WHERE image_name LIKE '%bai%' OR image_name LIKE '%branze%'", (err, rows) => {
    if (err) return console.error(err);
    console.log("Heroes found:");
    if (rows.length === 0) {
        console.log("No matches found.");
    } else {
        console.table(rows);
    }
});

db.close();
