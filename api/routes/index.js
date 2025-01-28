const express = require('express');
const adminAuthRoutes = require('./admin/auth/authRoutes');
const userAuthRoutes = require('./user/auth/authRoutes');
const countryRoutes = require('./admin/master/countryRoutes');
const categoryRoutes = require('./admin/master/categoryRoutes');
const subCategoryRoutes = require('./admin/master/subCategoryRoutes');
const cityRoutes = require('./admin/master/cityRoutes');
const searchRoute = require('./admin/master/searchRoute')
const accountRoutes = require('./user/master/accountRoutes')

const router = express.Router();


router.use('/admin', adminAuthRoutes);
router.use('/user', userAuthRoutes);
router.use('/country', countryRoutes);
router.use('/category', categoryRoutes);
router.use('/subcategory',subCategoryRoutes );
router.use('/city', cityRoutes);
router.use('/search',searchRoute);
router.use('/account',accountRoutes);


module.exports = router;