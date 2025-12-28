const db = require('../database/database');
const fileHelper = require('../utils/fileHelper');
const { logAction } = require('../middleware/logger');

exports.getBuildPage = (req, res) => {
    const gradeParam = req.params.grade.toLowerCase(); // legendary, rare
    
    // 1. ดึงรูป Heroes ตามเกรด
    const heroes = fileHelper.getSortedImages('heroes');
    const filteredHeroes = heroes.filter(h => {
        if (gradeParam === 'legendary') return h.grade.startsWith('l');
        if (gradeParam === 'rare') return h.grade === 'r';
        return true;
    });

    // 2. ดึงข้อมูล Builds ทั้งหมดจาก DB
    db.all("SELECT * FROM builds", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.render('pages/error');
        }

        // 3. จัดกลุ่ม Build ให้เข้ากับ Hero Filename
        // Output: { 'l+_kris.png': [ {build1}, {build2} ], ... }
        const buildsMap = {};
        rows.forEach(b => {
            if (!buildsMap[b.hero_filename]) buildsMap[b.hero_filename] = [];
            
            // Parse JSON ที่เก็บไว้
            try {
                b.accessories = JSON.parse(b.accessories || '[]');
                b.substats = JSON.parse(b.substats || '[]');
            } catch (e) {
                b.accessories = [];
                b.substats = [];
            }
            
            buildsMap[b.hero_filename].push(b);
        });

        res.render('pages/build', {
            title: `Builds - ${gradeParam.toUpperCase()}`,
            page: 'build',      // Active Navbar
            grade: gradeParam,
            heroes: filteredHeroes,
            buildsMap: buildsMap
        });
    });
};