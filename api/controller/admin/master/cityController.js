const { MstCity, MstCityTrans } = require("../../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, uuidv4 } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { validationRules } = require("../../../../config/validationRules");
const sequelize = require("../../../../config/sequelize");

const createCity = async (req, res) => {
  try {
    const { countryId, translations } = req.body;
    const adminId = req.admin.id;

    const validation = new VALIDATOR(req.body, 
      { 
        countryId: validationRules.City.countryId, 
        translations: validationRules.City.translations
     });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }

    for (let i = 0; i < translations.length; i++) {
      const query = `
        SELECT id 
        FROM mst_city_trans
        WHERE is_deleted = false
        AND LOWER(lang) = LOWER(:lang)
        AND LOWER(name) = LOWER(:name)
      `;
      const existingTranslation = await sequelize.query(query, {
        replacements: { lang: translations[i].lang, name: translations[i].name },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      if (existingTranslation.length > 0) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("City.CITY_TRANSLATIONS_EXISTS"),
          data: "",
          err: null,
        });
      }
    }

    const newCity = await MstCity.create({
      id: uuidv4(),
      countryId,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      createdBy: adminId,
    });

    const translationsData = [];
    for (let i = 0; i < translations.length; i++) {
      translationsData.push({
        id: uuidv4(),
        name: translations[i].name,
        lang: translations[i].lang,
        cityId: newCity.id,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });
    }

    await MstCityTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("City.CITY_CREATED"),
      data: { cityId: newCity.id },
      err: null,
    });
  } catch (error) {
    console.error("Error in creating city:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const getCityById = async (req, res) => {
  try {
    const { cityId } = req.params;

    const validation = new VALIDATOR(req.params, { cityId: validationRules.City.cityId, });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const query = `
      SELECT c.id, ct.id,ct.name,ct.lang
      FROM mst_city c
      LEFT JOIN mst_city_trans ct ON ct.city_id = c.id
      WHERE c.id = :cityId
    `;

    const city = await sequelize.query(query, {
      replacements: { cityId },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!city || city.length === 0) {
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
    console.error("Error in getting city:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const updateCity = async (req, res) => {
  try {
    const { cityId, translations } = req.body;
    const adminId = req.admin.id;

    const validation = new VALIDATOR(req.body, validationRules.City);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const city = await MstCity.findOne({
      where: { id: cityId, isDeleted: false },
      attributes: ['id'],
    });

    if (!city) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("City.CITY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    for (let i = 0; i < translations.length; i++) {
      const query = `
        SELECT id 
        FROM mst_city_trans
        WHERE is_deleted = false
        AND city_id != :cityId
        AND LOWER(lang) = LOWER(:lang) 
        AND LOWER(name) = LOWER(:name)
      `;
      const existingTranslation = await sequelize.query(query, {
        replacements: { lang: translations[i].lang, name: translations[i].name, cityId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      if (existingTranslation.length > 0) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("City.CITY_TRANSLATIONS_EXISTS_ASSOCIATED_TO_ANOTHER_CITY"),
          data: "",
          err: null,
        });
      }
    }

    const translationsData = [];
    for (let i = 0; i < translations.length; i++) {
      translationsData.push({
        id: uuidv4(),
        name: translations[i].name,
        lang: translations[i].lang,
        cityId: cityId,
        createdBy: adminId,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    city.updatedAt = Math.floor(Date.now() / 1000);
    city.updatedBy = adminId;
    await city.save();

    await MstCityTrans.update(
      { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: adminId },
      { where: { cityId: cityId, isDeleted: false } }
    );

    await MstCityTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("City.CITY_UPDATED"),
      data: city,
      err: null,
    });
  } catch (error) {
    console.error("Error in updating city:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const deleteCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const adminId = req.admin.id;

    const validation = new VALIDATOR(req.params, { cityId: validationRules.City.cityId });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const city = await MstCity.findOne({
      where: { id: cityId, isDeleted: false },
      attributes: ['id'],
    });

    if (!city) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("City.CITY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    await MstCityTrans.update(
      { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: adminId },
      { where: { cityId: cityId, isDeleted: false } }
    );

    await MstCity.update(
      { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: adminId },
      { where: { id: cityId, isDeleted: false } }
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("City.CITY_DELETED"),
      data: city,
      err: null,
    });
  } catch (error) {
    console.error("Error in deleting city:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const getAllCity = async (req, res) => {
  try {
    const lang = i18n.getLocale() || 'en';
    const page = 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const query = `
      SELECT 
        c.id AS cityId,
        ct.id AS cityTransId,
        ct.name AS cityName, 
        ct.lang AS translationLang
      FROM mst_city c
      LEFT JOIN mst_city_trans ct ON ct.city_id = c.id AND ct.lang = :lang
      WHERE c.is_deleted = false
      ORDER BY c.createdAt asc
      LIMIT :limit OFFSET :offset
    `;

    const cities = await sequelize.query(query, {
      replacements: { lang, limit: pageSize, offset },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    if (!cities || cities.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("City.CITY_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    const countQuery = `
      SELECT COUNT(*) as totalCities
      FROM mst_city c
      WHERE c.is_deleted = false
    `;
    const countResult = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    const totalCities = countResult[0]?.totalCities || 0;

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("City.CITY_FETCHED"),
      data: cities,
      totalCities,
      err: null
    });
  } catch (error) {
    console.error("Error in getting cities:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null
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
