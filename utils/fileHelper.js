const fs = require('fs');
const path = require('path');

// 1. กำหนดน้ำหนักของ Grade แต่ละประเภท
const heroGradeWeight = { 'l++': 6, 'l+': 5, 'l': 4, 'r': 3, 'uc': 2, 'c': 1 };
const petGradeWeight = { 'l': 2, 'r': 1 };
// เพิ่มน้ำหนักสำหรับ Items (Accessory/Weapon/Armor)
const itemGradeWeight = { 'l': 4, 'r': 3, 'un': 2, 'c': 1 };

// Helper: แยก Grade และ Name (สำหรับ Hero/Pet)
const getGradeAndName = (filename) => {
    // แยกด้วย _ แต่ต้องระวังกรณีชื่อไฟล์มี _ หลายตัว หรือ Grade มี +
    const lowerName = filename.toLowerCase();
    let grade = 'c'; // Default
    let name = filename;

    // ตรวจสอบ Grade จาก Prefix โดยเรียงจากยาวไปสั้นเพื่อป้องกันการทับซ้อน (L++ ก่อน L)
    const grades = Object.keys(heroGradeWeight).sort((a, b) => b.length - a.length);

    for (const g of grades) {
        if (lowerName.startsWith(g + '_')) {
            grade = g;
            // ตัด Prefix ออกเพื่อได้ชื่อ
            // เช่น l++_rudy.png -> rudy
            name = filename.substring(g.length + 1).replace(/\.[^/.]+$/, "");
            break;
        }
    }

    // Fallback กรณีหา Grade ไม่เจอจากชื่อไฟล์ (หรืออาจจะเป็นไฟล์แบบเก่า)
    // ถ้าไม่เจอ prefix ให้ถือว่าเป็น C หรือตาม logic เดิม
    if (name === filename) {
        name = filename.replace(/\.[^/.]+$/, "");
    }

    return { grade, name, filename, originalName: filename }; // เพิ่ม originalName เพื่อ return เป็น string ตอน map กลับถ้าจำเป็น แต่ใน function นี้ return object
};

// Function 1: ดึงรูปภาพ Hero/Pet (มี Logic เฉพาะ)
const getSortedImages = (folderName) => {
    const dirPath = path.join(__dirname, '../public/images', folderName);

    if (!fs.existsSync(dirPath)) return [];

    const files = fs.readdirSync(dirPath);
    const isHero = folderName === 'heroes';

    const items = files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file)).map(file => {
        return getGradeAndName(file);
    });

    // Sort Logic
    items.sort((a, b) => {
        const weightA = isHero ? (heroGradeWeight[a.grade] || 0) : (petGradeWeight[a.grade] || 0);
        const weightB = isHero ? (heroGradeWeight[b.grade] || 0) : (petGradeWeight[b.grade] || 0);

        if (weightB !== weightA) return weightB - weightA;
        return a.name.localeCompare(b.name);
    });

    // Return กลับเป็น filename array เหมือนเดิม เพื่อไม่ให้กระทบ Controller ส่วนอื่น
    return items.map(item => item.filename);
};

// Function 2: ดึงรูปภาพ Items (Weapon/Armor/Accessory) และเรียงตาม Grade
const getImageFiles = (folderPath) => {
    const dirPath = path.join(__dirname, '../public/images', folderPath);

    if (!fs.existsSync(dirPath)) {
        console.warn(`Directory not found: ${dirPath}`);
        return [];
    }

    const files = fs.readdirSync(dirPath);
    const images = files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));

    // Sort Logic (L > R > UN > C > Others)
    images.sort((a, b) => {
        const getInfo = (filename) => {
            const parts = filename.split('_');
            const grade = parts[0].toLowerCase();
            const weight = itemGradeWeight[grade] !== undefined ? itemGradeWeight[grade] : -1;
            let name = parts.slice(1).join('_').replace(/\.[^/.]+$/, "").toLowerCase();
            if (!name) name = filename.replace(/\.[^/.]+$/, "").toLowerCase();
            return { weight, name };
        };

        const infoA = getInfo(a);
        const infoB = getInfo(b);

        if (infoA.weight !== infoB.weight) {
            return infoB.weight - infoA.weight;
        }
        return infoA.name.localeCompare(infoB.name);
    });

    return images;
};

// Helper: จัดรูปแบบชื่อ Hero (ตัด l++_ ออกและทำตัวพิมพ์ใหญ่)
const formatHeroName = (filename) => {
    if (!filename) return '';
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExt.split('_');
    const cleanName = parts.length > 1 ? parts[parts.length - 1] : nameWithoutExt;
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
};

// Function 3: อ่านไฟล์ทั้งหมดในโฟลเดอร์ (ใช้สำหรับ Dropdown เลือกรูปใน Admin)
const getFilesFromDir = (dirPath) => {
    const fullPath = path.join(__dirname, '../public', dirPath);
    if (!fs.existsSync(fullPath)) return [];

    return fs.readdirSync(fullPath).filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file));
};

// [NEW] Function 4: อ่านรูป Skill จากโฟลเดอร์ย่อย (สำหรับ Codex)
const getSkillImages = (heroSkillFolder) => {
    if (!heroSkillFolder) return [];

    // Path: public/images/skill/{ชื่อโฟลเดอร์}
    const skillPath = path.join(__dirname, '../public/images/skill', heroSkillFolder);

    if (fs.existsSync(skillPath)) {
        // อ่านไฟล์รูปทั้งหมดในโฟลเดอร์ skill นั้น
        return fs.readdirSync(skillPath)
            .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
            .sort(); // เรียงชื่อไฟล์ (1.png, 2.png, ...)
    }
    return [];
};

module.exports = {
    getGradeAndName,
    getSortedImages,
    getImageFiles,
    formatHeroName,
    getFilesFromDir,
    getSkillImages
};