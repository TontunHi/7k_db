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
        // --- BUILDS ---
        db.run(`CREATE TABLE IF NOT EXISTS builds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hero_filename TEXT NOT NULL,
            build_name TEXT,
            c_level TEXT DEFAULT 'C0',
            mode TEXT DEFAULT 'PVE',
            
            weapon1_img TEXT, weapon1_stat TEXT,
            armor1_img TEXT, armor1_stat TEXT,
            weapon2_img TEXT, weapon2_stat TEXT,
            armor2_img TEXT, armor2_stat TEXT,
            
            accessories TEXT, 
            substats TEXT,    
            description TEXT
        )`);

        // --- TIER LIST ---
        db.run(`CREATE TABLE IF NOT EXISTS tier_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            rank TEXT NOT NULL,
            char_filename TEXT NOT NULL,
            char_type TEXT NOT NULL
        )`);

        // --- STAGE & NIGHTMARE ---
        // [แก้ไข] ย้ายอันที่ถูกต้อง (มี team_order) มาไว้ตรงนี้ และลบอันเก่าทิ้ง
        db.run(`CREATE TABLE IF NOT EXISTS stage_comps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_main INTEGER,
            stage_sub INTEGER,
            type TEXT, -- 'Stage' or 'Nightmare'
            formation TEXT,
            description TEXT,
            heroes TEXT, -- Legacy
            team_order INTEGER DEFAULT 1 -- [New Column] 1=Team1, 2=Team2
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS stage_team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_id INTEGER NOT NULL,
            hero_filename TEXT,
            slot_index INTEGER, -- 0-4
            FOREIGN KEY(stage_id) REFERENCES stage_comps(id) ON DELETE CASCADE
        )`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_stage_members_stage_id ON stage_team_members(stage_id)`);

        // --- DUNGEON ---
        db.run(`CREATE TABLE IF NOT EXISTS dungeon_comps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dungeon_name TEXT,
            formation TEXT,
            heroes TEXT,
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

        // --- GUILD WAR ---
        db.run(`CREATE TABLE IF NOT EXISTS guildwar_comps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT,
            formation TEXT,
            heroes TEXT,
            pet TEXT,
            skill_order TEXT,
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

        // --- CODEX ---
        db.run(`CREATE TABLE IF NOT EXISTS codex_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT DEFAULT 'hero'
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
            skill_order TEXT,
            FOREIGN KEY(group_id) REFERENCES codex_groups(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS codex_pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            name TEXT,
            image_name TEXT,
            FOREIGN KEY(group_id) REFERENCES codex_groups(id)
        )`);

        // --- RAID ---
        db.run(`CREATE TABLE IF NOT EXISTS raid_bosses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            image_name TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS raid_teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raid_id INTEGER,
            team_name TEXT,
            formation TEXT,
            hero_ids TEXT,
            skill_priority TEXT,
            description TEXT,
            youtube_link TEXT,
            pet_id TEXT,  -- [New Column]
            FOREIGN KEY(raid_id) REFERENCES raid_bosses(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS raid_team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            hero_id TEXT,
            slot_index INTEGER,
            FOREIGN KEY(team_id) REFERENCES raid_teams(id) ON DELETE CASCADE
        )`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_raid_members_team_id ON raid_team_members(team_id)`);

        // --- CASTLE RUSH ---
        db.run(`CREATE TABLE IF NOT EXISTS castle_rush_teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stage_key TEXT,
            team_name TEXT,
            formation TEXT,
            hero_ids TEXT,
            skill_priority TEXT,
            description TEXT,
            youtube_link TEXT,
            pet_id TEXT
        )`);

        // --- INDEXES ---
        db.run(`CREATE INDEX IF NOT EXISTS idx_codex_groups_cat_id ON codex_groups(category_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_codex_heroes_group_id ON codex_heroes(group_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_codex_pets_group_id ON codex_pets(group_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_raid_teams_raid_id ON raid_teams(raid_id)`);
    });
}

module.exports = db;