const express = require("express")
const router = express.Router()
const userController = require("../../../controller/user/auth/authController")
const userAuthMiddleware = require('../../../middleware/userAuthMiddleware')

router.post("/signup", userController.SignUp)
router.post("/login", userController.login)
router.post("/update",userAuthMiddleware, userController.updateProfile)

module.exports = router

