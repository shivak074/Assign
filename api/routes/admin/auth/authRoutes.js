const express = require("express")
const router = express.Router()
const adminController = require('../../../controller/admin/auth/authController')

router.post("/login", adminController.login)

module.exports = router
