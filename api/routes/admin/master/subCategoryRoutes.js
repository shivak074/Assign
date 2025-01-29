const express = require("express")
const router = express.Router()
const subCategoryController = require('../../../controller/admin/master/subCategoryController')

router.post("/add", subCategoryController.createSubCategory)
router.get("/get/:subCategoryId", subCategoryController.getSubCategoryById)
router.get("/getall",subCategoryController.getAllSubCategory)
router.post("/update", subCategoryController.updateSubCategory)
router.delete("/delete/:subCategoryId", subCategoryController.deleteSubCategory)
module.exports = router

