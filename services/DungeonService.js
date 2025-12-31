const db = require('../database/database');
const fs = require('fs');
const path = require('path');

class DungeonService {
    // Helper to wrap database calls in Promises
    static query(method, sql, params = []) {
        return new Promise((resolve, reject) => {
            db[method](sql, params, function (err, result) {
                if (err) return reject(err);
                resolve(method === 'run' ? this : result);
            });
        });
    }

    static async getDungeonData() {
        // 1. Read Banner Images
        const dungeonDir = path.join(__dirname, '../public/images/dungeon');
        let dungeonBanners = [];

        try {
            if (fs.existsSync(dungeonDir)) {
                dungeonBanners = fs.readdirSync(dungeonDir).filter(file => {
                    return ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase());
                });
            }
        } catch (err) {
            console.error("Error reading dungeon directory:", err);
        }

        // 2. Fetch all teams + Joined Members
        const sql = `
            SELECT d.*, m.hero_filename, m.slot_index
            FROM dungeon_comps d
            LEFT JOIN dungeon_team_members m ON d.id = m.dungeon_id
            ORDER BY d.id, m.slot_index
        `;
        const rows = await this.query('all', sql);

        // 3. Group by ID first (Relational to Object)
        const teamMap = {};
        rows.forEach(r => {
            if (!teamMap[r.id]) {
                teamMap[r.id] = {
                    id: r.id,
                    dungeon_name: r.dungeon_name,
                    formation: r.formation,
                    description: r.description,
                    heroes: []
                };
            }
            if (r.hero_filename) {
                teamMap[r.id].heroes[r.slot_index] = r.hero_filename;
            }
        });

        // Fill sparse arrays if any (though usually sorted by slot_index)
        Object.values(teamMap).forEach(t => {
            for (let i = 0; i < 5; i++) {
                if (!t.heroes[i]) t.heroes[i] = null; // Ensure nulls for empty slots if needed
            }
        });

        // 4. Group by Banner
        const groupedDungeons = dungeonBanners.map(banner => {
            return {
                banner: banner,
                teams: Object.values(teamMap).filter(t => t.dungeon_name === banner)
            };
        });

        return groupedDungeons;
    }

    static async saveDungeon(data) {
        const { id, dungeon_name, formation, heroes, description } = data; // heroes is array
        // heroes array from frontend might be sparse or contain nulls? 
        // usually admin form sends array of strings (files)

        let teamId = id;

        // Transaction wrapper (manual in sqlite without helper, but sequential calls work)

        if (teamId) {
            // Update
            const sql = `UPDATE dungeon_comps SET dungeon_name=?, formation=?, description=? WHERE id=?`;
            await this.query('run', sql, [dungeon_name, formation, description, teamId]);
            // Clear members
            await this.query('run', "DELETE FROM dungeon_team_members WHERE dungeon_id=?", [teamId]);
        } else {
            // Insert
            const sql = `INSERT INTO dungeon_comps (dungeon_name, formation, description) VALUES (?,?,?)`;
            const result = await this.query('run', sql, [dungeon_name, formation, description]);
            teamId = result.lastID;
        }

        // Insert Members
        if (Array.isArray(heroes)) {
            for (let i = 0; i < heroes.length; i++) {
                if (heroes[i]) {
                    await this.query('run',
                        "INSERT INTO dungeon_team_members (dungeon_id, hero_filename, slot_index) VALUES (?,?,?)",
                        [teamId, heroes[i], i]
                    );
                }
            }
        }

        return { success: true, id: teamId };
    }

    static async deleteDungeon(id) {
        // Cascade delete ensures members are deleted, but sqlite foreign keys must be enabled.
        // Or manual delete.
        await this.query('run', "DELETE FROM dungeon_team_members WHERE dungeon_id = ?", [id]);
        await this.query('run', "DELETE FROM dungeon_comps WHERE id = ?", [id]);
        return { success: true };
    }
}

module.exports = DungeonService;
