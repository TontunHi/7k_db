require('dotenv').config();

const express = require('express');
const path = require('path');
// [Update] Import compression
const compression = require('compression'); 
const app = express();
const port = 3000;

// Import Routes
const indexRoutes = require('./routes/indexRoutes');
const session = require('express-session');
const adminRoutes = require('./routes/adminRoutes');

// [Update] เปิดใช้งาน Compression (ควรอยู่บนสุด หรือก่อน Routes)
app.use(compression());

// Setup View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup Static Files (CSS, JS, Images)
// [Update] แนะนำให้เพิ่ม maxAge เพื่อทำ Cache ฝั่ง Browser (1 วัน)
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d' 
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Use Routes
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});