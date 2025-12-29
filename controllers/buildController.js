const db = require('../database/database');
const fileHelper = require('../utils/fileHelper');
const fs = require('fs');
const path = require('path');

// ==========================================
// PUBLIC: แสดงหน้า Build สำหรับ User ทั่วไป
// ==========================================
exports.getBuildPage = (req, res) => {
    const gradeParam = req.params.grade ? req.params.grade.toLowerCase() : 'legendary';
    
    // 1. ดึงรูป Heroes
    const heroes = fileHelper.getSortedImages('heroes');
    const filteredHeroes = heroes.filter(h => {
        if (gradeParam === 'legendary') return h.grade.startsWith('l');
        if (gradeParam === 'rare') return h.grade === 'r';
        return true;
    });

    // 2. ดึงข้อมูล Builds
    db.all("SELECT * FROM builds", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.render('pages/error');
        }

        const buildsMap = {};
        rows.forEach(b => {
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

        res.render('pages/build', {
            title: `Builds - ${gradeParam.toUpperCase()}`,
            page: 'build',
            grade: gradeParam,
            heroes: filteredHeroes,
            buildsMap: buildsMap
        });
    });
};

// ==========================================
// ADMIN: จัดการ Build (Build Manager)
// ==========================================
exports.getBuildManager = (req, res) => {
    const grade = req.params.grade || 'legendary';

    // 1. ดึงข้อมูล Hero เพื่อใช้ใน Sidebar
    const heroes = fileHelper.getSortedImages('heroes');

    // 2. [FIX] เตรียมรายชื่อไฟล์รูปภาพไอเทมสำหรับ Picker
    // ฟังก์ชันช่วยอ่านไฟล์จากโฟลเดอร์
    const getItemImages = (subfolder) => {
        let dir = path.join(__dirname, '../public/images/Items', subfolder);
        // เช็คเผื่อกรณี folder เป็นตัวเล็ก (items)
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

    // สร้าง object itemImages ส่งไปให้หน้า EJS
    const itemImages = {
        weapons: getItemImages('weapon'),
        armors: getItemImages('armor'),
        accessories: getItemImages('accessories')
    };

    // 3. ดึงข้อมูล Builds ทั้งหมด
    db.all("SELECT * FROM builds", [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.send("DB Error");
        }

        const buildsMap = {};
        rows.forEach(b => {
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

        // Render หน้า Admin พร้อมส่งตัวแปร itemImages ไปด้วย (สำคัญมาก!)
        res.render('pages/admin/build_manager', {
            grade,
            heroes,
            buildsMap,
            itemImages // <-- นี่คือตัวแปรที่หน้า EJS รออยู่
        });
    });
};

// API: บันทึก Build
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
        // Update
        const sql = `UPDATE builds SET 
            hero_filename=?, build_name=?, c_level=?, mode=?,
            weapon1_img=?, weapon1_stat=?, armor1_img=?, armor1_stat=?,
            weapon2_img=?, weapon2_stat=?, armor2_img=?, armor2_stat=?,
            accessories=?, substats=?, description=?
            WHERE id=?`;
        
        const params = [
            hero_filename, build_name, c_level, mode,
            weapon1_img, weapon1_stat, armor1_img, armor1_stat,
            weapon2_img, weapon2_stat, armor2_img, armor2_stat,
            accJson, subJson, description, id
        ];

        db.run(sql, params, (err) => {
            if (err) return res.json({ success: false, error: err.message });
            if (logAction) logAction(req, 'UPDATE', `Build ID: ${id}`, `Updated build for ${hero_filename}`);
            res.json({ success: true, id: id });
        });
    } else {
        // Insert
        const sql = `INSERT INTO builds (
            hero_filename, build_name, c_level, mode,
            weapon1_img, weapon1_stat, armor1_img, armor1_stat,
            weapon2_img, weapon2_stat, armor2_img, armor2_stat,
            accessories, substats, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            hero_filename, build_name, c_level, mode,
            weapon1_img, weapon1_stat, armor1_img, armor1_stat,
            weapon2_img, weapon2_stat, armor2_img, armor2_stat,
            accJson, subJson, description
        ];

        db.run(sql, params, function(err) {
            if (err) return res.json({ success: false, error: err.message });
            if (logAction) logAction(req, 'CREATE', `Build ID: ${this.lastID}`, `Created build for ${hero_filename}`);
            res.json({ success: true, id: this.lastID });
        });
    }
};

// API: ลบ Build
exports.deleteBuild = (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM builds WHERE id = ?", [id], (err) => {
        if (err) return res.json({ success: false, error: err.message });
        if (logAction) logAction(req, 'DELETE', `Build ID: ${id}`, 'Deleted build');
        res.json({ success: true });
    });
};