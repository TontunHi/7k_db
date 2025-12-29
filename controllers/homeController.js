exports.getHomePage = (req, res) => {
    // Render ไปที่ไฟล์ index.ejs
    // ส่ง title ไปแสดงผล
    res.render('pages/index', { 
        title: 'Seven Knight Rebirth - Database',
        page: 'home' // ใช้สำหรับระบุหน้าเพื่อ Active เมนู
    });
};