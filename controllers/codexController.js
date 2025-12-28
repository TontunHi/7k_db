// [file: controllers/codexController.js]
const db = require('../database/database');
const path = require('path');
const fs = require('fs');
const { logAction } = require('../middleware/logger');

exports.getHeroCodex = (req, res) => {
    const catId = req.query.cat_id ? parseInt(req.query.cat_id) : null;
    const groupId = req.query.group_id ? parseInt(req.query.group_id) : null;

    // 1. Get Categories
    db.all("SELECT * FROM codex_categories WHERE type = 'hero'", [], (err, categories) => {
        if (err) return res.render('error', { message: 'DB Error' });

        const activeCatId = catId || (categories.length > 0 ? categories[0].id : null);

        // 2. Get Groups
        db.all("SELECT * FROM codex_groups WHERE category_id = ?", [activeCatId], (err, groups) => {
            if (err) return res.render('error', { message: 'DB Error' });

            const activeGroupId = groupId || (groups.length > 0 ? groups[0].id : null);

            // 3. Get Heroes
            db.all("SELECT * FROM codex_heroes WHERE group_id = ?", [activeGroupId], (err, heroes) => {
                if (err) return res.render('error', { message: 'DB Error' });

                // Process Skills & Priority
                const heroesData = heroes.map(hero => {
                    // Skill Order (จากที่ Admin เรียงไว้)
                    let skillOrder = [];
                    try { skillOrder = JSON.parse(hero.skill_order || '[]'); } catch(e) {}

                    // เช็ค Folder รูปสกิล
                    let folder = hero.skill_folder || hero.image_name.replace(/\.[^/.]+$/, "");
                    let allSkills = [];
                    const skillPath = path.join(__dirname, '../public/images/skill', folder);
                    
                    if (fs.existsSync(skillPath)) {
                        allSkills = fs.readdirSync(skillPath).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f));
                    }

                    return {
                        ...hero,
                        skillFolder: folder,
                        skillOrder: skillOrder, // ลำดับที่ Admin เลือก
                        allSkills: allSkills    // สกิลทั้งหมดที่มี (เผื่อไว้)
                    };
                });

                res.render('pages/codex_hero', {
                    title: 'Hero Codex',
                    categories, groups, heroes: heroesData,
                    activeCatId, activeGroupId
                });
            });
        });
    });
};

exports.getPetCodex = (req, res) => {
    const catId = req.query.cat_id ? parseInt(req.query.cat_id) : null;
    const groupId = req.query.group_id ? parseInt(req.query.group_id) : null;

    db.all("SELECT * FROM codex_categories WHERE type = 'pet'", [], (err, categories) => {
        if (err) return res.render('error', { message: 'DB Error' });
        
        const activeCatId = catId || (categories.length > 0 ? categories[0].id : null);

        db.all("SELECT * FROM codex_groups WHERE category_id = ?", [activeCatId], (err, groups) => {
            if (err) return res.render('error', { message: 'DB Error' });

            const activeGroupId = groupId || (groups.length > 0 ? groups[0].id : null);

            db.all("SELECT * FROM codex_pets WHERE group_id = ?", [activeGroupId], (err, pets) => {
                if (err) return res.render('error', { message: 'DB Error' });

                res.render('pages/codex_pet', {
                    title: 'Pet Codex',
                    categories, groups, pets,
                    activeCatId, activeGroupId
                });
            });
        });
    });
};