const { MstCity, MstCityTrans } = require("../../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, uuidv4 } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { validationRules } = require("../../../../config/validationRules");

const createCity = async (req, res) => {
  try {
    const { countryId, translations } = req.body;

    const validation = new VALIDATOR(req.body, validationRules.TransController);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }
    
    for (let translation of translations) {
      const existingTranslation = await MstCityTrans.findOne({
        where: {
          lang: translation.lang,
          name: translation.name
        }
      });

      if (existingTranslation) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("CITY.CITY_TRANSLATIONS_EXISTS"),
          data: "",
          err: null
        });
      }
    }

    const newCity = await MstCity.create({
      id: uuidv4(),
      countryId,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
    });

    const translationPromises = translations.map((translation) => {
      return MstCityTrans.create({
        id: uuidv4(),
        cityId: newCity.id,
        name: translation.name,
        lang: translation.lang,
      });
    });

    await Promise.all(translationPromises);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("City.CITY_CREATED"),
      data: { city: newCity, translations },
      err: null,
    });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const getCityById = async (req, res) => {
  try {
    const { cityId } = req.params;


    const city = await MstCity.findByPk(cityId, {
      include: [
        {
          model: MstCityTrans,
          as: "translations",
        },
      ],
    });

    if (!city) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("City.CITY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("City.CITY_FETCHED"),
      data: city,
      err: null,
    });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const getAllCity = async (req, res) => {
  try {
    const city = await MstCity.findAll();
    if (!city) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("City.CITY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("City.CITY_FETCHED"),
      data: city,
      err: null,
    });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const updateCity = async (req, res) => {
  try {
    const { cityId } = req.params;
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

    const city = await MstCity.findByPk(cityId);
    if (!city) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("City.CITY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    city.updatedAt = Math.floor(Date.now() / 1000);
    await city.save();

    if (translations && translations.length > 0) {
      const translationPromises = translations.map(async (translation) => {
        const existingTranslation = await MstCityTrans.findOne({
          where: { cityId: city.id, lang: translation.lang },
        });

        if (existingTranslation) {
          existingTranslation.name = translation.name;
          await existingTranslation.save();
        } else {
          return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                      msg: i18n.__("City.CITY_TRANSLATIONS_EXISTS"),
                      data: "",
                      err: null
                    });
        }
      });

      await Promise.all(translationPromises);
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("City.CITY_UPDATED"),
      data: { city, translations },
      err: null,
    });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const deleteCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    const city = await MstCity.findByPk(cityId);
    if (!city) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("City.CITY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    city.isDeleted = true;
    await city.save();

    await MstCityTrans.update({ isDeleted: true }, { where: { cityId: city.id } });

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("City.CITY_DELETED"),
      data: "",
      err: null,
    });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

module.exports = {
  createCity,
  getCityById,
  getAllCity,
  updateCity,
  deleteCity,
};
