const fs = require('fs').promises;
const path = require('path');

/**
 * Service to handle hero skill logic including folder resolution,
 * file reading, and priority ordering.
 */
class SkillService {
    constructor() {
        this.cache = new Map();
        this.CACHE_TTL = 10 * 60 * 1000; // 10 Minutes
    }

    /**
     * Get processed skill data for a hero
     * @param {string} imageName - Hero's main image filename (e.g. 'evan.png')
     * @param {string|null} dbSkillFolder - Overridden folder name from DB (optional)
     * @param {string|Array} dbSkillOrder - JSON string or Array of priority (optional)
     * @returns {Promise<Object>} { skillFolder, skillOrder, allSkills }
     */
    async getHeroSkills(imageName, dbSkillFolder, dbSkillOrder) {
        // 1. Determine Folder
        // Priority: DB Folder -> Image Name (stripped extension)
        const folder = dbSkillFolder || (imageName ? imageName.replace(/\.[^/.]+$/, "") : null);

        if (!folder) {
            return { skillFolder: '', skillOrder: [], allSkills: [] };
        }

        // 2. Parse Order
        let skillOrder = [];
        if (Array.isArray(dbSkillOrder)) {
            skillOrder = dbSkillOrder;
        } else if (typeof dbSkillOrder === 'string') {
            try {
                skillOrder = JSON.parse(dbSkillOrder || "[]");
            } catch (e) {
                skillOrder = [];
            }
        }

        // 3. Get Files (with Cache)
        const allSkills = await this._getFilesInFolder(folder);

        return {
            skillFolder: folder,
            skillOrder: skillOrder,
            allSkills: allSkills
        };
    }

    /**
     * Internal: Read files from public/images/skill with Caching
     */
    async _getFilesInFolder(folderName) {
        const cacheKey = `skills:${folderName}`;
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            return cached.data;
        }

        const skillPath = path.join(__dirname, '../public/images/skill', folderName);
        let files = [];

        try {
            await fs.stat(skillPath);
            const dirFiles = await fs.readdir(skillPath);
            files = dirFiles.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
        } catch (error) {
            // Folder not found or empty - return empty array
        }

        // Save to Cache
        this.cache.set(cacheKey, {
            timestamp: Date.now(),
            data: files
        });

        return files;
    }
}

module.exports = new SkillService();
