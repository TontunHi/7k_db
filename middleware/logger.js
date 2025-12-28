const db = require('../database/database');

// ฟังก์ชันสำหรับบันทึก Log (เรียกใช้ Manual ใน Controller)
exports.logAction = (req, action, target, details = '') => {
    // ตรวจสอบว่ามี user login ไหม
    const adminUser = req.session && req.session.user ? req.session.user.username : 'Unknown/System';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const stmt = db.prepare(`INSERT INTO admin_logs (admin_username, action, target, details, ip_address) VALUES (?, ?, ?, ?, ?)`);
    
    // แปลง details เป็น string ถ้าเป็น object
    const detailStr = typeof details === 'object' ? JSON.stringify(details) : details;

    stmt.run(adminUser, action, target, detailStr, ip, (err) => {
        if (err) console.error("Logging Error:", err.message);
    });
    stmt.finalize();
};

// Middleware สำหรับดักทุก Request ของ Admin (Optional: ถ้าอยากเก็บทุกการเข้าถึง)
exports.adminActivityLogger = (req, res, next) => {
    if (req.path.startsWith('/admin') && req.method !== 'GET') {
        // Log เฉพาะการแก้ไขข้อมูล (POST, PUT, DELETE etc.)
        exports.logAction(req, req.method, req.path, JSON.stringify(req.body));
    }
    next();
};