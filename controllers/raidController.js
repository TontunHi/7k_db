const db = require('../database/database');
const { getFilesFromDir, getSortedImages } = require('../utils/fileHelper');

exports.getIndex = (req, res) => {
    const selectedRaidId = req.query.raid_id ? parseInt(req.query.raid_id) : null;

    // 1. Get Raid Bosses
    db.all("SELECT * FROM raid_bosses", [], (err, raids) => {
        if (err) { console.error(err); return res.send("DB Error: Raids"); }

        // Get Hero Files
        const heroFiles = getSortedImages('heroes');
        const petFiles = getSortedImages('pets'); // [NEW] Fetch Pets Sorted

        // Create Map
        const heroesMap = {};
        heroFiles.forEach(filename => {
            heroesMap[filename] = {
                id: filename,
                name: filename.replace(/\.[^/.]+$/, ""),
                image_name: filename,
                skill_folder: filename.replace(/\.[^/.]+$/, ""),
                skills: getFilesFromDir(`images/skill/${filename.replace(/\.[^/.]+$/, "")}`)
            };
        });

        if (selectedRaidId) {
            // [NEW] Fetch Teams + Members
            const sql = `
                SELECT t.*, m.hero_id, m.slot_index
                FROM raid_teams t
                LEFT JOIN raid_team_members m ON t.id = m.team_id
                WHERE t.raid_id = ?
                ORDER BY t.id, m.slot_index
            `;

            db.all(sql, [selectedRaidId], (err, rows) => {
                if (err) { console.error(err); return res.send("DB Error: Teams"); }

                // Group Relational Data
                const teamMap = {};
                rows.forEach(r => {
                    if (!teamMap[r.id]) {
                        teamMap[r.id] = {
                            id: r.id,
                            raid_id: r.raid_id,
                            team_name: r.team_name,
                            formation: r.formation,
                            skill_priority: [], // Will parse below
                            description: r.description,
                            youtube_link: r.youtube_link,
                            pet_id: r.pet_id, // [NEW]
                            hero_ids: [],
                            _raw_skill: r.skill_priority // Temporary keep raw
                        };
                    }
                    if (r.hero_id) {
                        teamMap[r.id].hero_ids[r.slot_index] = r.hero_id;
                    }
                });

                // Finalize Arrays
                const teamsParsed = Object.values(teamMap).map(t => {
                    // Start with empty array of nulls/ids
                    const hIds = [null, null, null, null, null];
                    t.hero_ids.forEach((hid, i) => { if (hid) hIds[i] = hid; });
                    t.hero_ids = hIds;

                    try { t.skill_priority = JSON.parse(t._raw_skill || '[]'); } catch (e) { }
                    delete t._raw_skill;
                    return t;
                });

                res.render('pages/admin/raid_manager', {
                    title: 'Raid Manager',
                    viewState: 'detail',
                    raids,
                    activeRaid: raids.find(r => r.id === selectedRaidId),
                    teams: teamsParsed,
                    heroFiles,
                    petFiles, // [NEW]
                    heroesMap,
                    availableRaidImages: [],
                    user: req.session ? req.session.user : null
                });
            });
        } else {
            const availableRaidImages = getFilesFromDir('images/raid');

            res.render('pages/admin/raid_manager', {
                title: 'Raid Manager',
                viewState: 'list',
                raids,
                activeRaid: null,
                teams: [],
                heroFiles,
                petFiles, // [NEW]
                heroesMap,
                availableRaidImages,
                user: req.session ? req.session.user : null
            });
        }
    });
};

// ... (Function addRaidBoss, deleteRaidBoss, editRaidBoss unchanged) ...
exports.addRaidBoss = (req, res) => {
    const { name, image_name } = req.body;
    db.run("INSERT INTO raid_bosses (name, image_name) VALUES (?, ?)", [name, image_name], (err) => {
        if (err) console.error(err);
        res.redirect('/admin/manage/raid');
    });
};

exports.editRaidBoss = (req, res) => {
    const { id, name, image_name } = req.body;
    db.run("UPDATE raid_bosses SET name = ?, image_name = ? WHERE id = ?", [name, image_name, id], (err) => {
        if (err) console.error(err);
        res.redirect('/admin/manage/raid');
    });
};

exports.deleteRaidBoss = (req, res) => {
    const { id } = req.body;
    // Normalized deletion: Delete members -> teams -> boss
    db.run("DELETE FROM raid_team_members WHERE team_id IN (SELECT id FROM raid_teams WHERE raid_id = ?)", [id], (err) => {
        db.run("DELETE FROM raid_teams WHERE raid_id = ?", [id], (err) => {
            db.run("DELETE FROM raid_bosses WHERE id = ?", [id], (err) => {
                res.redirect('/admin/manage/raid');
            });
        });
    });
};

