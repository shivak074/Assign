const { HTTP_STATUS_CODE } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const sequelize = require("../../../../config/sequelize");

const getAllCategories = async (req, res) => {
    try {
      const lang = i18n.getLocale() || "en";  
      const sortBy = "createdAt";  
      const sortOrder = "asc";  
  
      const validSortFields = ["createdAt"];
      if (!validSortFields.includes(sortBy.toLowerCase())) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          msg: i18n.__("messages.INVALID_SORT_BY_FIELD"),
          data: "",
          err: null,
        });
      }
  
      const query = `
        SELECT 
          c.id AS categoryId,
          ct.name AS categoryName, 
          ct.lang AS translationLang
        FROM category c
        LEFT JOIN category_trans ct 
          ON c.id = ct.category_id 
          AND ct.is_deleted = false 
          AND ct.lang = :lang
        WHERE c.is_deleted = false
        ORDER BY c.createdAt ${sortOrder}  
      `;
  
      const categories = await sequelize.query(query, {
        replacements: { lang },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
  
      if (categories.length === 0) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          msg: i18n.__("Category.CATEGORIES_NOT_FOUND"),
          data: "",
          err: null,
        });
      }
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        msg: i18n.__("Category.CATEGORIES_FETCHED"),
        data: categories,
        err: null,
      });
    } catch (error) {
      console.error("Error in getting all categories:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        msg: i18n.__("messages.INTERNAL_ERROR"),
        data: error.message,
        err: null,
      });
    }
  };
  

  const getAllSubCategory = async (req, res) => {
    try {
      const lang = i18n.getLocale() || 'en';
      const sortBy = 'createdAt';  
      const sortOrder = 'asc';  
  
      const validSortFields = ['createdAt'];
      if (!validSortFields.includes(sortBy.toLowerCase())) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          msg: i18n.__("messages.INVALID_SORT_BY_FIELD"),
          data: "",
          err: null,
        });
      }
  
      const query = `
        SELECT sc.id, sct.name, sct.lang
        FROM sub_category sc
        LEFT JOIN sub_category_trans sct 
          ON sct.subcategory_id = sc.id 
          AND sct.lang = :lang
        WHERE sc.is_deleted = false 
        GROUP BY sc.id, sct.name, sct.lang
        ORDER BY sc.createdAt ${sortOrder}  -- Sorting by 'createdAt'
      `;
  
      const subcategories = await sequelize.query(query, {
        replacements: { lang },
        type: sequelize.QueryTypes.SELECT,
        raw: true
      });
  
      if (!subcategories || subcategories.length === 0) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          msg: i18n.__("SubCategory.SUBCATEGORY_NOT_FOUND"),
          data: "",
          err: null
        });
      }
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        msg: i18n.__("SubCategory.SUBCATEGORY_FETCHED"),
        data: subcategories,
        err: null
      });
    } catch (error) {
      console.error("Error in getting subcategories:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        msg: i18n.__("messages.INTERNAL_ERROR"),
        data: error.message,
        err: null,
      });
    }
  };
  

  const getAllCountry = async (req, res) => {
    try {
      const lang = i18n.getLocale() || 'en';
      const sortBy = 'createdAt';  
      const sortOrder = 'asc';  
  
      const validSortFields = ['createdAt'];
      if (!validSortFields.includes(sortBy.toLowerCase())) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          msg: i18n.__("messages.INVALID_SORT_BY_FIELD"),
          data: "",
          err: null,
        });
      }
  
      const query = `
        SELECT c.id, ct.*
        FROM mst_country c
        LEFT JOIN mst_country_trans ct ON ct.country_id = c.id AND ct.lang = :lang
        WHERE c.is_deleted = false
        ORDER BY c.createdAt ${sortOrder}  
      `;
  
      const countries = await sequelize.query(query, {
        replacements: { lang },
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
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        msg: i18n.__("Country.COUNTRY_FETCHED"),
        data: countries,
        err: null
      });
    } catch (error) {
      console.error("Error in getting countries:", error);
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
      const sortBy = 'createdAt'; 
      const sortOrder = 'asc';  
  
      const validSortFields = ['createdAt'];
      if (!validSortFields.includes(sortBy.toLowerCase())) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          msg: i18n.__("messages.INVALID_SORT_BY_FIELD"),
          data: "",
          err: null,
        });
      }
  
      const query = `
        SELECT c.id, ct.*
        FROM mst_city c
        LEFT JOIN mst_city_trans ct ON ct.city_id = c.id AND ct.lang = :lang
        WHERE c.is_deleted = false
        ORDER BY c.createdAt ${sortOrder}  
      `;
  
      const cities = await sequelize.query(query, {
        replacements: { lang },
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
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        msg: i18n.__("City.CITY_FETCHED"),
        data: cities,
        err: null
      });
    } catch (error) {
      console.error("Error in getting cities:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        msg: i18n.__("messages.INTERNAL_ERROR"),
        data: error.message,
        err: null,
      });
    }
  };
  


module.exports = {
    getAllCategories,
    getAllSubCategory,
    getAllCountry,
    getAllCity
};