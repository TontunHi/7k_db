const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Import Routes
const indexRoutes = require('./routes/indexRoutes');
const session = require('express-session');
const adminRoutes = require('./routes/adminRoutes');
require('dotenv').config();

// Setup View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Setup Static Files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));
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