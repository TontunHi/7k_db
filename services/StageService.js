const db = require('../database/database');

class StageService {
    // Helper to wrap database calls in Promises
    static query(method, sql, params = []) {
        return new Promise((resolve, reject) => {
            db[method](sql, params, function (err, result) {
                if (err) return reject(err);
                resolve(method === 'run' ? this : result);
            });
        });
    }

    static async getAllStages() {
        // 1. Fetch Stage Metadata
        const metadataSql = `SELECT * FROM stage_comps ORDER BY 
                             CASE WHEN type = 'Stage' THEN 1 ELSE 2 END, 
                             stage_main ASC, stage_sub ASC`;
        const stages = await this.query('all', metadataSql);

        // 2. Fetch Team Members
        // In a larger app, we might fetch only for specific IDs, but here we load all.
        const membersSql = `SELECT * FROM stage_team_members`;
        const members = await this.query('all', membersSql);

        // 3. Map Members to Stages
        const memberMap = {}; // stage_id -> Array[5]
        members.forEach(m => {
            if (!memberMap[m.stage_id]) memberMap[m.stage_id] = Array(5).fill(null);
            if (m.slot_index >= 0 && m.slot_index < 5) {
                memberMap[m.stage_id][m.slot_index] = m.hero_filename;
            }
        });

        // 4. Group Logic (Preserving existing Frontend structure)
        const groupedStages = {};

        stages.forEach(r => {
            // Attach heroes from relation table
            r.heroes = memberMap[r.id] || Array(5).fill(null);

            // Key for grouping (e.g., Stage_20_30)
            const key = `${r.type}_${r.stage_main}_${r.stage_sub}`;

            if (!groupedStages[key]) {
                groupedStages[key] = {
                    type: r.type,
                    stage_main: r.stage_main,
                    stage_sub: r.stage_sub,
                    teams: []
                };
            }
            groupedStages[key].teams.push(r);
        });

        return Object.values(groupedStages);
    }

    static async saveStage(data) {
        const { id, stage_main, stage_sub, type, formation, heroes, description } = data;
        // Note: We no longer rely on 'heroes' column in stage_comps, 
        // but we keep the column structure purely for legacy safety if needed, or ignore it.
        // Here we just save metadata.

        return new Promise((resolve, reject) => {
            db.serialize(async () => {
                try {
                    let targetId = id;

                    if (id) {
                        // Update Metadata
                        await this.query('run',
                            `UPDATE stage_comps SET stage_main=?, stage_sub=?, type=?, formation=?, description=? WHERE id=?`,
                            [stage_main, stage_sub, type, formation, description, id]
                        );
                    } else {
                        // Insert Metadata
                        const result = await this.query('run',
                            `INSERT INTO stage_comps (stage_main, stage_sub, type, formation, description, heroes) VALUES (?,?,?,?,?,?)`,
                            [stage_main, stage_sub, type, formation, description, '[]'] // Insert empty JSON for legacy column
                        );
                        targetId = result.lastID;
                    }

                    // Manage Members (Delete All -> Re-insert)
                    await this.query('run', "DELETE FROM stage_team_members WHERE stage_id = ?", [targetId]);

                    if (Array.isArray(heroes)) {
                        const stmt = db.prepare("INSERT INTO stage_team_members (stage_id, hero_filename, slot_index) VALUES (?, ?, ?)");
                        heroes.forEach((h, index) => {
                            if (h) stmt.run(targetId, h, index);
                        });
                        stmt.finalize();
                    }

                    resolve({ success: true, id: targetId });
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    static async deleteStage(id) {
        // ON DELETE CASCADE in schema handles the members automatically
        await this.query('run', "DELETE FROM stage_comps WHERE id = ?", [id]);
        return { success: true };
    }
}

module.exports = StageService;
