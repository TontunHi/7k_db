const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'seven_knights_rebirth.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
        initTables();
    }
});

function initTables() {
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
        
        accessories TEXT, -- เก็บ JSON Array ของชื่อไฟล์รูป
        substats TEXT,    -- เก็บ JSON Array ของ Stat ที่เลือกเรียงตามลำดับ
        description TEXT
    )`);
    
    // สร้างตารางเก็บข้อมูล Tier List
    // category: 'PVP', 'PVE', 'PET'
    // rank: 'SSS', 'SS', 'S', ...
    // char_id: ชื่อไฟล์รูปภาพ (เพื่อใช้อ้างอิงกับไฟล์)
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
        heroes TEXT,            -- JSON Array เก็บชื่อไฟล์รูป 5 ตัว
        description TEXT        -- คำอธิบายเสริม
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS dungeon_comps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dungeon_name TEXT,      -- เก็บชื่อไฟล์รูป Banner เช่น 'gold_dungeon.png'
        formation TEXT,         -- '1-4', '2-3', etc.
        heroes TEXT,            -- JSON Array เก็บชื่อไฟล์รูป 5 ตัว
        description TEXT
    )`);

    // สร้างตาราง Guild War Comps
    db.run(`CREATE TABLE IF NOT EXISTS guildwar_comps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT,
        formation TEXT,
        heroes TEXT,            -- JSON Array เก็บชื่อไฟล์ Hero (max 3)
        pet TEXT,               -- ชื่อไฟล์ Pet
        skill_order TEXT,       -- JSON Array เก็บ Sequence การกดสกิล
        description TEXT
    )`);
}

module.exports = db;