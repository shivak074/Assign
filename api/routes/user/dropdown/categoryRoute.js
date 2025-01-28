const express = require("express")
const router = express.Router()
const categoryController = require('../../../controller/user/DropDown/CategoryController');
const userAuthMiddleware = require('../../../middleware/userAuthMiddleware')



router.get("/get",userAuthMiddleware, categoryController.getAllCategories)