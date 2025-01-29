const { MstCountry, MstCountryTrans } = require("../../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR,uuidv4 } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { validationRules } = require("../../../../config/validationRules");
const sequelize = require('../../../../config/sequelize');

const createCountry = async (req, res) => {
  try {
    const { translations } = req.body;
    const adminId = req.admin.id;
    const validation = new VALIDATOR(req.body, {translations : validationRules.Country.translations});
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
        FROM mst_country_trans 
        WHERE is_deleted = false
        AND LOWER(lang) = LOWER(:lang) 
        AND LOWER(name) = LOWER(:name)
      `;
    
      const existingTranslation = await sequelize.query(query, {
        replacements: { 
          lang: translations[i].lang, 
          name: translations[i].name 
        },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
    
      if (existingTranslation.length > 0) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("Country.COUNTRY_TRANSLATIONS_EXISTS"),
          data: "",
          err: null,
        });
      }
    }    

    const newCountry = await MstCountry.create({
      id: uuidv4(),
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      createdBy : adminId
    });

    const translationsData = [];
    for (let i = 0; i < translations.length; i++) {
      translationsData.push({
        id: uuidv4(),
        name: translations[i].name,
        lang: translations[i].lang,
        countryId: newCountry.id,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy : adminId
      });
    }

    await MstCountryTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("Country.COUNTRY_CREATED"),
      data: { countryId: newCountry.id },
      err: null,
    });
  } catch (error) {
    console.error("Error in creating country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const getCountryById = async (req, res) => {
  try {
    const { countryId } = req.params;

    const validation = new VALIDATOR(req.params, { countryId: validationRules.Country.countryId });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const query = `
      SELECT c.id,ct.id,ct.name
      FROM mst_country c
      LEFT JOIN mst_country_trans ct ON ct.country_id = c.id
      WHERE c.id = :countryId
    `;

    const country = await sequelize.query(query, {
      replacements: { countryId },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!country || country.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_FETCHED"),
      data: country,
      err: null,
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
    const { countryId, translations } = req.body;
    const adminId = req.admin.id;

    const validation = new VALIDATOR(req.body, validationRules.Country);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const country = await MstCountry.findOne({
      where: { id: countryId, isDeleted: false },
      attributes: ['id'],
    });

    if (!country) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    for (let i = 0; i < translations.length; i++) {
      const query = `
         SELECT id 
         FROM mst_country_trans 
         WHERE is_deleted = false
         AND country_id != :countryId
         AND LOWER(lang) = LOWER(:lang)
         AND LOWER(name) = LOWER(:name)

      `;

      const existingTranslation = await sequelize.query(query, {
        replacements: { lang: translations[i].lang, name: translations[i].name, countryId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      if (existingTranslation.length > 0) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("Country.COUNTRY_TRANSLATIONS_EXISTS_ASSOCIATED_TO_ANOTHER_COUNTRY"),
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
        countryId: countryId,
        createdBy: adminId,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }
    
    country.updatedAt = Math.floor(Date.now() / 1000);
    country.updatedBy = adminId;
    await country.save();

    await MstCountryTrans.update(
      { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: adminId },
      { where: { countryId: countryId, isDeleted: false } }
    );

    await MstCountryTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_UPDATED"),
      data: country,
      err: null,
    });
  } catch (error) {
    console.error("Error in updating country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: "",
    });
  }
};


const deleteCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    const adminId = req.admin.id;

    const validation = new VALIDATOR(req.params, { countryId: validationRules.Country.countryId });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const country = await MstCountry.findOne({
      where: { id: countryId, isDeleted: false },
      attributes: ['id'],
    });

    if (!country) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    await MstCountryTrans.update(
      { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: adminId },
      { where: { countryId: countryId, isDeleted: false } }
    );

    await MstCountry.update(
      { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: adminId },
      { where: { id: countryId, isDeleted: false } }
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_DELETED"),
      data: country,
      err: null,
    });
  } catch (error) {
    console.error("Error in deleting country:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: "",
    });
  }
};


const getAllCountry = async (req, res) => {
  try {
    const lang = i18n.getLocale() || 'en';
    const page = 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const query = `
      SELECT 
        c.id AS countryId,
        ct.id AS countryTransId,
        ct.name AS countryName, 
        ct.lang AS translationLang
      FROM mst_country c
      LEFT JOIN mst_country_trans ct ON ct.country_id = c.id AND ct.lang = :lang
      WHERE c.is_deleted = false
      ORDER BY c.createdAt asc
      LIMIT :limit OFFSET :offset
    `;

    const countries = await sequelize.query(query, {
      replacements: { lang, limit: pageSize, offset },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    if (!countries || countries.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Country.COUNTRY_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    const countQuery = `
      SELECT COUNT(*) as totalCountries
      FROM mst_country c
      WHERE c.is_deleted = false
    `;
    const countResult = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    const totalCountries = countResult[0]?.totalCountries || 0;

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Country.COUNTRY_FETCHED"),
      data: countries,
      totalCountries,
      err: null
    });
  } catch (error) {
    console.error("Error in getting countries:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null
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