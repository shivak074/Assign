const express = require("express")
const router = express.Router()
const countryController = require('../../../controller/admin/master/countryController')

router.post("/add", countryController.createCountry)
router.get("/get/:countryId", countryController.getCountryById)
router.get("/get", countryController.getAllCountry)
router.post("/update/:countryId", countryController.updateCountry)
router.delete("/delete/:countryId", countryController.deleteCountry)
module.exports = router