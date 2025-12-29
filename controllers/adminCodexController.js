const db = require('../database/database'); 
const { formatHeroName, getFilesFromDir } = require('../utils/fileHelper'); 
const fs = require('fs');
const path = require('path');

// --- HERO SECTION ---

exports.getIndex = (req, res) => {
    const selectedCatId = req.query.cat_id ? parseInt(req.query.cat_id) : null;
    const selectedGroupId = req.query.group_id ? parseInt(req.query.group_id) : null;

    // Filter เฉพาะ type = 'hero'
    db.all("SELECT * FROM codex_categories WHERE type = 'hero'", [], (err, categories) => {
        if (err) { console.error(err); return res.send("DB Error: Categories"); }
        
        const activeCatId = selectedCatId || (categories.length > 0 ? categories[0].id : null);

        db.all("SELECT * FROM codex_groups WHERE category_id = ?", [activeCatId], (err, groups) => {
            if (err) { console.error(err); return res.send("DB Error: Groups"); }

            const activeGroupId = selectedGroupId || (groups.length > 0 ? groups[0].id : null);

            db.all("SELECT * FROM codex_heroes WHERE group_id = ?", [activeGroupId], (err, heroes) => {
                if (err) { console.error(err); return res.send("DB Error: Heroes"); }

                const availableImages = getFilesFromDir('images/heroes').sort();
                
                const heroesWithSkills = heroes.map(hero => {
                    let folderName = hero.skill_folder;
                    if (!folderName && hero.image_name) folderName = hero.image_name.replace(/\.[^/.]+$/, "");
                    
                    let skills = [];
                    if (folderName) {
                        const skillPath = path.join(__dirname, '../public/images/skill', folderName);
                        if (fs.existsSync(skillPath)) {
                            // เรียงชื่อไฟล์สกิล A-Z (จากขวามาซ้ายใน UI)
                            skills = fs.readdirSync(skillPath)
                                .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
                                .sort(); 
                        }
                    }
                    
                    // Parse skill_order
                    let skillOrder = [];
                    try { skillOrder = hero.skill_order ? JSON.parse(hero.skill_order) : []; } catch (e) {}

                    return { ...hero, detectedSkillFolder: folderName, skillImages: skills, skillOrder: skillOrder };
                });

                res.render('pages/admin/codex_hero_manager', {
                    title: 'Hero Codex Manager',
                    categories: categories,
                    groups: groups,
                    heroes: heroesWithSkills,
                    availableHeroImages: availableImages,
                    activeCatId: activeCatId,
                    activeGroupId: activeGroupId,
                    user: req.session ? req.session.user : null 
                });
            });
        });
    });
};

exports.addHero = (req, res) => {
    const { group_id, image_name, skill_folder, return_cat_id } = req.body;
    const cleanName = formatHeroName(image_name); 

    db.run("INSERT INTO codex_heroes (group_id, name, image_name, skill_folder) VALUES (?, ?, ?, ?)", 
        [group_id, cleanName, image_name, skill_folder], 
        (err) => {
            if (err) console.error(err);
            res.redirect(`/admin/codex/hero?cat_id=${return_cat_id}&group_id=${group_id}`);
        }
    );
};

exports.deleteHero = (req, res) => {
    const { id } = req.params;
    const { cat_id, group_id } = req.query; 

    db.run("DELETE FROM codex_heroes WHERE id = ?", [id], (err) => {
        if (err) console.error(err);
        res.redirect(`/admin/codex/hero?cat_id=${cat_id}&group_id=${group_id}`);
    });
};

exports.saveSkillOrder = (req, res) => {
    const { hero_id, skill_order } = req.body;
    const jsonOrder = JSON.stringify(skill_order);

    db.run("UPDATE codex_heroes SET skill_order = ? WHERE id = ?", [jsonOrder, hero_id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
};


// --- PET SECTION ---

exports.getPetIndex = (req, res) => {
    const selectedCatId = req.query.cat_id ? parseInt(req.query.cat_id) : null;
    const selectedGroupId = req.query.group_id ? parseInt(req.query.group_id) : null;

    db.all("SELECT * FROM codex_categories WHERE type = 'pet'", [], (err, categories) => {
        if (err) { console.error(err); return res.send("DB Error: Categories"); }

        const activeCatId = selectedCatId || (categories.length > 0 ? categories[0].id : null);

        db.all("SELECT * FROM codex_groups WHERE category_id = ?", [activeCatId], (err, groups) => {
            if (err) { console.error(err); return res.send("DB Error: Groups"); }

            const activeGroupId = selectedGroupId || (groups.length > 0 ? groups[0].id : null);

            db.all("SELECT * FROM codex_pets WHERE group_id = ?", [activeGroupId], (err, pets) => {
                if (err) { console.error(err); return res.send("DB Error: Pets"); }

                // ดึงรูปสัตว์เลี้ยงจาก folder images/pets
                let availablePetImages = [];
                try {
                     availablePetImages = getFilesFromDir('images/pets').sort();
                } catch(e) {
                     // ถ้ายังไม่มี folder pets ให้สร้าง array ว่าง หรือ log error
                     console.log("Folder images/pets not found or empty");
                }

                res.render('pages/admin/codex_pet_manager', {
                    title: 'Pet Codex Manager',
                    categories: categories, 
                    groups: groups, 
                    pets: pets, 
                    availablePetImages: availablePetImages,
                    activeCatId: activeCatId, 
                    activeGroupId: activeGroupId,
                    user: req.session ? req.session.user : null 
                });
            });
        });
    });
};

exports.addPet = (req, res) => {
    const { group_id, image_name, return_cat_id } = req.body;
    const cleanName = formatHeroName(image_name);

    db.run("INSERT INTO codex_pets (group_id, name, image_name) VALUES (?, ?, ?)", 
        [group_id, cleanName, image_name], 
        (err) => {
            if (err) console.error(err);
            res.redirect(`/admin/codex/pet?cat_id=${return_cat_id}&group_id=${group_id}`);
        }
    );
};

exports.deletePet = (req, res) => {
    const { id } = req.params;
    const { cat_id, group_id } = req.query; 

    db.run("DELETE FROM codex_pets WHERE id = ?", [id], (err) => {
        if (err) console.error(err);
        res.redirect(`/admin/codex/pet?cat_id=${cat_id}&group_id=${group_id}`);
    });
};


// --- SHARED ACTIONS (Category/Group) ---

exports.addCategory = (req, res) => {
    const { name, type } = req.body;
    const redirectUrl = type === 'pet' ? '/admin/codex/pet' : '/admin/codex/hero';
    
    db.run("INSERT INTO codex_categories (name, type) VALUES (?, ?)", [name, type || 'hero'], function(err) {
        if (err) console.error(err);
        res.redirect(`${redirectUrl}?cat_id=${this.lastID}`);
    });
};

exports.addGroup = (req, res) => {
    const { category_id, name, type } = req.body;
    const redirectUrl = type === 'pet' ? '/admin/codex/pet' : '/admin/codex/hero';

    db.run("INSERT INTO codex_groups (category_id, name) VALUES (?, ?)", [category_id, name], function(err) {
        if (err) console.error(err);
        res.redirect(`${redirectUrl}?cat_id=${category_id}&group_id=${this.lastID}`);
    });
};