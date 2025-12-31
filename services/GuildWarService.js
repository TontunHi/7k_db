const db = require('../database/database');

class GuildWarService {
    static query(method, sql, params = []) {
        return new Promise((resolve, reject) => {
            db[method](sql, params, function (err, result) {
                if (err) return reject(err);
                resolve(method === 'run' ? this : result);
            });
        });
    }

    static async getAllComps() {
        // Fetch comps + members
        const sql = `
            SELECT g.*, m.hero_filename, m.slot_index
            FROM guildwar_comps g
            LEFT JOIN guildwar_team_members m ON g.id = m.guildwar_id
            ORDER BY g.id, m.slot_index
        `;
        const rows = await this.query('all', sql);

        const map = {};
        rows.forEach(r => {
            if (!map[r.id]) {
                map[r.id] = {
                    id: r.id,
                    team_name: r.team_name,
                    formation: r.formation,
                    pet: r.pet,
                    description: r.description,
                    skill_order: [],
                    heroes: []
                };
                try { map[r.id].skill_order = JSON.parse(r.skill_order || '[]'); } catch (e) { }
            }
            if (r.hero_filename) {
                map[r.id].heroes[r.slot_index] = r.hero_filename;
            }
        });

        // Fill sparse
        return Object.values(map).map(t => {
            // max 3 heroes
            for (let i = 0; i < 3; i++) {
                if (!t.heroes[i]) t.heroes[i] = null;
            }
            return t;
        });
    }

    static async saveComp(data) {
        const { id, team_name, formation, description, pet, skill_order_json } = data;
        // heroes comes as array of filenames (possibly sparse or undefined)
        let heroes = data['heroes[]'] || data.heroes || [];
        if (!Array.isArray(heroes)) heroes = [heroes];
        heroes = heroes.slice(0, 3); // Max 3

        let compId = id;

        // Transaction manually
        if (compId) {
            await this.query('run',
                `UPDATE guildwar_comps SET team_name=?, formation=?, pet=?, skill_order=?, description=? WHERE id=?`,
                [team_name, formation, pet, skill_order_json, description, compId]
            );
            // Clear members
            await this.query('run', "DELETE FROM guildwar_team_members WHERE guildwar_id=?", [compId]);
        } else {
            const result = await this.query('run',
                `INSERT INTO guildwar_comps (team_name, formation, pet, skill_order, description) VALUES (?,?,?,?,?)`,
                [team_name, formation, pet, skill_order_json, description]
            );
            compId = result.lastID;
        }

        // Insert Members
        for (let i = 0; i < heroes.length; i++) {
            if (heroes[i]) {
                await this.query('run',
                    "INSERT INTO guildwar_team_members (guildwar_id, hero_filename, slot_index) VALUES (?,?,?)",
                    [compId, heroes[i], i]
                );
            }
        }

        return { success: true };
    }

    static async deleteComp(id) {
        await this.query('run', "DELETE FROM guildwar_team_members WHERE guildwar_id=?", [id]);
        await this.query('run', "DELETE FROM guildwar_comps WHERE id=?", [id]);
        return { success: true };
    }
}

module.exports = GuildWarService;
