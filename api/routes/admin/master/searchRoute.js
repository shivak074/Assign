const express = require("express")
const router = express.Router()
const searchController = require('../../../controller/admin/master/searchController')

router.get("/getlistCategoriesWithSubcategories",  searchController.listCategoriesWithSubcategories);
router.get("/getUsersWithFilters",  searchController.getUsersWithFilters);

module.exports = router