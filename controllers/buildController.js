const fileHelper = require('../utils/fileHelper');
const fs = require('fs');
const path = require('path');
const BuildService = require('../services/buildService');

// ==========================================
// PUBLIC: แสดงหน้า Build สำหรับ User ทั่วไป
// ==========================================
exports.getBuildPage = async (req, res) => {
    try {
        const gradeParam = req.params.grade ? req.params.grade.toLowerCase() : 'legendary';

        // 1. ดึงรูป Heroes
        // 1. ดึงรูป Heroes
        const heroFiles = fileHelper.getSortedImages('heroes');
        const heroes = heroFiles.map(file => fileHelper.getGradeAndName(file)); // Map string -> object

        const filteredHeroes = heroes.filter(h => {
            if (gradeParam === 'legendary') return h.grade.startsWith('l');
            if (gradeParam === 'rare') return h.grade === 'r';
            return true;
        });

        // 2. ดึงข้อมูล Builds ผ่าน Service
        const builds = await BuildService.getAllBuilds();
        const buildsMap = BuildService.processBuildsForDisplay(builds);

        res.render('pages/build', {
            title: `Builds - ${gradeParam.toUpperCase()}`,
            page: 'build',
            grade: gradeParam,
            heroes: filteredHeroes,
            buildsMap: buildsMap
        });
    } catch (err) {
        console.error(err);
        res.render('pages/error');
    }
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