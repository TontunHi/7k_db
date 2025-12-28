require('dotenv').config();
const db = require('../database/database');
const fileHelper = require('../utils/fileHelper');
const fs = require('fs'); // อย่าลืม require fs ถ้ายังไม่มี
const path = require('path');
const { logAction } = require('../middleware/logger');

// --- Auth Section ---
exports.getLoginPage = (req, res) => {
    res.render('pages/admin/login', { 
        title: 'Admin Login', 
        error: null,
        layout: false 
    });
};

exports.postLogin = (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('pages/admin/login', { 
            title: 'Admin Login', 
            error: 'Username or Password incorrect',
            layout: false
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
};

// --- Dashboard Section ---
exports.getDashboard = (req, res) => {
    res.render('pages/admin/dashboard', {
        title: 'Admin Dashboard',
        page: 'dashboard'
    });
};

// --- Tier List Manager Section ---
exports.getTierListManager = (req, res) => {
    const category = req.query.category || 'PVP'; 
    const isPetCategory = category === 'PET';
    const folder = isPetCategory ? 'pets' : 'heroes';
    
    // 1. ดึงข้อมูลรูปภาพ
    const allItems = fileHelper.getSortedImages(folder);

    // 2. ดึงข้อมูลจาก DB
    const sql = `SELECT * FROM tier_rankings WHERE category = ?`;
    
    db.all(sql, [category], (err, rows) => {
        if (err) { return res.status(500).send(err.message); }

        const assignedMap = {}; 
        rows.forEach(row => {
            assignedMap[row.char_filename] = row.rank;
        });

        const ranks = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
        const tierData = {};
        ranks.forEach(r => tierData[r] = []);
        const poolData = [];

        allItems.forEach(item => {
            const rank = assignedMap[item.filename];
            if (rank) {
                tierData[rank].push(item);
            } else {
                poolData.push(item);
            }
        });

        res.render('pages/admin/tierlist_manager', {
            title: 'Admin Panel - Tier List',
            page: 'admin_tier',
            category: category,
            ranks: ranks,
            tierData: tierData,
            poolData: poolData,
            folder: folder
        });
    });
};

// --- API Save Tier (ส่วนที่เคยหายไป) ---
exports.saveTierList = (req, res) => {
    const { category, data } = req.body; 
    
    db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO tier_rankings (category, rank, char_filename, char_type) VALUES (?, ?, ?, ?)");
        
        db.run("DELETE FROM tier_rankings WHERE category = ?", [category], (err) => {
            if (err) console.error(err);
            
            if (data && data.length > 0) {
                data.forEach(item => {
                    stmt.run(category, item.rank, item.filename, 'HERO'); 
                });
            }
            stmt.finalize();
            res.json({ success: true });
        });
    });
};

// --- Build Manager ---
exports.getBuildManager = (req, res) => {
    const gradeParam = req.params.grade.toLowerCase();
    
    // 1. Get Heroes
    const heroes = fileHelper.getSortedImages('heroes');
    const filteredHeroes = heroes.filter(h => {
        if (gradeParam === 'legendary') return h.grade.startsWith('l');
        if (gradeParam === 'rare') return h.grade === 'r';
        return true;
    });

    // 2. Get Items Images (New Paths)
    const weaponImages = fileHelper.getImageFiles('Items/weapon');
    const armorImages = fileHelper.getImageFiles('Items/armor');
    const accImages = fileHelper.getImageFiles('Items/accessories');

    // 3. Get Builds Data
    db.all("SELECT * FROM builds", [], (err, builds) => {
        if (err) return res.send("DB Error");

        const buildsMap = {};
        builds.forEach(b => {
            if (!buildsMap[b.hero_filename]) buildsMap[b.hero_filename] = [];
            try {
                b.accessories = JSON.parse(b.accessories || '[]');
                b.substats = JSON.parse(b.substats || '[]');
            } catch (e) {
                b.accessories = [];
                b.substats = [];
            }
            buildsMap[b.hero_filename].push(b);
        });

        res.render('pages/admin/build_manager', {
            title: `Manage Builds - ${gradeParam}`,
            grade: gradeParam,
            heroes: filteredHeroes,
            buildsMap: buildsMap,
            // ส่งข้อมูลรูปภาพไอเทมไปด้วย
            itemImages: {
                weapons: weaponImages,
                armors: armorImages,
                accessories: accImages
            }
        });
    });
};

