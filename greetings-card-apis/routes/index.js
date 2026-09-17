// const express = require('express');
// const app = express();
//
// //user routes:
//
// //admin routes:
// const Admin = require('./admin/admin');
// const Category = require('./admin/category');
// const Bank = require('./admin/bank');
//
// app.use('/admin', Admin);
// app.use('/admin/category', Category);
// app.use('/admin', Bank);
//
//
// // card customization routes
// const CardCustomization = require('./admin/cardCustomization');
// app.use('/cards', CardCustomization);
//
// module.exports = app;

const express = require('express');
const app = express();

//user routes:
const UserRoutes = require("./user/user");
const Payment = require("./payment");
const ArExperience = require("./user/ar-experience");
const Transactions = require("./admin/transaction");
const ContactUs = require("./user/contact");
const Profile = require("../routes/admin/profile");
const PublicStatistics = require("./user/statistics");
const Unsubscribe = require("./user/unsubscribe");



app.use('/user', UserRoutes);
app.use('/user/ar-experience', ArExperience);
app.use('/transactions', Transactions);
app.use('/contact-us', ContactUs);
app.use('/profile', Profile);
app.use('/statistics', PublicStatistics);
app.use('/unsubscribe', Unsubscribe);
app.use('/templates', require('../routes/templates'));


//admin routes:
const Admin = require('./admin/admin');
const Category = require('./admin/category');
const Statistics = require('./admin/statistics');
// const PageView = require('./pageView'); // Removed unused pageView routes


app.use('/admin', Admin);
app.use('/admin/category', Category);
app.use('/admin/statistics', Statistics);
// app.use('/pageview', PageView); // Removed unused pageView routes
// app.use('/payment', Payment);




// STRIPE PAYMENT ROUTES (ACTIVE)
app.use('/payment', require('./payment')); // Stripe routes

// PAYPAL ROUTES COMMENTED OUT - SWITCHING TO STRIPE
// app.use('/paypal', require('./user/paypal'));

// card customization routes
const CardCustomization = require('./admin/cardCustomization');
app.use('/cards', CardCustomization);

module.exports = app;