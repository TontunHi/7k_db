const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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

// Dashboard (Panel)
router.get('/dashboard', requireAdmin, adminController.getDashboard);

// Manage Tier List
router.get('/manage/tierlist', requireAdmin, adminController.getTierListManager);
router.post('/api/save_tier', requireAdmin, adminController.saveTierList);

// --- Build Manager Routes ---
// Grade: 'legendary' หรือ 'rare'
router.get('/manage/build/:grade', requireAdmin, adminController.getBuildManager);

// API สำหรับบันทึกและลบ Build
router.post('/api/save_build', requireAdmin, adminController.saveBuild);
router.post('/api/delete_build', requireAdmin, adminController.deleteBuild);

// เพิ่ม Route ใหม่
router.get('/manage/comp/stage', requireAdmin, adminController.getStageCompManager);
router.post('/api/save_stage_comp', requireAdmin, adminController.saveStageComp);
router.post('/api/delete_stage_comp', requireAdmin, adminController.deleteStageComp);

//Dungeon
router.get('/manage/comp/dungeon', requireAdmin, adminController.getDungeonManager);
router.post('/api/save_dungeon_comp', requireAdmin, adminController.saveDungeonComp);
router.post('/api/delete_dungeon_comp', requireAdmin, adminController.deleteDungeonComp);

module.exports = router;