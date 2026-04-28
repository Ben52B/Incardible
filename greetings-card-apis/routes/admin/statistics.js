const express = require('express');
const router = express.Router();
const middleWare = require('../../middleware/auth');
const {
    getMostPopularCards,
    getMostPopularARExperiences,
    getWebsiteTrafficStats,
    getOrderStats,
    getDashboardStats,
    getRevenueAnalytics,
    getPopularCards,
    getPopularARExperienceCards,
    incrementVisitorCount,
    getTopBuyingUsers
} = require('../../controllers/admin/statistics');

// Statistics routes
router.get('/popular-cards', middleWare, getMostPopularCards);
router.get('/popular-ar-experiences', middleWare, getMostPopularARExperiences);
router.get('/website-traffic', middleWare, getWebsiteTrafficStats);
router.get('/orders', middleWare, getOrderStats);
router.get('/dashboard', middleWare, getDashboardStats);
router.get('/revenue-analytics', middleWare, getRevenueAnalytics);

// Visitor counter route (no auth required for public access)
router.post('/increment-visitor-count', incrementVisitorCount);

// Filter routes for cards page
router.get('/filter/popular-cards', middleWare, getPopularCards);
router.get('/filter/popular-ar-experience-cards', middleWare, getPopularARExperienceCards);

// Top buying users route
router.get('/top-buying-users', middleWare, getTopBuyingUsers);

module.exports = router;
