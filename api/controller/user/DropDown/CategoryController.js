const { Category, CategoryTrans } = require("../../../models/index");
const { HTTP_STATUS_CODE } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const sequelize = require("../../../../config/sequelize");

const getAllCategories = async (req, res) => {
  try {
    const lang = i18n.getLocale() || 'en';  

    const query = `
      SELECT c.*, ct.*
      FROM category c
      LEFT JOIN category_trans ct 
        ON c.id = ct.categoryId 
        AND ct.isDeleted = false 
        AND ct.lang = :lang
      WHERE c.isDeleted = false
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

module.exports = getAllCategories;
