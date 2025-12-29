const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminCodexController = require('../controllers/adminCodexController');
const raidController = require('../controllers/raidController');
const castleRushController = require('../controllers/castleRushController');

// Middleware: Body Parser
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Middleware: Check Auth
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// --- Routes ---
// Login
router.get('/login', adminController.getLoginPage);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Dashboard
router.get('/dashboard', requireAdmin, adminController.getDashboard);

// Tier List
router.get('/manage/tierlist', requireAdmin, adminController.getTierListManager);
router.post('/api/save_tier', requireAdmin, adminController.saveTierList);

// Build Manager
router.get('/manage/build/:grade', requireAdmin, adminController.getBuildManager);
router.post('/api/save_build', requireAdmin, adminController.saveBuild);
router.post('/api/delete_build', requireAdmin, adminController.deleteBuild);

// Comp & Guide
router.get('/manage/comp/stage', requireAdmin, adminController.getStageCompManager);
router.post('/api/save_stage_comp', requireAdmin, adminController.saveStageComp);
router.post('/api/delete_stage_comp', requireAdmin, adminController.deleteStageComp);

router.get('/manage/comp/dungeon', requireAdmin, adminController.getDungeonManager);
router.post('/api/save_dungeon_comp', requireAdmin, adminController.saveDungeonComp);
router.post('/api/delete_dungeon_comp', requireAdmin, adminController.deleteDungeonComp);

router.get('/manage/comp/guild-war', requireAdmin, adminController.getGuildWarManager);
router.post('/api/save_guildwar_comp', requireAdmin, adminController.saveGuildWarComp);
router.post('/api/delete_guildwar_comp', requireAdmin, adminController.deleteGuildWarComp);

// --- CODEX ROUTES ---
router.post('/api/codex/category/delete', adminCodexController.deleteCategory);
router.post('/api/codex/group/delete', adminCodexController.deleteGroup);
// Hero Codex
router.get('/codex/hero', adminCodexController.getIndex);
router.post('/codex/hero/add', adminCodexController.addHero);
router.get('/codex/hero/delete/:id', adminCodexController.deleteHero);
router.post('/api/codex/save_skill_order', adminCodexController.saveSkillOrder);

// Pet Codex
router.get('/codex/pet', adminCodexController.getPetIndex);
router.post('/codex/pet/add', adminCodexController.addPet);
router.get('/codex/pet/delete/:id', adminCodexController.deletePet);

// Shared Actions (Add Category / Group)
router.post('/codex/category/add', adminCodexController.addCategory);
router.post('/codex/group/add', adminCodexController.addGroup);

// --- RAID MANAGER --- [NEW SECTION]
router.get('/manage/raid', requireAdmin, raidController.getIndex);
router.post('/api/raid/add_boss', requireAdmin, raidController.addRaidBoss);
router.post('/api/raid/delete_boss', requireAdmin, raidController.deleteRaidBoss);
router.post('/api/raid/save_team', requireAdmin, raidController.saveTeam);
router.post('/api/raid/delete_team', requireAdmin, raidController.deleteTeam);

// --- CASTLE RUSH MANAGER --- [NEW]
router.get('/manage/castle-rush', requireAdmin, castleRushController.getIndex);
router.post('/api/castle-rush/save_team', requireAdmin, castleRushController.saveTeam);
router.post('/api/castle-rush/delete_team', requireAdmin, castleRushController.deleteTeam);

module.exports = router;