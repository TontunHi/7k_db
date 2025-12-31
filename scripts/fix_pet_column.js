const db = require('../database/database');

console.log('Checking for pet_id column in raid_teams...');

db.run("ALTER TABLE raid_teams ADD COLUMN pet_id TEXT", (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column pet_id already exists.');
        } else {
            console.error('Error adding column:', err.message);
        }
    } else {
        console.log('Successfully added pet_id column to raid_teams.');
    }
    // Close connection to allow process to exit cleanly if needed, 
    // though sqlite3 usually keeps event loop open. 
    // We'll just exit after a short timeout to let async flush.
    setTimeout(() => process.exit(0), 1000);
});
