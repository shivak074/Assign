const { Category, CategoryTrans,Account } = require("../../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, uuidv4 } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { validationRules } = require("../../../../config/validationRules");
const sequelize = require('../../../../config/sequelize')

const createCategory = async (req, res) => {
  try {
    const { translations } = req.body;
    const adminId = req.admin.id;
    const validation = new VALIDATOR(req.body, validationRules.TransController);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }

    const langs = [];
    const names = [];
    
    for (let i = 0; i < translations.length; i++) {
      langs.push(translations[i].lang);
      names.push(translations[i].name);
    }


    const query = `
      SELECT id
      FROM category_trans
      WHERE lang IN (:langs) AND name IN (:names) AND is_deleted = false
    `;

    const existingTranslations = await sequelize.query(query, {
      replacements: { langs, names },
      type: sequelize.QueryTypes.SELECT,
      raw: true,  
    });

    if (existingTranslations.length > 0) {
      return res.status(HTTP_STATUS_CODE.CONFLICT).json({
        msg: i18n.__("Category.CATEGORY_TRANSLATIONS_EXISTS"),
        data: "",
        err: null
      });
    }

    const newCategory = await Category.create({
      id: uuidv4(),
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
      createdBy : adminId
    });

    console.log('newCategory:', newCategory);

    const translationsData = [];
    for (let i = 0; i < translations.length; i++) {
      translationsData.push({
        id: uuidv4(),
        name: translations[i].name,
        lang: translations[i].lang,
        categoryId: newCategory.id,
        createdBy : adminId
      });
    }

    console.log('translationsData:', translationsData);

    await CategoryTrans.bulkCreate(translationsData);


    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("Category.CATEGORY_CREATED"),
      data: { categoryId: newCategory.id },
      err: null
    });
  } catch (error) {
    console.error("Error in creating category:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};


const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const query = `
      SELECT c.*, ct.*
      FROM category c
      LEFT JOIN category_trans ct ON ct.category_id = c.id
      WHERE c.id = :categoryId
    `;

    const category = await sequelize.query(query, {
      replacements: { categoryId },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    if (!category || category.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORY_FETCHED"),
      data: category,
      err: null
    });
  } catch (error) {
    console.error("Error in getting category:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};


const updateCategory = async (req, res) => {
  try {
    const { categoryId, translations } = req.body;
    const adminId = req.admin.id;

    const validation = new VALIDATOR(req.body, validationRules.TransController);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }

    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
    });

    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    category.updatedAt = Math.floor(Date.now() / 1000);
    category.updatedBy = adminId;
    await category.save();

    await CategoryTrans.update(
      { isDeleted: true, updatedAt: Math.floor(Date.now() / 1000), updatedBy: adminId },
      { where: { categoryId: categoryId, isDeleted: false } }
    );

    const translationsData = [];
    for (let i = 0; i < translations.length; i++) {
      translationsData.push({
        id: uuidv4(),
        name: translations[i].name,
        lang: translations[i].lang,
        categoryId: categoryId,
        createdBy: adminId,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    await CategoryTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORY_UPDATED"),
      data: category.id ,
      err: null,
    });
  } catch (error) {
    console.error("Error in updating category:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: "",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const adminId = req.admin.id;
    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      attributes: ['id']
    });

    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    const accountsWithCategory = await Account.count({
      where: {
        categoryId: categoryId,
        isDeleted: false,
      },
    });

    if (accountsWithCategory > 0) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        msg: i18n.__("Category.CATEGORY_ASSIGNED_TO_ACCOUNT"),
        data: "",
        err: null,
      });
    }

    await CategoryTrans.update(
      { isDeleted: true, updatedAt: Math.floor(Date.now() / 1000), deletedAt: Math.floor(Date.now() / 1000),  deletedBy: adminId },
      { where: { categoryId: categoryId, isDeleted: false } }
    );

    await Category.update(
      { isDeleted: true, updatedAt: Math.floor(Date.now() / 1000), deletedAt: Math.floor(Date.now() / 1000), deletedBy: adminId },
      { where: { id: categoryId, isDeleted: false } }
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORY_DELETED"),
      data: "",
      err: null,
    });
  } catch (error) {
    console.error("Error in deleting category:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};



module.exports = {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory
};