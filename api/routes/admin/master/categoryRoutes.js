const express = require("express")
const router = express.Router()
const categoryController = require('../../../controller/admin/master/categoryController');
const adminAuthMiddleware = require('../../../middleware/adminAuthMiddleware')

router.post("/add",adminAuthMiddleware, categoryController.createCategory)
router.get("/get/:categoryId",adminAuthMiddleware, categoryController.getCategoryById)
router.post("/update",adminAuthMiddleware, categoryController.updateCategory)
router.delete("/delete/:categoryId",adminAuthMiddleware, categoryController.deleteCategory)
module.exports = router