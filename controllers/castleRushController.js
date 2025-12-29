const db = require('../database/database');
const { getFilesFromDir } = require('../utils/fileHelper');

// Config รายชื่อด่านและลำดับ (Monday -> Sunday)
const STAGES = [
    { key: 'cr_rudy', name: 'Rudy (Monday)', img: 'cr_rudy.png' },
    { key: 'cr_eileene', name: 'Eileene (Tuesday)', img: 'cr_eileene.png' },
    { key: 'cr_rachel', name: 'Rachel (Wednesday)', img: 'cr_rachel.png' },
    { key: 'cr_dellons', name: 'Dellons (Thursday)', img: 'cr_dellons.png' },
    { key: 'cr_jave', name: 'Jave (Friday)', img: 'cr_jave.png' },
    { key: 'cr_spike', name: 'Spike (Saturday)', img: 'cr_spike.png' },
    { key: 'cr_kris', name: 'Kris (Sunday)', img: 'cr_kris.png' }
];

exports.getIndex = (req, res) => {
    const activeStageKey = req.query.stage_key || null;

    // 1. ดึงรูป Hero สำหรับทำ Editor
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

    if (activeStageKey) {
        // [DETAIL VIEW] ดึงทีมของด่านนั้นๆ
        const currentStage = STAGES.find(s => s.key === activeStageKey);
        
        // ป้องกัน user มั่ว URL
        if (!currentStage) return res.redirect('/admin/manage/castle-rush');

        db.all("SELECT * FROM castle_rush_teams WHERE stage_key = ?", [activeStageKey], (err, teams) => {
            if (err) return res.send("DB Error");

            const teamsParsed = teams.map(t => ({
                ...t,
                hero_ids: JSON.parse(t.hero_ids || '[]'),
                skill_priority: JSON.parse(t.skill_priority || '[]')
            }));

            res.render('pages/admin/castle_rush_manager', {
                title: 'Castle Rush Manager',
                viewState: 'detail',
                stages: STAGES,
                activeStage: currentStage,
                teams: teamsParsed,
                heroFiles,
                heroesMap,
                user: req.session ? req.session.user : null
            });
        });

    } else {
        // [LIST VIEW] แสดง 7 ด่าน
        res.render('pages/admin/castle_rush_manager', {
            title: 'Castle Rush Manager',
            viewState: 'list',
            stages: STAGES,
            activeStage: null,
            teams: [],
            heroFiles,
            heroesMap,
            user: req.session ? req.session.user : null
        });
    }
};

exports.saveTeam = (req, res) => {
    const { 
        id, stage_key, team_name, formation, 
        hero_ids, skill_priority, description, youtube_link 
    } = req.body;

    const heroIdsJson = JSON.stringify(hero_ids || []);
    const skillPriorityJson = JSON.stringify(skill_priority || []);

    if (id) {
        // Update
        db.run(`UPDATE castle_rush_teams SET 
            team_name=?, formation=?, hero_ids=?, skill_priority=?, description=?, youtube_link=? 
            WHERE id=?`, 
            [team_name, formation, heroIdsJson, skillPriorityJson, description, youtube_link, id],
            (err) => {
                if(err) return res.json({ success: false, error: err.message });
                res.json({ success: true });
            }
        );
    } else {
        // Insert
        db.run(`INSERT INTO castle_rush_teams 
            (stage_key, team_name, formation, hero_ids, skill_priority, description, youtube_link) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [stage_key, team_name, formation, heroIdsJson, skillPriorityJson, description, youtube_link],
            (err) => {
                if(err) return res.json({ success: false, error: err.message });
                res.json({ success: true });
            }
        );
    }
};

exports.deleteTeam = (req, res) => {
    const { id, stage_key } = req.body;
    db.run("DELETE FROM castle_rush_teams WHERE id = ?", [id], (err) => {
        if (err) console.error(err);
        res.redirect(`/admin/manage/castle-rush?stage_key=${stage_key}`);
    });
};

// --- USER SECTION --- [NEW]
exports.getUserIndex = (req, res) => {
    const activeStageKey = req.query.stage_key || null;

    // 1. เตรียมข้อมูล Hero Map (อ่านจากไฟล์)
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

    if (activeStageKey) {
        // [DETAIL VIEW]
        const currentStage = STAGES.find(s => s.key === activeStageKey);
        if (!currentStage) return res.redirect('/castle-rush');

        db.all("SELECT * FROM castle_rush_teams WHERE stage_key = ?", [activeStageKey], (err, teams) => {
            if (err) return res.render('error', { message: 'DB Error' });

            const teamsParsed = teams.map(t => ({
                ...t,
                hero_ids: JSON.parse(t.hero_ids || '[]'),
                skill_priority: JSON.parse(t.skill_priority || '[]')
            }));

            res.render('pages/castle_rush', {
                title: 'Castle Rush Guide',
                viewState: 'detail',
                stages: STAGES,
                activeStage: currentStage,
                teams: teamsParsed,
                heroesMap
            });
        });

    } else {
        // [LIST VIEW]
        res.render('pages/castle_rush', {
            title: 'Castle Rush Guide',
            viewState: 'list',
            stages: STAGES,
            activeStage: null,
            teams: [],
            heroesMap
        });
    }
};