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

// Parsing Middleware (Must be before csurf)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use Routes
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: true, // Reverted to true to ensure session is created
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // Added maxAge
}));

// CSRF Protection
const csurf = require('csurf');
const csrfProtection = csurf();
app.use(csrfProtection);

// Global Middleware to share CSRF token with views
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    res.locals.isAuthenticated = req.session.isAdmin || false; // Helpful for navbar
    next();
});

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        // Handle CSRF token errors here
        console.warn('CSRF Token Mismatch:', err.message);
        if (req.originalUrl.startsWith('/admin')) {
            // If it's an API call, return JSON
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(403).json({ success: false, error: 'Session expired or invalid CSRF token. Please refresh the page.' });
            }
            // Otherwise redirect to login
            return res.redirect('/admin/login?error=Session expired. Please login again.');
        }
    }
    next(err);
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});