// [file: controllers/raidController.js]
const db = require('../database/database');
const { getFilesFromDir } = require('../utils/fileHelper');
const { logAction } = require('../middleware/logger');

exports.getIndex = (req, res) => {
    const selectedRaidId = req.query.raid_id ? parseInt(req.query.raid_id) : null;

    // 1. ดึง Raid Bosses
    db.all("SELECT * FROM raid_bosses", [], (err, raids) => {
        if (err) { console.error(err); return res.send("DB Error: Raids"); }

        // [NEW] ดึงรูป Hero ทั้งหมดจาก Folder โดยตรง (ไม่อิง Codex DB)
        const heroFiles = getFilesFromDir('images/heroes').sort();
        
        // สร้าง Map จำลองเพื่อให้ View เรียกใช้ง่ายๆ เหมือนเดิม (Key = filename)
        const heroesMap = {};
        heroFiles.forEach(filename => {
            heroesMap[filename] = {
                id: filename, // ใช้ชื่อไฟล์เป็น ID เลย
                name: filename.replace(/\.[^/.]+$/, ""), // ชื่อตัดนามสกุลออก
                image_name: filename,
                skill_folder: filename.replace(/\.[^/.]+$/, "")
            };
        });

        if (selectedRaidId) {
            db.all("SELECT * FROM raid_teams WHERE raid_id = ?", [selectedRaidId], (err, teams) => {
                if (err) { console.error(err); return res.send("DB Error: Teams"); }
                
                const teamsParsed = teams.map(t => ({
                    ...t,
                    hero_ids: JSON.parse(t.hero_ids || '[]'),
                    skill_priority: JSON.parse(t.skill_priority || '[]')
                }));

                res.render('pages/admin/raid_manager', {
                    title: 'Raid Manager',
                    viewState: 'detail',
                    raids,
                    activeRaid: raids.find(r => r.id === selectedRaidId),
                    teams: teamsParsed,
                    heroFiles, // ส่งรายชื่อไฟล์ไป
                    heroesMap, // ส่ง Map ไป
                    availableRaidImages: [],
                    user: req.session ? req.session.user : null
                });
            });
        } else {
            const availableRaidImages = getFilesFromDir('images/raid');
            
            res.render('pages/admin/raid_manager', {
                title: 'Raid Manager',
                viewState: 'list',
                raids,
                activeRaid: null,
                teams: [],
                heroFiles,
                heroesMap,
                availableRaidImages,
                user: req.session ? req.session.user : null
            });
        }
    });
};

// ... (Function addRaidBoss, deleteRaidBoss, saveTeam, deleteTeam เหมือนเดิม ไม่ต้องแก้) ...
// Copy ส่วนที่เหลือจากไฟล์เดิมได้เลยครับ
exports.addRaidBoss = (req, res) => {
    const { name, image_name } = req.body;
    db.run("INSERT INTO raid_bosses (name, image_name) VALUES (?, ?)", [name, image_name], (err) => {
        if (err) console.error(err);
        res.redirect('/admin/manage/raid');
    });
};

exports.deleteRaidBoss = (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM raid_teams WHERE raid_id = ?", [id], (err) => {
        db.run("DELETE FROM raid_bosses WHERE id = ?", [id], (err) => {
            res.redirect('/admin/manage/raid');
        });
    });
};

exports.saveTeam = (req, res) => {
    const { id, raid_id, team_name, formation, hero_ids, skill_priority, description, youtube_link } = req.body;
    const heroIdsJson = JSON.stringify(hero_ids || []);
    const skillPriorityJson = JSON.stringify(skill_priority || []);

    if (id) {
        db.run(`UPDATE raid_teams SET team_name=?, formation=?, hero_ids=?, skill_priority=?, description=?, youtube_link=? WHERE id=?`, 
            [team_name, formation, heroIdsJson, skillPriorityJson, description, youtube_link, id],
            (err) => { res.json({ success: !err, error: err ? err.message : null }); }
        );
    } else {
        db.run(`INSERT INTO raid_teams (raid_id, team_name, formation, hero_ids, skill_priority, description, youtube_link) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [raid_id, team_name, formation, heroIdsJson, skillPriorityJson, description, youtube_link],
            (err) => { res.json({ success: !err, error: err ? err.message : null }); }
        );
    }
};

exports.deleteTeam = (req, res) => {
    const { id, raid_id } = req.body;
    db.run("DELETE FROM raid_teams WHERE id = ?", [id], (err) => {
        res.redirect(`/admin/manage/raid?raid_id=${raid_id}`);
    });
};

// --- USER SECTION --- [NEW]
exports.getUserIndex = (req, res) => {
    const selectedRaidId = req.query.raid_id ? parseInt(req.query.raid_id) : null;

    db.all("SELECT * FROM raid_bosses", [], (err, raids) => {
        if (err) return res.render('error', { message: 'DB Error' });

        // 1. แปลงชื่อ Raid จากชื่อไฟล์ก่อน (เพื่อเอามาเทียบ)
        raids = raids.map(r => ({
            ...r,
            displayName: r.image_name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
        }));

        // 2. [UPDATE] Custom Sort Order
        const sortOrder = ['Destroyer Gaze', 'Ox King', 'Iron Devourer'];
        
        raids.sort((a, b) => {
            // หา index ของชื่อในอาเรย์ที่กำหนด
            let indexA = sortOrder.indexOf(a.displayName);
            let indexB = sortOrder.indexOf(b.displayName);

            // ถ้าชื่อไม่ตรงกับที่กำหนด ให้ไปอยู่ท้ายสุด
            if (indexA === -1) indexA = 99;
            if (indexB === -1) indexB = 99;

            return indexA - indexB;
        });

        const heroFiles = getFilesFromDir('images/heroes').sort();
        const heroesMap = {};
        heroFiles.forEach(filename => {
            heroesMap[filename] = {
                id: filename,
                name: filename.replace(/\.[^/.]+$/, ""),
                image_name: filename,
                skill_folder: filename.replace(/\.[^/.]+$/, "")
            };
        });

        if (selectedRaidId) {
            db.all("SELECT * FROM raid_teams WHERE raid_id = ?", [selectedRaidId], (err, teams) => {
                if (err) return res.render('error', { message: 'DB Error' });
                
                const teamsParsed = teams.map(t => ({
                    ...t,
                    hero_ids: JSON.parse(t.hero_ids || '[]'),
                    skill_priority: JSON.parse(t.skill_priority || '[]')
                }));

                res.render('pages/raid', {
                    title: 'Raid Guide',
                    viewState: 'detail',
                    raids,
                    activeRaid: raids.find(r => r.id === selectedRaidId),
                    teams: teamsParsed,
                    heroesMap
                });
            });
        } else {
            res.render('pages/raid', {
                title: 'Raid Guide',
                viewState: 'list',
                raids,
                activeRaid: null,
                teams: [],
                heroesMap
            });
        }
    });
};