exports.saveBuild = (req, res) => {
    const { 
        id, hero_filename, build_name, c_level, mode,
        weapon1_img, weapon1_stat, armor1_img, armor1_stat,
        weapon2_img, weapon2_stat, armor2_img, armor2_stat,
        accessories, substats, description 
    } = req.body;

    const accJson = JSON.stringify(accessories || []);
    const subJson = JSON.stringify(substats || []);

    if (id) {
        // Update Existing
        const sql = `UPDATE builds SET 
            build_name=?, c_level=?, mode=?, 
            weapon1_img=?, weapon1_stat=?, armor1_img=?, armor1_stat=?,
            weapon2_img=?, weapon2_stat=?, armor2_img=?, armor2_stat=?,
            accessories=?, substats=?, description=?
            WHERE id=?`;
        db.run(sql, [
            build_name, c_level, mode, 
            weapon1_img, weapon1_stat, armor1_img, armor1_stat,
            weapon2_img, weapon2_stat, armor2_img, armor2_stat,
            accJson, subJson, description, id
        ], (err) => {
            if (err) return res.json({ success: false, error: err.message });
            res.json({ success: true, id: id });
        });
    } else {
        // Insert New
        const sql = `INSERT INTO builds (
            hero_filename, build_name, c_level, mode, 
            weapon1_img, weapon1_stat, armor1_img, armor1_stat,
            weapon2_img, weapon2_stat, armor2_img, armor2_stat,
            accessories, substats, description
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        
        db.run(sql, [
            hero_filename, build_name, c_level, mode, 
            weapon1_img, weapon1_stat, armor1_img, armor1_stat,
            weapon2_img, weapon2_stat, armor2_img, armor2_stat,
            accJson, subJson, description
        ], function(err) {
            if (err) return res.json({ success: false, error: err.message });
            res.json({ success: true, id: this.lastID });
        });
    }
};

exports.deleteBuild = (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM builds WHERE id = ?", [id], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
};

// --- Stage & Nightmare Manager ---
exports.getStageCompManager = (req, res) => {
    const heroes = fileHelper.getSortedImages('heroes');
    
    // ดึงข้อมูลและเรียงลำดับ: Type (Stage มาก่อน) -> Main -> Sub
    const sql = `SELECT * FROM stage_comps ORDER BY 
                 CASE WHEN type = 'Stage' THEN 1 ELSE 2 END, 
                 stage_main ASC, stage_sub ASC`;

    db.all(sql, [], (err, rows) => {
        if (err) return res.send("DB Error");

        // --- Logic จัดกลุ่ม: รวมทีมที่อยู่ด่านเดียวกันไว้ด้วยกัน ---
        const groupedStages = {};
        
        rows.forEach(r => {
            // Parse Heroes JSON
            try { r.heroes = JSON.parse(r.heroes); } catch(e) { r.heroes = Array(5).fill(null); }
            
            // Key สำหรับจัดกลุ่ม (เช่น Stage_20_30)
            const key = `${r.type}_${r.stage_main}_${r.stage_sub}`;
            
            if (!groupedStages[key]) {
                groupedStages[key] = {
                    type: r.type,
                    stage_main: r.stage_main,
                    stage_sub: r.stage_sub,
                    teams: [] // เตรียม Array ไว้เก็บหลายทีม
                };
            }
            // เพิ่มทีมเข้าไปในด่านนี้
            groupedStages[key].teams.push(r);
        });

        // แปลง Object กลับเป็น Array เพื่อส่งให้ Frontend วนลูป
        const stagesList = Object.values(groupedStages);

        res.render('pages/admin/stage_manager', {
            title: 'Manage Stage & Nightmare',
            category: 'Stage',
            heroes: heroes,
            stages: stagesList // ส่งตัวแปร stages ที่จัดกลุ่มแล้วไปแทน
        });
    });
};

exports.saveStageComp = (req, res) => {
    const { id, stage_main, stage_sub, type, formation, heroes, description } = req.body;
    const heroesJson = JSON.stringify(heroes || []);

    if (id) {
        // Update
        db.run(`UPDATE stage_comps SET stage_main=?, stage_sub=?, type=?, formation=?, heroes=?, description=? WHERE id=?`, 
            [stage_main, stage_sub, type, formation, heroesJson, description, id], 
            (err) => {
                if(err) return res.json({success: false, error: err.message});
                res.json({success: true, id});
            });
    } else {
        // Insert
        db.run(`INSERT INTO stage_comps (stage_main, stage_sub, type, formation, heroes, description) VALUES (?,?,?,?,?,?)`, 
            [stage_main, stage_sub, type, formation, heroesJson, description], 
            function(err) {
                if(err) return res.json({success: false, error: err.message});
                res.json({success: true, id: this.lastID});
            });
    }
};

exports.deleteStageComp = (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM stage_comps WHERE id = ?", [id], (err) => {
        if(err) return res.json({success: false});
        res.json({success: true});
    });
};

// --- Dungeon Manager ---
exports.getDungeonManager = (req, res) => {
    const heroes = fileHelper.getSortedImages('heroes');
    
    // 1. อ่านไฟล์รูป Banner ทั้งหมดจากโฟลเดอร์ dungeon
    const dungeonDir = path.join(__dirname, '../public/images/dungeon');
    let dungeonBanners = [];
    
    try {
        if (fs.existsSync(dungeonDir)) {
            dungeonBanners = fs.readdirSync(dungeonDir).filter(file => {
                return ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase());
            });
        }
    } catch (err) {
        console.error("Error reading dungeon directory:", err);
    }

    // 2. ดึงข้อมูลทีมทั้งหมดจาก DB
    db.all("SELECT * FROM dungeon_comps", [], (err, rows) => {
        if (err) return res.send("DB Error");

        // 3. จัดกลุ่มทีม (Teams) เข้ากับดันเจี้ยน (Banners)
        const groupedDungeons = dungeonBanners.map(banner => {
            const teams = rows.filter(r => r.dungeon_name === banner).map(r => {
                try { r.heroes = JSON.parse(r.heroes); } catch(e) { r.heroes = []; }
                return r;
            });
            return {
                banner: banner,
                teams: teams
            };
        });

        res.render('pages/admin/dungeon_manager', {
            title: 'Manage Dungeon',
            dungeons: groupedDungeons,
            heroes: heroes
        });
    });
};

exports.saveDungeonComp = (req, res) => {
    const { id, dungeon_name, formation, heroes, description } = req.body;
    const heroesJson = JSON.stringify(heroes || []);

    if (id) {
        // Update
        db.run(`UPDATE dungeon_comps SET dungeon_name=?, formation=?, heroes=?, description=? WHERE id=?`, 
            [dungeon_name, formation, heroesJson, description, id], 
            (err) => {
                if(err) return res.json({success: false, error: err.message});
                res.json({success: true});
            });
    } else {
        // Insert
        db.run(`INSERT INTO dungeon_comps (dungeon_name, formation, heroes, description) VALUES (?,?,?,?)`, 
            [dungeon_name, formation, heroesJson, description], 
            function(err) {
                if(err) return res.json({success: false, error: err.message});
                res.json({success: true});
            });
    }
};

exports.deleteDungeonComp = (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM dungeon_comps WHERE id = ?", [id], (err) => {
        if(err) return res.json({success: false});
        res.json({success: true});
    });
};

// --- Guild War Manager ---
exports.getGuildWarManager = (req, res) => {
    const heroes = fileHelper.getSortedImages('heroes');
    
    // สมมติว่ามี Helper ดึงรูป Pet (ถ้าไม่มีให้ใช้ Logic เดียวกับ Hero)
    let pets = [];
    try {
        const petDir = path.join(__dirname, '../public/images/pets');
        if (fs.existsSync(petDir)) {
            pets = fs.readdirSync(petDir).filter(f => ['.png','.webp','.jpg'].includes(path.extname(f).toLowerCase()));
        }
    } catch(e) { console.log("No pets folder found"); }

    db.all("SELECT * FROM guildwar_comps", [], (err, rows) => {
        if (err) return res.send("DB Error");

        // Format Data
        const comps = rows.map(r => {
            try { r.heroes = JSON.parse(r.heroes); } catch(e) { r.heroes = []; }
            try { r.skill_order = JSON.parse(r.skill_order); } catch(e) { r.skill_order = []; }
            return r;
        });

        res.render('pages/admin/guildwar_manager', {
            title: 'Manage Guild War',
            comps: comps,
            heroes: heroes,
            pets: pets
        });
    });
};

exports.saveGuildWarComp = (req, res) => {
    const { id, team_name, formation, description, pet, skill_order_json } = req.body;
    // heroes[] จะส่งมาเป็น array
    let heroes = req.body['heroes[]'];
    if (!heroes) heroes = [];
    if (!Array.isArray(heroes)) heroes = [heroes];
    
    // ตัดให้เหลือแค่ 3 ตัวเพื่อความชัวร์
    heroes = heroes.slice(0, 3);
    const heroesJson = JSON.stringify(heroes);

    if (id) {
        db.run(`UPDATE guildwar_comps SET team_name=?, formation=?, heroes=?, pet=?, skill_order=?, description=? WHERE id=?`, 
            [team_name, formation, heroesJson, pet, skill_order_json, description, id], 
            (err) => {
                if(err) return res.json({success: false, error: err.message});
                res.json({success: true});
            });
    } else {
        db.run(`INSERT INTO guildwar_comps (team_name, formation, heroes, pet, skill_order, description) VALUES (?,?,?,?,?,?)`, 
            [team_name, formation, heroesJson, pet, skill_order_json, description], 
            function(err) {
                if(err) return res.json({success: false, error: err.message});
                res.json({success: true});
            });
    }
};

exports.deleteGuildWarComp = (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM guildwar_comps WHERE id = ?", [id], (err) => {
        if(err) return res.json({success: false});
        res.json({success: true});
    });
};