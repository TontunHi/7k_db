const db = require('../database/database');
const fs = require('fs');
const path = require('path');

exports.getStagePage = async (req, res) => {
    try {
        const StageService = require('../services/StageService');
        const stagesList = await StageService.getAllStages();

        res.render('pages/comp_stage', {
            title: 'Stage & Nightmare Guide',
            page: 'comp', // Active Navbar
            stages: stagesList
        });
    } catch (err) {
        console.error(err);
        res.render('pages/error');
    }
};

exports.getDungeonPage = async (req, res) => {
    try {
        const DungeonService = require('../services/DungeonService');
        const groupedDungeons = await DungeonService.getDungeonData();

        res.render('pages/comp_dungeon', {
            title: 'Dungeon Guide',
            page: 'comp', // Active Navbar
            dungeons: groupedDungeons
        });
    } catch (err) {
        console.error(err);
        res.render('pages/error');
    }
};

exports.getGuildWarPage = async (req, res) => {
    try {
        const GuildWarService = require('../services/GuildWarService');
        const comps = await GuildWarService.getAllComps();

        res.render('pages/comp_guildwar', {
            title: 'Guild War Guide',
            page: 'comp', // Active Navbar State
            comps: comps
        });
    } catch (err) {
        console.error(err);
        res.render('pages/error');
    }
};