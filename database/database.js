const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "seven_knights_rebirth.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Could not connect to database", err);
    } else {
        console.log("Connected to SQLite database");
        initTables();
    }
});

function initTables() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS builds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hero_filename TEXT NOT NULL,
            build_name TEXT,
            c_level TEXT DEFAULT 'C0',
            mode TEXT DEFAULT 'PVE',
            
            weapon1_img TEXT,
            weapon1_stat TEXT,
            armor1_img TEXT,
            armor1_stat TEXT,
            
            weapon2_img TEXT,
            weapon2_stat TEXT,
            armor2_img TEXT,
            armor2_stat TEXT,
            
            accessories TEXT, 
            substats TEXT,    
            description TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS tier_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            rank TEXT NOT NULL,
            char_filename TEXT NOT NULL,
            char_type TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS stage_comps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_main INTEGER,     -- เลขหน้า เช่น 20
            stage_sub INTEGER,      -- เลขหลัง เช่น 30
            type TEXT,              -- 'Stage' หรือ 'Nightmare'
            formation TEXT,         -- '1-4', '2-3', '3-2', '4-1'
            heroes TEXT,            -- DEPRECATED: JSON Array (Will be migrated)
            description TEXT        -- คำอธิบายเสริม
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS stage_team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_id INTEGER NOT NULL,
            hero_filename TEXT,
            slot_index INTEGER, -- 0-4
            FOREIGN KEY(stage_id) REFERENCES stage_comps(id) ON DELETE CASCADE
        )`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_stage_members_stage_id ON stage_team_members(stage_id)`);

        db.run(`CREATE TABLE IF NOT EXISTS dungeon_comps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dungeon_name TEXT,      -- เก็บชื่อไฟล์รูป Banner เช่น 'gold_dungeon.png'
            formation TEXT,         -- '1-4', '2-3', etc.
            heroes TEXT,            -- JSON Array เก็บชื่อไฟล์รูป 5 ตัว
            description TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS dungeon_team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dungeon_id INTEGER NOT NULL,
            hero_filename TEXT,
            slot_index INTEGER,
            FOREIGN KEY(dungeon_id) REFERENCES dungeon_comps(id) ON DELETE CASCADE
        )`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_dungeon_members_dungeon_id ON dungeon_team_members(dungeon_id)`);

        db.run(`CREATE TABLE IF NOT EXISTS guildwar_comps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT,
            formation TEXT,
            heroes TEXT,            -- JSON Array เก็บชื่อไฟล์ Hero (max 3)
            pet TEXT,               -- ชื่อไฟล์ Pet
            skill_order TEXT,       -- JSON Array เก็บ Sequence การกดสกิล
            description TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS guildwar_team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guildwar_id INTEGER NOT NULL,
            hero_filename TEXT,
            slot_index INTEGER, -- 0-2 (Max 3)
            FOREIGN KEY(guildwar_id) REFERENCES guildwar_comps(id) ON DELETE CASCADE
        )`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_gw_members_gw_id ON guildwar_team_members(guildwar_id)`);

        db.run(`CREATE TABLE IF NOT EXISTS codex_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT DEFAULT 'hero' -- แยกประเภท hero หรือ pet
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS codex_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            name TEXT,
            FOREIGN KEY(category_id) REFERENCES codex_categories(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS codex_heroes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            name TEXT,
            image_name TEXT,
            skill_folder TEXT,
            skill_order TEXT,   -- [NEW] เก็บ JSON Array ลำดับสกิล เช่น ["skill1.png", "skill2.png"]
            FOREIGN KEY(group_id) REFERENCES codex_groups(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS codex_pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            name TEXT,
            image_name TEXT,
            FOREIGN KEY(group_id) REFERENCES codex_groups(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS raid_bosses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            image_name TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS raid_teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raid_id INTEGER,
            team_name TEXT,             -- ชื่อทีม (Admin ตั้งเองไว้อ้างอิง)
            formation TEXT,             -- เช่น 1-4, 4-1
            hero_ids TEXT,              -- JSON Array [id1, id2, id3, id4, id5]
            skill_priority TEXT,        -- JSON Array ["heroId_skillFile", ...]
            description TEXT,
            youtube_link TEXT,
            FOREIGN KEY(raid_id) REFERENCES raid_bosses(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS raid_team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            hero_id TEXT,       -- filename
            slot_index INTEGER, -- 0-4
            FOREIGN KEY(team_id) REFERENCES raid_teams(id) ON DELETE CASCADE
        )`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_raid_members_team_id ON raid_team_members(team_id)`);

        db.run(`CREATE TABLE IF NOT EXISTS castle_rush_teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_key TEXT,             -- ตัวระบุวัน เช่น 'cr_rudy', 'cr_eileene'
            team_name TEXT,
            formation TEXT,
            hero_ids TEXT,              -- JSON Array
            skill_priority TEXT,        -- JSON Array
            description TEXT,
            youtube_link TEXT
        )`);

        db.run(`CREATE INDEX IF NOT EXISTS idx_codex_groups_cat_id ON codex_groups(category_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_codex_heroes_group_id ON codex_heroes(group_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_codex_pets_group_id ON codex_pets(group_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_raid_teams_raid_id ON raid_teams(raid_id)`);
    });
}

module.exports = db;
