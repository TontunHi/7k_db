const db = require('../database/database');

class BuildService {
    // Helper to wrap database calls in Promises for cleaner async/await usage
    static query(method, sql, params = []) {
        return new Promise((resolve, reject) => {
            db[method](sql, params, function (err, result) {
                if (err) return reject(err);
                // For 'run', 'this' context contains changes, lastID, etc.
                // For 'all'/'get', result contains the rows.
                resolve(method === 'run' ? this : result);
            });
        });
    }

    static async getAllBuilds() {
        return await this.query('all', "SELECT * FROM builds");
    }

    static async getBuildsByHero(heroFilename) {
        return await this.query('all', "SELECT * FROM builds WHERE hero_filename = ?", [heroFilename]);
    }

    static async getBuildById(id) {
        return await this.query('get', "SELECT * FROM builds WHERE id = ?", [id]);
    }

    static async saveBuild(data) {
        const {
            id, hero_filename, build_name, c_level, mode,
            weapon1_img, weapon1_stat, armor1_img, armor1_stat,
            weapon2_img, weapon2_stat, armor2_img, armor2_stat,
            accessories, substats, description
        } = data;

        const accJson = JSON.stringify(accessories || []);
        const subJson = JSON.stringify(substats || []);

        if (id) {
            // Update
            const sql = `UPDATE builds SET 
                hero_filename=?, build_name=?, c_level=?, mode=?,
                weapon1_img=?, weapon1_stat=?, armor1_img=?, armor1_stat=?,
                weapon2_img=?, weapon2_stat=?, armor2_img=?, armor2_stat=?,
                accessories=?, substats=?, description=?
                WHERE id=?`;

            const params = [
                hero_filename, build_name, c_level, mode,
                weapon1_img, weapon1_stat, armor1_img, armor1_stat,
                weapon2_img, weapon2_stat, armor2_img, armor2_stat,
                accJson, subJson, description, id
            ];

            await this.query('run', sql, params);
            return { success: true, id };
        } else {
            // Insert
            const sql = `INSERT INTO builds (
                hero_filename, build_name, c_level, mode,
                weapon1_img, weapon1_stat, armor1_img, armor1_stat,
                weapon2_img, weapon2_stat, armor2_img, armor2_stat,
                accessories, substats, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                hero_filename, build_name, c_level, mode,
                weapon1_img, weapon1_stat, armor1_img, armor1_stat,
                weapon2_img, weapon2_stat, armor2_img, armor2_stat,
                accJson, subJson, description
            ];

            const result = await this.query('run', sql, params);
            return { success: true, id: result.lastID };
        }
    }

    static async deleteBuild(id) {
        await this.query('run', "DELETE FROM builds WHERE id = ?", [id]);
        return { success: true };
    }

    // Process builds for frontend (parsing JSON strings)
    static processBuildsForDisplay(builds) {
        const buildsMap = {};
        builds.forEach(b => {
            if (!buildsMap[b.hero_filename]) buildsMap[b.hero_filename] = [];
            try {
                b.accessories = JSON.parse(b.accessories || '[]');
                b.substats = JSON.parse(b.substats || '[]');
            } catch (e) {
                b.accessories = [];
                b.substats = [];
            }
            buildsMap[b.hero_filename].push(b);
        });
        return buildsMap;
    }
}

module.exports = BuildService;
