const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const tierListController = require('../controllers/tierListController');
const buildController = require('../controllers/buildController');
const compController = require('../controllers/compController');
const codexController = require('../controllers/codexController');
const raidController = require('../controllers/raidController');
const castleRushController = require('../controllers/castleRushController');

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
router.get('/comp/guild-war', compController.getGuildWarPage);

// --- RAID ROUTES (USER) ---
router.get('/raid', raidController.getUserIndex);

// --- CODEX ROUTES (USER) ---
router.get('/codex/hero', codexController.getHeroCodex);
router.get('/codex/pet', codexController.getPetCodex);

// --- CASTLE RUSH (USER) ---
router.get('/castle-rush', castleRushController.getUserIndex);
module.exports = router;