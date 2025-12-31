require('dotenv').config();
const db = require('../database/database');
const fileHelper = require('../utils/fileHelper');
const fs = require('fs'); // อย่าลืม require fs ถ้ายังไม่มี
const path = require('path');
const BuildService = require('../services/buildService');

// --- Auth Section ---
exports.getLoginPage = (req, res) => {
    res.render('pages/admin/login', {
        title: 'Admin Login',
        error: null,
        layout: false
    });
};

exports.postLogin = (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('pages/admin/login', {
            title: 'Admin Login',
            error: 'Username or Password incorrect',
            layout: false
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
};

// --- Dashboard Section ---
exports.getDashboard = (req, res) => {
    res.render('pages/admin/dashboard', {
        title: 'Admin Dashboard',
        page: 'dashboard'
    });
};

// --- Tier List Manager Section ---
// --- Tier List Manager Section ---
exports.getTierListManager = async (req, res) => {
    try {
        const category = req.query.category || 'PVP';
        const isPetCategory = category === 'PET';
        const folder = isPetCategory ? 'pets' : 'heroes';

        // 1. Get Images
        const imageFiles = fileHelper.getSortedImages(folder);
        const allItems = imageFiles.map(file => fileHelper.getGradeAndName(file));

        // 2. Get Data via Service
        const TierListService = require('../services/TierListService');
        const assignedMap = await TierListService.getTierData(category);
        const { ranks, tierData, poolData } = TierListService.processTierData(allItems, assignedMap);

        res.render('pages/admin/tierlist_manager', {
            title: 'Admin Panel - Tier List',
            page: 'admin_tier',
            category: category,
            ranks: ranks,
            tierData: tierData,
            poolData: poolData,
            folder: folder
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// --- API Save Tier ---
exports.saveTierList = async (req, res) => {
    try {
        const { category, data } = req.body;
        const TierListService = require('../services/TierListService');
        const result = await TierListService.saveTierList(category, data);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- Build Manager ---
exports.getBuildManager = async (req, res) => {
    try {
        const gradeParam = req.params.grade.toLowerCase();

        // 1. Get Heroes
        const heroFiles = fileHelper.getSortedImages('heroes');
        const heroes = heroFiles.map(file => fileHelper.getGradeAndName(file));
        const filteredHeroes = heroes.filter(h => {
            if (gradeParam === 'legendary') return h.grade.startsWith('l'); // Matches l, l+, l++
            if (gradeParam === 'rare') return ['r', 'uc', 'c'].includes(h.grade); // Matches Rare, Common, Uncommon
            return true;
        });

        // 2. Get Items Images (New Paths)
        const weaponImages = fileHelper.getImageFiles('items/weapon');
        const armorImages = fileHelper.getImageFiles('items/armor');
        const accImages = fileHelper.getImageFiles('items/accessories');

        // 3. Get Builds Data via Service
        const builds = await BuildService.getAllBuilds();
        const buildsMap = BuildService.processBuildsForDisplay(builds);

        res.render('pages/admin/build_manager', {
            title: `Manage Builds - ${gradeParam}`,
            grade: gradeParam,
            heroes: filteredHeroes,
            buildsMap: buildsMap,
            itemImages: {
                weapons: weaponImages,
                armors: armorImages,
                accessories: accImages
            }
        });
    } catch (err) {
        console.error(err);
        res.send("DB Error");
    }
};

exports.saveBuild = async (req, res) => {
    try {
        const result = await BuildService.saveBuild(req.body);
        res.json(result);
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

exports.deleteBuild = async (req, res) => {
    try {
        const { id } = req.body;
        await BuildService.deleteBuild(id);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

// --- Stage & Nightmare Manager ---
// --- Stage & Nightmare Manager ---
exports.getStageCompManager = async (req, res) => {
    try {
        const heroFiles = fileHelper.getSortedImages('heroes');
        const heroes = heroFiles.map(file => fileHelper.getGradeAndName(file));

        const StageService = require('../services/StageService');
        const stagesList = await StageService.getAllStages();

        res.render('pages/admin/stage_manager', {
            title: 'Manage Stage & Nightmare',
            category: 'Stage',
            heroes: heroes,
            stages: stagesList
        });
    } catch (err) {
        console.error(err);
        res.send("DB Error");
    }
};

exports.saveStageComp = async (req, res) => {
    try {
        const StageService = require('../services/StageService');
        // [UPDATE] Use saveStageGroup
        const result = await StageService.saveStageGroup(req.body);
        res.json(result);
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

exports.deleteStageComp = async (req, res) => {
    try {
        const { main, sub, type } = req.body; // [UPDATE] Expect group identifiers
        const StageService = require('../services/StageService');
        await StageService.deleteStageGroup(main, sub, type);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

// --- Dungeon Manager ---
exports.getDungeonManager = async (req, res) => {
    try {
        const heroFiles = fileHelper.getSortedImages('heroes');
        const heroes = heroFiles.map(file => fileHelper.getGradeAndName(file));

        const DungeonService = require('../services/DungeonService');
        const groupedDungeons = await DungeonService.getDungeonData();

        res.render('pages/admin/dungeon_manager', {
            title: 'Manage Dungeon',
            dungeons: groupedDungeons,
            heroes: heroes
        });
    } catch (err) {
        console.error(err);
        res.send("DB Error");
    }
};

exports.saveDungeonComp = async (req, res) => {
    try {
        const DungeonService = require('../services/DungeonService');
        const result = await DungeonService.saveDungeon(req.body);
        res.json(result);
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

exports.deleteDungeonComp = async (req, res) => {
    try {
        const { id } = req.body;
        const DungeonService = require('../services/DungeonService');
        await DungeonService.deleteDungeon(id);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

// --- Guild War Manager ---
// --- Guild War Manager ---
exports.getGuildWarManager = async (req, res) => {
    try {
        const heroFiles = fileHelper.getSortedImages('heroes');
        const heroes = heroFiles.map(file => fileHelper.getGradeAndName(file));
        let pets = [];
        try {
            const petDir = path.join(__dirname, '../public/images/pets');
            if (fs.existsSync(petDir)) {
                pets = fs.readdirSync(petDir).filter(f => ['.png', '.webp', '.jpg'].includes(path.extname(f).toLowerCase()));
            }
        } catch (e) { }

        const GuildWarService = require('../services/GuildWarService');
        const comps = await GuildWarService.getAllComps();

        res.render('pages/admin/guildwar_manager', {
            title: 'Manage Guild War',
            comps: comps,
            heroes: heroes,
            pets: pets
        });
    } catch (err) {
        console.error(err);
        res.send("DB Error");
    }
};

exports.saveGuildWarComp = async (req, res) => {
    try {
        const GuildWarService = require('../services/GuildWarService');
        await GuildWarService.saveComp(req.body);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

exports.deleteGuildWarComp = async (req, res) => {
    try {
        const { id } = req.body;
        const GuildWarService = require('../services/GuildWarService');
        await GuildWarService.deleteComp(id);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};