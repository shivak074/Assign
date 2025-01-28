const { MstCountry, MstCountryTrans } = require("../../../models/index");
const { HTTP_STATUS_CODE,VALIDATOR } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { uuidv4 } = require("../../../../config/constants");
const { validationRules } = require("../../../../config/validationRules");


const createCountry = async (req, res) => {
  try {
    const { translations } = req.body;
    
    const validation = new VALIDATOR(req.body, validationRules.TransController);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }
    
    // Check for existing translations before continuing
    for (let translation of translations) {
      const existingTranslation = await MstCountryTrans.findOne({
        where: {
          lang: translation.lang,
          name: translation.name
        }
      });

      if (existingTranslation) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("Country.COUNTRY_TRANSLATIONS_EXISTS"),
          data: "",
          err: null
        });
      }
    }

    // Create the country after validating translations
    const newCountry = await MstCountry.create({
      id: uuidv4(),
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000)
    });

    const translationPromises = translations.map(async (translation) => {
      return await MstCountryTrans.create({
        id: uuidv4(),
        name: translation.name,
        lang: translation.lang,
        countryId: newCountry.id
      });
    });

    await Promise.all(translationPromises);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("Country.COUNTRY_CREATED"),
      data: { country: newCountry, translations },
      err: null
    });
  } catch (error) {
    console.error("Error in creating country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const getCountryById = async (req, res) => {
  try {
    const { countryId } = req.params;
    const country = await MstCountry.findByPk(countryId,{
      include: [
        {
          model: MstCountryTrans,
          as: "translations"
        }
      ]
    });

    if (!country) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_FETCHED"),
      data: country,
      err: null
    });
  } catch (error) {
    console.error("Error in getting country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const getAllCountry = async (req, res) => {
  try {
    const country = await MstCountry.findAll();

    if (!country) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_FETCHED"),
      data: country,
      err: null
    });
  } catch (error) {
    console.error("Error in getting country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const updateCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const { translations } = req.body;

    const Validation = new VALIDATOR(req.body, validationRules.TransController);
    if (Validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: {  
          Errors:Validation.errors.all(),
        },
        err: null,
      });
    }

    const country = await MstCountry.findByPk(countryId);

    if (!country) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    country.updatedAt =  Math.floor(Date.now() / 1000);
    await country.save();

    if (translations && translations.length > 0) {
      const translationPromises = translations.map(async (translation) => {
        const existingTranslation = await MstCountryTrans.findOne({
          where: { countryId: countryId, lang: translation.lang }
        });

        if (existingTranslation) {
          existingTranslation.name = translation.name;
          await existingTranslation.save();
        } else {
          return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
            msg: i18n.__("Country.COUNTRY_TRANSLATIONS_NOT_FOUND"),
            data: "",
            err: null
          });
        }
      });

      await Promise.all(translationPromises);
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_UPDATED"),
      data: { country, translations },
      err: null
    });
  } catch (error) {
    console.error("Error in updating country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const deleteCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    const country = await MstCountry.findByPk(countryId);

    if (!country) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null
      });
    }
    await MstCountryTrans.destroy({
      where: {
        countryId: countryId
      }
    });
    
    await MstCountry.destroy({
      where: {
        id: countryId  
      }
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_DELETED"),
      data: "",
      err: null
    });
  } catch (error) {
    console.error("Error in deleting country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};


module.exports = {
  createCountry,
  getCountryById,
  getAllCountry,
  updateCountry,
  deleteCountry
};