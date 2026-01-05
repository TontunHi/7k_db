const fileHelper = require('../utils/fileHelper');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const BuildService = require('../services/buildService');
const db = require('../database/database');

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
            // 2. ดึงรูป Heroes (File System is Source of Truth for existence)
            const heroFiles = fileHelper.getSortedImages('heroes');
            let heroes = heroFiles.map(file => fileHelper.getGradeAndName(file));

            // Filter Grade
            heroes = heroes.filter(h => {
                if (gradeParam === 'legendary') return h.grade.startsWith('l');
                if (gradeParam === 'rare') return h.grade === 'r';
                return true;
            });

            // 3. Merge DB Data & Process Skills
            const enrichedHeroes = await Promise.all(heroes.map(async (hero) => {
                // Find matching DB record
                const dbHero = dbHeroes.find(dbh => dbh.image_name === hero.filename);

                let skillData = {
                    skillFolder: '',
                    skillOrder: [],
                    allSkills: []
                };

                if (dbHero) {
                    // Parse Skill Order
                    try {
                        skillData.skillOrder = JSON.parse(dbHero.skill_order || "[]");
                    } catch (e) { }

                    // Determine Folder
                    let folder = dbHero.skill_folder || hero.filename.replace(/\.[^/.]+$/, "");
                    skillData.skillFolder = folder;

                    // Read Skill Files
                    const skillPath = path.join(__dirname, '../public/images/skill', folder);
                    try {
                        await fsPromises.stat(skillPath);
                        const files = await fsPromises.readdir(skillPath);
                        skillData.allSkills = files.filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
                    } catch (error) {
                        // Folder not found or empty
                    }
                }

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