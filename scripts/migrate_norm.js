const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/seven_knights_rebirth.db');
const db = new sqlite3.Database(dbPath);

async function runApi(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function execApi(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function migrate() {
    console.log("Starting Migration...");

    // 1. Dungeon
    console.log("Migrating Dungeon Comps...");
    const dungeons = await runApi("SELECT * FROM dungeon_comps");
    for (const d of dungeons) {
        // Clear existing members for safety (though table should be empty)
        await execApi("DELETE FROM dungeon_team_members WHERE dungeon_id = ?", [d.id]);

        let heroes = [];
        try { heroes = JSON.parse(d.heroes || '[]'); } catch (e) { }

        if (Array.isArray(heroes)) {
            for (let i = 0; i < heroes.length; i++) {
                if (heroes[i]) {
                    await execApi("INSERT INTO dungeon_team_members (dungeon_id, hero_filename, slot_index) VALUES (?, ?, ?)",
                        [d.id, heroes[i], i]);
                }
            }
        }
    }

    // 2. Guild War
    console.log("Migrating Guild War Comps...");
    const gws = await runApi("SELECT * FROM guildwar_comps");
    for (const gw of gws) {
        await execApi("DELETE FROM guildwar_team_members WHERE guildwar_id = ?", [gw.id]);

        let heroes = [];
        try { heroes = JSON.parse(gw.heroes || '[]'); } catch (e) { }

        if (Array.isArray(heroes)) {
            for (let i = 0; i < heroes.length; i++) {
                if (heroes[i]) {
                    await execApi("INSERT INTO guildwar_team_members (guildwar_id, hero_filename, slot_index) VALUES (?, ?, ?)",
                        [gw.id, heroes[i], i]);
                }
            }
        }
    }

    // 3. Raid Teams
    console.log("Migrating Raid Teams...");
    const raids = await runApi("SELECT * FROM raid_teams");
    for (const r of raids) {
        await execApi("DELETE FROM raid_team_members WHERE team_id = ?", [r.id]);

        let heroes = [];
        try { heroes = JSON.parse(r.hero_ids || '[]'); } catch (e) { }

        if (Array.isArray(heroes)) {
            for (let i = 0; i < heroes.length; i++) {
                if (heroes[i]) {
                    await execApi("INSERT INTO raid_team_members (team_id, hero_id, slot_index) VALUES (?, ?, ?)",
                        [r.id, heroes[i], i]);
                }
            }
        }
    }

    console.log("Migration Complete.");
    db.close();
}

migrate().catch(console.error);
