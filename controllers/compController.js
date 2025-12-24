const db = require('../database/database');
const fs = require('fs');
const path = require('path');

exports.getStagePage = (req, res) => {
    // ดึงข้อมูลและเรียงลำดับ: Type (Stage มาก่อน) -> Main -> Sub
    const sql = `SELECT * FROM stage_comps ORDER BY 
                 CASE WHEN type = 'Stage' THEN 1 ELSE 2 END, 
                 stage_main ASC, stage_sub ASC`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.render('pages/error'); // หรือ handle error ตามเหมาะสม
        }

        // Logic จัดกลุ่ม (เหมือน Admin)
        const groupedStages = {};
        
        rows.forEach(r => {
            try { r.heroes = JSON.parse(r.heroes); } catch(e) { r.heroes = []; }
            
            const key = `${r.type}_${r.stage_main}_${r.stage_sub}`;
            
            if (!groupedStages[key]) {
                groupedStages[key] = {
                    type: r.type,
                    stage_main: r.stage_main,
                    stage_sub: r.stage_sub,
                    teams: []
                };
            }
            groupedStages[key].teams.push(r);
        });

        const stagesList = Object.values(groupedStages);

        res.render('pages/comp_stage', {
            title: 'Stage & Nightmare Guide',
            page: 'comp', // Active Navbar
            stages: stagesList
        });
    });
};

exports.getDungeonPage = (req, res) => {
    // 1. อ่านไฟล์รูป Banner
    const dungeonDir = path.join(__dirname, '../public/images/dungeon');
    let dungeonBanners = [];
    try {
        if (fs.existsSync(dungeonDir)) {
            dungeonBanners = fs.readdirSync(dungeonDir).filter(file => {
                return ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase());
            });
        }
    } catch (err) {
        console.error(err);
    }

    // 2. ดึงข้อมูลทีมทั้งหมด
    db.all("SELECT * FROM dungeon_comps", [], (err, rows) => {
        if (err) return res.render('pages/error');

        // 3. จัดกลุ่ม
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

        res.render('pages/comp_dungeon', {
            title: 'Dungeon Guide',
            page: 'comp', // Active Navbar
            dungeons: groupedDungeons
        });
    });
};