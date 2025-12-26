// [file: controllers/adminCodexController.js]
const db = require('../database/database'); 
const { formatHeroName, getFilesFromDir } = require('../utils/fileHelper'); 
const fs = require('fs');
const path = require('path');

// แสดงหน้าจัดการ Hero Codex
exports.getIndex = (req, res) => {
    db.all("SELECT * FROM codex_categories WHERE type = 'hero'", [], (err, categories) => {
        if (err) { console.error(err); return res.send("DB Error: Categories"); }

        db.all("SELECT * FROM codex_groups", [], (err, groups) => {
            if (err) { console.error(err); return res.send("DB Error: Groups"); }

            db.all("SELECT * FROM codex_heroes", [], (err, heroes) => {
                if (err) { console.error(err); return res.send("DB Error: Heroes"); }

                // 4. อ่านไฟล์รูปทั้งหมดในโฟลเดอร์ heroes (เรียงชื่อ)
                const availableImages = getFilesFromDir('images/heroes').sort();

                // [UPDATE START] : Logic หา Skill Images อัตโนมัติ
                const heroesWithSkills = heroes.map(hero => {
                    // หาชื่อโฟลเดอร์: ถ้าใน DB ไม่มี ให้ใช้ชื่อรูปภาพตัดนามสกุลออก
                    let folderName = hero.skill_folder;
                    if (!folderName && hero.image_name) {
                        folderName = hero.image_name.replace(/\.[^/.]+$/, ""); // ตัด .png ออก
                    }

                    let skills = [];
                    // ตรวจสอบว่ามีโฟลเดอร์นี้จริงไหม
                    if (folderName) {
                        const skillPath = path.join(__dirname, '../public/images/skill', folderName);
                        if (fs.existsSync(skillPath)) {
                            // อ่านไฟล์ทั้งหมดในโฟลเดอร์นั้น
                            skills = fs.readdirSync(skillPath).filter(file => {
                                return /\.(png|jpg|jpeg|gif)$/i.test(file);
                            });
                        }
                    }

                    return {
                        ...hero,
                        detectedSkillFolder: folderName, // ส่งชื่อโฟลเดอร์ที่ใช้อ้างอิงไป
                        skillImages: skills // ส่ง list รายชื่อไฟล์รูปสกิลไป
                    };
                });
                // [UPDATE END]

                res.render('pages/admin/codex_hero_manager', {
                    title: 'Hero Codex Manager',
                    categories: categories,
                    groups: groups,
                    heroes: heroesWithSkills, // ส่งตัวแปรที่ Process แล้วไป
                    availableHeroImages: availableImages,
                    user: req.session ? req.session.user : null 
                });
            });
        });
    });
};

// ... (Functions addCategory, addGroup, addHero, deleteHero, etc. ยังคงเดิม)
exports.addCategory = (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO codex_categories (name, type) VALUES (?, 'hero')", [name], (err) => {
        if (err) console.error(err);
        res.redirect('/admin/codex/hero');
    });
};

exports.addGroup = (req, res) => {
    const { category_id, name } = req.body;
    db.run("INSERT INTO codex_groups (category_id, name) VALUES (?, ?)", [category_id, name], (err) => {
        if (err) console.error(err);
        res.redirect('/admin/codex/hero');
    });
};

exports.addHero = (req, res) => {
    const { group_id, image_name, skill_folder } = req.body;
    const cleanName = formatHeroName(image_name); 

    db.run("INSERT INTO codex_heroes (group_id, name, image_name, skill_folder) VALUES (?, ?, ?, ?)", 
        [group_id, cleanName, image_name, skill_folder], 
        (err) => {
            if (err) console.error(err);
            res.redirect('/admin/codex/hero');
        }
    );
};

exports.deleteHero = (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM codex_heroes WHERE id = ?", [id], (err) => {
        if (err) console.error(err);
        res.redirect('/admin/codex/hero');
    });
};