exports.saveTeam = (req, res) => {
    const { id, raid_id, team_name, formation, hero_ids, skill_priority, description, youtube_link } = req.body;
    // hero_ids is array. skill_priority is array.

    const skillPriorityJson = JSON.stringify(skill_priority || []);
    // Note: We still save skill_priority as JSON for now as it wasn't requested to be normalized, only hero components?
    // User asked "raid_teams", context implies compositions.
    // Migration script handled hero_ids/heroes. Skill priority is complex to normalize (seq order). Leaving as JSON.

    const runTransaction = async () => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                let teamId = id;
                const afterTeamOp = (err) => {
                    if (err) { db.run("ROLLBACK"); return reject(err); }

                    // Delete old members
                    db.run("DELETE FROM raid_team_members WHERE team_id = ?", [teamId], (err) => {
                        if (err) { db.run("ROLLBACK"); return reject(err); }

                        // Insert new members
                        const stmt = db.prepare("INSERT INTO raid_team_members (team_id, hero_id, slot_index) VALUES (?, ?, ?)");
                        if (hero_ids && Array.isArray(hero_ids)) {
                            hero_ids.forEach((hid, idx) => {
                                if (hid) stmt.run(teamId, hid, idx);
                            });
                        }
                        stmt.finalize((err) => {
                            if (err) { db.run("ROLLBACK"); return reject(err); }
                            db.run("COMMIT", (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    });
                };

                if (id) {
                    db.run(`UPDATE raid_teams SET team_name=?, formation=?, skill_priority=?, description=?, youtube_link=?, pet_id=? WHERE id=?`,
                        [team_name, formation, skillPriorityJson, description, youtube_link, req.body.pet_id, id],
                        function (err) { afterTeamOp(err); }
                    );
                } else {
                    db.run(`INSERT INTO raid_teams (raid_id, team_name, formation, skill_priority, description, youtube_link, pet_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [raid_id, team_name, formation, skillPriorityJson, description, youtube_link, req.body.pet_id],
                        function (err) {
                            if (err) { db.run("ROLLBACK"); return reject(err); }
                            teamId = this.lastID;
                            afterTeamOp(null);
                        }
                    );
                }
            });
        });
    };

    runTransaction()
        .then(() => res.json({ success: true }))
        .catch(err => res.json({ success: false, error: err.message }));
};

exports.deleteTeam = (req, res) => {
    const { id, raid_id } = req.body;
    db.run("DELETE FROM raid_team_members WHERE team_id = ?", [id], () => {
        db.run("DELETE FROM raid_teams WHERE id = ?", [id], (err) => {
            res.redirect(`/admin/manage/raid?raid_id=${raid_id}`);
        });
    });
};

// --- USER SECTION ---
exports.getUserIndex = (req, res) => {
    const selectedRaidId = req.query.raid_id ? parseInt(req.query.raid_id) : null;

    db.all("SELECT * FROM raid_bosses", [], (err, raids) => {
        if (err) return res.render('error', { message: 'DB Error' });

        raids = raids.map(r => ({
            ...r,
            displayName: r.name || r.image_name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
        }));

        const sortOrder = ['Destroyer Gaze', 'Ox King', 'Iron Devourer'];
        raids.sort((a, b) => {
            let indexA = sortOrder.indexOf(a.displayName);
            let indexB = sortOrder.indexOf(b.displayName);
            if (indexA === -1) indexA = 99;
            if (indexB === -1) indexB = 99;
            return indexA - indexB;
        });

        const heroFiles = getFilesFromDir('images/heroes').sort();
        const heroesMap = {};
        heroFiles.forEach(filename => {
            heroesMap[filename] = {
                id: filename,
                name: filename.replace(/\.[^/.]+$/, ""),
                image_name: filename,
                skill_folder: filename.replace(/\.[^/.]+$/, ""),
                skills: getFilesFromDir(`images/skill/${filename.replace(/\.[^/.]+$/, "")}`)
            };
        });

        if (selectedRaidId) {
            const sql = `
                SELECT t.*, m.hero_id, m.slot_index
                FROM raid_teams t
                LEFT JOIN raid_team_members m ON t.id = m.team_id
                WHERE t.raid_id = ?
                ORDER BY t.id, m.slot_index
            `;
            db.all(sql, [selectedRaidId], (err, rows) => {
                if (err) return res.render('error', { message: 'DB Error' });

                const teamMap = {};
                rows.forEach(r => {
                    if (!teamMap[r.id]) {
                        teamMap[r.id] = {
                            ...r,
                            hero_ids: [],
                            skill_priority: []
                        };
                        try { teamMap[r.id].skill_priority = JSON.parse(r.skill_priority || '[]'); } catch (e) { }
                    }
                    if (r.hero_id) {
                        teamMap[r.id].hero_ids[r.slot_index] = r.hero_id;
                    }
                });

                const teamsParsed = Object.values(teamMap).map(t => {
                    const hIds = [null, null, null, null, null];
                    t.hero_ids.forEach((hid, i) => { if (hid) hIds[i] = hid; });
                    t.hero_ids = hIds;
                    return t;
                });

                res.render('pages/raid', {
                    title: 'Raid Guide',
                    viewState: 'detail',
                    raids,
                    activeRaid: raids.find(r => r.id === selectedRaidId),
                    teams: teamsParsed,
                    heroesMap
                });
            });
        } else {
            res.render('pages/raid', {
                title: 'Raid Guide',
                viewState: 'list',
                raids,
                activeRaid: null,
                teams: [],
                heroesMap
            });
        }
    });
};