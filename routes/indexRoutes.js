const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const tierListController = require('../controllers/tierListController');
const buildController = require('../controllers/buildController');
const compController = require('../controllers/compController');

// --- Home ---
router.get('/', homeController.getHomePage);

// --- Tier List ---
router.get('/tierlist', (req, res) => res.redirect('/tierlist/pvp'));
router.get('/tierlist/:category', tierListController.getTierListPage);

// --- Build (User Side) ---
router.get('/build', (req, res) => res.redirect('/build/legendary'));
router.get('/build/:grade', buildController.getBuildPage);

// --- Comp & Guide ---
// 1. ใส่ Route ที่เฉพาะเจาะจงก่อน (Stage)
router.get('/comp/stage', compController.getStagePage);
router.get('/comp/dungeon', compController.getDungeonPage);
router.get('/comp/:page', (req, res) => res.send('Page Coming Soon'));

// 2. ใส่ Route ทั่วไปทีหลัง (สำหรับหน้าอื่นๆ ที่ยังไม่เสร็จ)
router.get('/comp/:page', (req, res) => res.send('Comp Page Coming Soon'));
router.get('/comp', (req, res) => res.send('Comp Page Coming Soon'));

module.exports = router;