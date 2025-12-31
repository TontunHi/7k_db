const db = require('../database/database');

class TierListService {
    // Helper to wrap database calls in Promises
    static query(method, sql, params = []) {
        return new Promise((resolve, reject) => {
            db[method](sql, params, function (err, result) {
                if (err) return reject(err);
                resolve(method === 'run' ? this : result);
            });
        });
    }

    static async getTierData(category) {
        // Fetch all rankings for the category
        const rows = await this.query('all', "SELECT * FROM tier_rankings WHERE category = ?", [category]);

        const assignedMap = {};
        rows.forEach(row => {
            assignedMap[row.char_filename] = row.rank;
        });

        return assignedMap;
    }

    static async saveTierList(category, data) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                const stmt = db.prepare("INSERT OR REPLACE INTO tier_rankings (category, rank, char_filename, char_type) VALUES (?, ?, ?, ?)");

                db.run("DELETE FROM tier_rankings WHERE category = ?", [category], (err) => {
                    if (err) return reject(err);

                    if (data && data.length > 0) {
                        data.forEach(item => {
                            stmt.run(category, item.rank, item.filename, 'HERO');
                        });
                    }
                    stmt.finalize();
                    resolve({ success: true });
                });
            });
        });
    }

    static processTierData(allItems, assignedMap) {
        // Defined Ranks
        const ranks = ['EX', 'S', 'A', 'B', 'C', 'D', 'E'];

        const tierData = {};
        ranks.forEach(r => tierData[r] = []);
        const poolData = [];

        allItems.forEach(item => {
            const rank = assignedMap[item.filename];

            // Check if rank exists in our current system
            if (rank && tierData[rank]) {
                tierData[rank].push(item);
            } else {
                poolData.push(item);
            }
        });

        return { ranks, tierData, poolData };
    }
}

module.exports = TierListService;
