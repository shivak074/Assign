const { Category, CategoryTrans, Account } = require("../../../models/index");
const {
  HTTP_STATUS_CODE,
  VALIDATOR,
  uuidv4,
} = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { validationRules } = require("../../../../config/validationRules");
const sequelize = require("../../../../config/sequelize");

const createCategory = async (req, res) => {
  try {
    const { translations } = req.body;
    const adminId = req.admin.id;
    const validation = new VALIDATOR(req.body, {
      translations: validationRules.Category.translations,
    });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    for (let i = 0; i < translations.length; i++) {
      const query = `
      SELECT id
      FROM category_trans
      WHERE is_deleted = false
      AND LOWER(lang) = LOWER(:lang)
      AND LOWER(name) = LOWER(:name)
    `;

      const existingTranslation = await sequelize.query(query, {
        replacements: {
          lang: translations[i].lang,
          name: translations[i].name,
        },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      if (existingTranslation.length > 0) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("Category.CATEGORY_TRANSLATIONS_EXISTS"),
          data: "",
          err: null,
        });
      }
    }

    const newCategory = await Category.create({
      id: uuidv4(),
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
        categoryId: newCategory.id,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: adminId,
      });
    }

    await CategoryTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("Category.CATEGORY_CREATED"),
      data: { categoryId: newCategory.id },
      err: null,
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

    const validation = new VALIDATOR(req.params, {
      categoryId: validationRules.Category.categoryId,
    });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const query = `
      SELECT c.id, ct.id,ct.name
      FROM category c
      LEFT JOIN category_trans ct ON ct.category_id = c.id
      WHERE c.id = :categoryId AND is_deleted = false
    `;

    const category = await sequelize.query(query, {
      replacements: { categoryId },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!category || category.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORY_FETCHED"),
      data: category,
      err: null,
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

    const validation = new VALIDATOR(req.body, validationRules.Category);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      attributes: ["id"],
    });

    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    for (let i = 0; i < translations.length; i++) {
      const query = `
      SELECT id
      FROM category_trans
      WHERE is_deleted = false
      AND category_id != :categoryId
      AND LOWER(lang) = LOWER(:lang)
      AND LOWER(name) = LOWER(:name)
  `;

      const existingTranslation = await sequelize.query(query, {
        replacements: {
          lang: translations[i].lang,
          name: translations[i].name,
          categoryId,
        },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      if (existingTranslation.length > 0) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__(
            "Category.CATEGORY_TRANSLATIONS_EXISTS_ASSOCIATED_TO_ANOTHER_CATEGORY"
          ),
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
        categoryId: categoryId,
        createdBy: adminId,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    category.updatedAt = Math.floor(Date.now() / 1000);
    category.updatedBy = adminId;
    await category.save();

    await CategoryTrans.update(
      {
        isDeleted: true,
        deletedAt: Math.floor(Date.now() / 1000),
        deletedBy: adminId,
      },
      { where: { categoryId: categoryId, isDeleted: false } }
    );

    await CategoryTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORY_UPDATED"),
      data: categoryId,
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

    const validation = new VALIDATOR(req.params, {
      categoryId: validationRules.Category.categoryId,
    });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      attributes: ["id"],
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
      attributes: ["id"],
    });

    if (accountsWithCategory > 0) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        msg: i18n.__("Category.CATEGORY_ASSIGNED_TO_ACCOUNT"),
        data: "",
        err: null,
      });
    }

    await CategoryTrans.update(
      {
        isDeleted: true,
        deletedAt: Math.floor(Date.now() / 1000),
        deletedBy: adminId,
      },
      { where: { categoryId: categoryId, isDeleted: false } }
    );

    await Category.update(
      {
        isDeleted: true,
        deletedAt: Math.floor(Date.now() / 1000),
        deletedBy: adminId,
      },
      { where: { id: categoryId, isDeleted: false } }
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORY_DELETED"),
      data: category,
      err: null,
    });
  } catch (error) {
    console.error("Error in deleting category:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: "",
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const lang = i18n.getLocale() || "en";
    const page = 1;
    const pageSize = 10;

    const offset = (page - 1) * pageSize;

    const query = `
      SELECT 
        c.id AS categoryId,
        ct.id AS categoryTransId,
        ct.name AS categoryName, 
        ct.lang AS translationLang
      FROM category c
      LEFT JOIN category_trans ct 
        ON c.id = ct.category_id 
        AND ct.is_deleted = false 
        AND ct.lang = :lang
      WHERE c.is_deleted = false
      ORDER BY c.createdAt asc
      LIMIT :limit OFFSET :offset
    `;

    const categories = await sequelize.query(query, {
      replacements: { lang, limit: pageSize, offset },
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

    const countQuery = `
      SELECT COUNT(*) AS totalCategories
      FROM category c
      WHERE c.is_deleted = false
    `;
    const countResult = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const totalCategories = countResult[0]?.totalCategories || 0;

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORIES_FETCHED"),
      data: categories,
      totalCategories,
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

const listCategoriesWithSubcategories = async (req, res) => {
  try {
    const lang = i18n.getLocale() || "en";
    const page = 1; 
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const query = `
      SELECT 
        c.id AS categoryId,
        ct.id AS categoryTransId,
        ct.name AS categoryName, 
        ct.lang AS translationLang,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'subCategoryId', sc.id,
            'subCategoryName', sct.name,
            'subCategoryTransId', sct.id,
            'subCategoryTransLang', sct.lang
          )
        ) AS subcategories
      FROM category c
      LEFT JOIN category_trans ct 
        ON c.id = ct.category_id 
        AND ct.lang = :lang 
        AND ct.is_deleted = false
      LEFT JOIN sub_category sc 
        ON c.id = sc.category_id
        AND sc.is_deleted = false
      LEFT JOIN sub_category_trans sct 
        ON sc.id = sct.subcategory_id
        AND sct.is_deleted = false
        AND sct.lang = :lang
      WHERE c.is_deleted = false
      GROUP BY c.id, ct.id
      ORDER BY c.createdAt asc
      LIMIT :limit OFFSET :offset
    `;

    const categoriesWithSubcategories = await sequelize.query(query, {
      replacements: { lang, limit: pageSize, offset },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    if (categoriesWithSubcategories.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_WITH_SUBCATEGORIES_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    const countQuery = `
      SELECT COUNT(DISTINCT c.id) AS totalCategories
      FROM category c
      LEFT JOIN category_trans ct 
        ON c.id = ct.category_id
        AND ct.lang = :lang 
        AND ct.is_deleted = false
      LEFT JOIN sub_category sc 
        ON c.id = sc.category_id
        AND sc.is_deleted = false
      LEFT JOIN sub_category_trans sct 
        ON sc.id = sct.subcategory_id
        AND sct.is_deleted = false
        AND sct.lang = :lang
      WHERE c.is_deleted = false
    `;
    const countResult = await sequelize.query(countQuery, {
      replacements: { lang },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });

    const totalCategories = countResult[0]?.totalCategories || 0;

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Category.CATEGORY_WITH_SUBCATEGORIES_FETCHED"),
      data: categoriesWithSubcategories,
      totalCategories,
      err: null
    });
  } catch (error) {
    console.error("Error in getting categories with subcategories:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null
    });
  }
};

module.exports = {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getAllCategories,
  listCategoriesWithSubcategories
};
