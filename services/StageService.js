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

        // 4. Group Logic
        const groupedStages = {};

        stages.forEach(r => {
            // Attach heroes from relation table
            r.heroes = memberMap[r.id] || Array(5).fill(null);

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

    // [Update] แก้ไข Bug บันทึกไม่ครบ โดยการรอ stmt.finalize และใช้ Transaction
    static async saveStage(data) {
        const { id, stage_main, stage_sub, type, formation, heroes, description } = data;

        return new Promise((resolve, reject) => {
            db.serialize(async () => {
                try {
                    // 1. Start Transaction
                    await new Promise((res, rej) => db.run("BEGIN TRANSACTION", (err) => err ? rej(err) : res()));

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
                            [stage_main, stage_sub, type, formation, description, '[]']
                        );
                        targetId = result.lastID;
                    }

                    // 2. Clear Old Members
                    await this.query('run', "DELETE FROM stage_team_members WHERE stage_id = ?", [targetId]);

                    // 3. Insert New Members (Wait for completion)
                    if (Array.isArray(heroes)) {
                        await new Promise((res, rej) => {
                            const stmt = db.prepare("INSERT INTO stage_team_members (stage_id, hero_filename, slot_index) VALUES (?, ?, ?)");
                            
                            heroes.forEach((h, index) => {
                                if (h) stmt.run(targetId, h, index);
                            });

                            // [Update] สำคัญ: รอให้ finalize ทำงานเสร็จก่อนค่อย resolve
                            stmt.finalize((err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });
                    }

                    // 4. Commit Transaction
                    await new Promise((res, rej) => db.run("COMMIT", (err) => err ? rej(err) : res()));
                    
                    resolve({ success: true, id: targetId });

                } catch (err) {
                    console.error("Save Stage Error:", err);
                    db.run("ROLLBACK"); // ยกเลิกการเปลี่ยนแปลงหากมี error
                    reject(err);
                }
            });
        });
    }

    static async deleteStage(id) {
        await this.query('run', "DELETE FROM stage_comps WHERE id = ?", [id]);
        return { success: true };
    }
}

module.exports = StageService;