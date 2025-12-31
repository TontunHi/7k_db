const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Adding pet_id to raid_teams...");

    db.run("ALTER TABLE raid_teams ADD COLUMN pet_id TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column pet_id already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Column pet_id added successfully.");
        }
    });

    db.close();
});
