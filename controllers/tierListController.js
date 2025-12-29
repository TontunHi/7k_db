const db = require('../database/database');
const fileHelper = require('../utils/fileHelper');
const RANKS = ['EX', 'S', 'A', 'B', 'C', 'D', 'E'];

exports.getTierListPage = (req, res) => {
    // Default เป็น PVP ถ้าไม่ระบุ
    const category = req.params.category ? req.params.category.toUpperCase() : 'PVP';
    
    // Validation
    if (!['PVP', 'PVE', 'PET'].includes(category)) {
        return res.redirect('/tierlist/pvp');
    }

    const isPet = category === 'PET';
    const folder = isPet ? 'pets' : 'heroes';

    // ดึงข้อมูล Ranking จาก Database
    db.all("SELECT * FROM tier_rankings WHERE category = ?", [category], (err, rows) => {
        if (err) {
            console.error(err);
            return res.render('pages/error', { title: 'Error', message: 'Database Error' });
        }

        // เตรียม Object เก็บข้อมูลแยกตาม Rank
        const tierData = {};
        RANKS.forEach(r => tierData[r] = []);

        // Mapping ข้อมูล
        rows.forEach(row => {
            // ใช้ fileHelper แยกชื่อกับเกรดเพื่อความสวยงาม
            const info = fileHelper.getGradeAndName(row.char_filename);
            
            // ใส่ข้อมูลลงใน Rank นั้นๆ
            if (tierData[row.rank]) {
                tierData[row.rank].push(info);
            }
        });
        
        // (Optional) ในขั้นตอนนี้สามารถ Sort ภายใน Rank ได้อีกทีถ้าต้องการ

        res.render('pages/tierlist', {
            title: `Tier List ${category} - Seven Knight Rebirth`,
            page: 'tierlist',     // เพื่อให้ Navbar รู้ว่าอยู่หน้านี้
            subPage: category,    // เพื่อให้ Dropdown รู้ว่าเลือกหมวดไหน
            category: category,
            ranks: RANKS,
            tierData: tierData,
            folder: folder
        });
    });
};