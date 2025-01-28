const express = require("express")
const router = express.Router()
const accountController = require('../../../controller/user/master/accountController')

router.post("/add", accountController.createAccount)
router.get("/get/:accountId", accountController. getAccountById)
router.get("/get", accountController.getAllAccounts)
router.post("/update/:accountId", accountController. updateAccount)
router.delete("/delete/:accountId", accountController.deleteAccount)
module.exports = router