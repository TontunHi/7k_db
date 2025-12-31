const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/seven_knights_rebirth.db');
const db = new sqlite3.Database(dbPath);

function migrate() {
    console.log("Starting Migration: Stage Normalization...");

    db.serialize(() => {
        // 1. Ensure Table Exists (in case app hasn't restarted)
        db.run(`CREATE TABLE IF NOT EXISTS stage_team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_id INTEGER NOT NULL,
            hero_filename TEXT,
            slot_index INTEGER,
            FOREIGN KEY(stage_id) REFERENCES stage_comps(id) ON DELETE CASCADE
        )`);

        // 2. Clear target table to prevent duplicates if run multiple times
        db.run("DELETE FROM stage_team_members");

        // 3. Select all legacy data
        db.all("SELECT id, heroes FROM stage_comps", (err, rows) => {
            if (err) {
                console.error("Error reading stage_comps:", err);
                return;
            }

            console.log(`Found ${rows.length} stages to migrate.`);
            const stmt = db.prepare("INSERT INTO stage_team_members (stage_id, hero_filename, slot_index) VALUES (?, ?, ?)");

            let totalHeroes = 0;

            db.serialize(() => {
                rows.forEach(row => {
                    let heroes = [];
                    try {
                        heroes = JSON.parse(row.heroes);
                    } catch (e) {
                        console.warn(`Failed to parse heroes for stage id ${row.id}`);
                    }

                    if (Array.isArray(heroes)) {
                        heroes.forEach((h, index) => {
                            if (h) { // Only insert if hero exists (not null)
                                stmt.run(row.id, h, index);
                                totalHeroes++;
                            }
                        });
                    }
                });

                stmt.finalize();
                console.log(`Migration Complete. Inserted ${totalHeroes} hero records.`);
            });
        });
    });
}

migrate();
