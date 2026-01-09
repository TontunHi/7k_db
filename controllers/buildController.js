const fileHelper = require('../utils/fileHelper');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const BuildService = require('../services/buildService');
const db = require('../database/database');
const SkillService = require('../services/skillService');

// ==========================================
// PUBLIC: แสดงหน้า Build สำหรับ User ทั่วไป
// ==========================================
exports.getBuildPage = (req, res) => {
    const gradeParam = req.params.grade ? req.params.grade.toLowerCase() : 'legendary';

    // 1. ดึงข้อมูล Heroes จาก DB เพื่อเอา Skill info
    db.all("SELECT * FROM codex_heroes", [], async (err, dbHeroes) => {
        if (err) {
            console.error("DB Error:", err);
            return res.render('pages/error');
        }

        try {
            // 2. Process Heroes from DB (Source of Truth)
            let heroes = dbHeroes.map(h => {
                let filename = h.image_name;
                let grade = '';
                if (filename.startsWith('l++_')) grade = 'l++';
                else if (filename.startsWith('l+_')) grade = 'l+';
                else if (filename.startsWith('l_')) grade = 'l';
                else if (filename.startsWith('r_')) grade = 'r';
                else if (filename.startsWith('uc_')) grade = 'uc';
                else if (filename.startsWith('c_')) grade = 'c';

                let name = h.name;
                if (!name) {
                    name = filename.replace(/\.[^/.]+$/, "").replace(/^[a-z]+_+/, "");
                }

                return {
                    filename: filename,
                    grade: grade,
                    name: name,
                    skill_folder: h.skill_folder,
                    skill_order: h.skill_order // Pass through
                };
            });

            // Filter Grade
            heroes = heroes.filter(h => {
                if (gradeParam === 'legendary') return h.grade.startsWith('l');
                if (gradeParam === 'rare') return h.grade === 'r';
                return true;
            });

            // Sort by Grade (l++ > l+ > l > r > uc > c) -> Name (Asc)
            const gradeWeight = { 'l++': 6, 'l+': 5, 'l': 4, 'r': 3, 'uc': 2, 'c': 1 };
            heroes.sort((a, b) => {
                const wA = gradeWeight[a.grade] || 0;
                const wB = gradeWeight[b.grade] || 0;
                if (wA !== wB) return wB - wA; // Grade Descending
                return a.name.localeCompare(b.name); // Name Ascending
            });

            // 3. Merge DB Data & Process Skills
            // 3. Merge DB Data & Process Skills
            const enrichedHeroes = await Promise.all(heroes.map(async (hero) => {
                // Find matching DB record
                const dbHero = dbHeroes.find(dbh => dbh.image_name === hero.filename);

                // [Refactor] Use SkillService
                const skillData = await SkillService.getHeroSkills(
                    hero.filename,
                    dbHero ? dbHero.skill_folder : null,
                    dbHero ? dbHero.skill_order : null
                );

                return {
                    ...hero,
                    ...skillData
                };
            }));

            // 4. ดึงข้อมูล Builds ผ่าน Service
            const builds = await BuildService.getAllBuilds();
            const buildsMap = BuildService.processBuildsForDisplay(builds);

            res.render('pages/build', {
                title: `Builds - ${gradeParam.toUpperCase()}`,
                page: 'build',
                grade: gradeParam,
                heroes: enrichedHeroes, // Send enriched data
                buildsMap: buildsMap
            });
        } catch (processErr) {
            console.error(processErr);
            res.render('pages/error');
        }
    });
};

// ==========================================
// ADMIN: จัดการ Build (Build Manager)
// ==========================================
exports.getBuildManager = async (req, res) => {
    try {
        const grade = req.params.grade || 'legendary';

        // 1. ดึงข้อมูล Hero เพื่อใช้ใน Sidebar
        // 1. ดึงข้อมูล Hero เพื่อใช้ใน Sidebar
        const heroFiles = fileHelper.getSortedImages('heroes');
        const heroes = heroFiles.map(file => fileHelper.getGradeAndName(file));

        // 2. [FIX] เตรียมรายชื่อไฟล์รูปภาพไอเทมสำหรับ Picker
        const getItemImages = (subfolder) => {
            let dir = path.join(__dirname, '../public/images/Items', subfolder);
            if (!fs.existsSync(dir)) {
                dir = path.join(__dirname, '../public/images/items', subfolder);
            }

            try {
                if (fs.existsSync(dir)) {
                    return fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
                }
            } catch (e) {
                console.error(`Error reading directory ${subfolder}:`, e.message);
            }
            return [];
        };

        const itemImages = {
            weapons: getItemImages('weapon'),
            armors: getItemImages('armor'),
            accessories: getItemImages('accessories')
        };

        // 3. ดึงข้อมูล Builds ทั้งหมดผ่าน Service
        const builds = await BuildService.getAllBuilds();
        const buildsMap = BuildService.processBuildsForDisplay(builds);

        res.render('pages/admin/build_manager', {
            grade,
            heroes,
            buildsMap,
            itemImages
        });
    } catch (err) {
        console.error(err);
        res.send("DB Error");
    }
};

// API: บันทึก Build
exports.saveBuild = async (req, res) => {
    try {
        const result = await BuildService.saveBuild(req.body);

        if (req.body.id) {
            // Optional: Add logging if you have a logging system
            // if (logAction) logAction(req, 'UPDATE', `Build ID: ${req.body.id}`, `Updated build`);
        } else {
            // if (logAction) logAction(req, 'CREATE', `Build ID: ${result.id}`, `Created build`);
        }

        res.json(result);
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

// API: ลบ Build
exports.deleteBuild = async (req, res) => {
    try {
        const { id } = req.body;
        await BuildService.deleteBuild(id);
        // if (logAction) logAction(req, 'DELETE', `Build ID: ${id}`, 'Deleted build');
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};