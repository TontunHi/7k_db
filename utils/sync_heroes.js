const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const fileHelper = require('../utils/fileHelper'); // Assuming this helper exists and works

const dbPath = path.resolve(__dirname, '../database/seven_knights_rebirth.db');
const db = new sqlite3.Database(dbPath);

async function syncHeroes() {
    console.log("Starting Hero Sync...");

    // 1. Get all hero images from file system
    const heroFiles = fileHelper.getSortedImages('heroes');
    console.log(`Found ${heroFiles.length} hero images in FS.`);

    // 2. Wrap DB calls in Promise
    const getAllDbHeroes = () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT image_name FROM codex_heroes", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.image_name));
            });
        });
    };

    const insertHero = (hero) => {
        return new Promise((resolve, reject) => {
            const name = hero.name || hero.filename.replace(/\.[^/.]+$/, "");
            const skillFolder = hero.filename.replace(/\.[^/.]+$/, ""); // Default folder name same as hero

            // Insert with NULL group_id (User can assign later in Codex Admin if it exists)
            const sql = `INSERT INTO codex_heroes (group_id, name, image_name, skill_folder, skill_order) VALUES (?, ?, ?, ?, ?)`;
            db.run(sql, [null, name, hero.filename, skillFolder, "[]"], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    };

    try {
        const dbHeroNames = await getAllDbHeroes();
        console.log(`Found ${dbHeroNames.length} heroes in DB.`);

        let newCount = 0;
        for (const file of heroFiles) {
            const heroData = fileHelper.getGradeAndName(file); // { filename, grade, name ... }
            if (!dbHeroNames.includes(heroData.filename)) {
                console.log(`New Hero found: ${heroData.filename} -> Inserting...`);
                await insertHero(heroData);
                newCount++;
            }
        }

        console.log(`Sync Complete. Added ${newCount} new heroes.`);

    } catch (err) {
        console.error("Sync Error:", err);
    } finally {
        db.close();
    }
}

syncHeroes();
