const { SubCategory, SubCategoryTrans, Category } = require("../../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { uuidv4 } = require("../../../../config/constants");
const { validationRules } = require("../../../../config/validationRules");

const createSubCategory = async (req, res) => {
  try {
    const { categoryId, translations } = req.body;
    
    const validation = new VALIDATOR(req.body, validationRules.TransController);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }
    
    // Check if the category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_ID_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    for (let translation of translations) {
      const existingTranslation = await SubCategoryTrans.findOne({
        where: {
          lang: translation.lang,
          name: translation.name
        }
      });

      if (existingTranslation) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("SubCategory.SUBCATEGORY_TRANSLATIONS_EXISTS"),
          data: "",
          err: null
        });
      }
    }
    // Create the subcategory
    const newSubCategory = await SubCategory.create({
      id: uuidv4(),
      categoryId,
      isActive: true,
      createdAt: Math.floor(Date.now() / 1000),
    });

    // Create translations for the subcategory
    const translationPromises = translations.map(async (translation) => {
      return await SubCategoryTrans.create({
        id: uuidv4(),
        name: translation.name,
        lang: translation.lang,
        subcategoryId: newSubCategory.id,
      });
    });

    await Promise.all(translationPromises);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("SubCategory.SUBCATEGORY_CREATED"),
      data: { subCategory: newSubCategory, translations },
      err: null,
    });
  } catch (error) {
    console.error("Error in creating subcategory:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const getSubCategoryById = async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    // Find subcategory with translations and category
    const subCategory = await SubCategory.findByPk(subCategoryId, {
      include: [
        {
          model: SubCategoryTrans,
          as: "translations",
        },
        {
          model: Category,
          as: "category",
        },
      ],
    });

    if (!subCategory) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("SubCategory.SUBCATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("SubCategory.SUBCATEGORY_FETCHED"),
      data: subCategory,
      err: null,
    });
  } catch (error) {
    console.error("Error in getting subcategory:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
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

    // Check if the subcategory exists
    const subCategory = await SubCategory.findByPk(subCategoryId);
    if (!subCategory) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("SubCategory.SUBCATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    subCategory.updatedAt = Math.floor(Date.now() / 1000);
    await subCategory.save();

    // Update or create translations for the subcategory
    if (translations && translations.length > 0) {
      const translationPromises = translations.map(async (translation) => {
        const existingTranslation = await SubCategoryTrans.findOne({
          where: { subcategoryId: subCategory.id, lang: translation.lang },
        });

        if (existingTranslation) {
          existingTranslation.name = translation.name;
          await existingTranslation.save();
        } else {
          return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                      msg: i18n.__("SubCategory.SUBCATEGORY_TRANSLATIONS_NOT_FOUND"),
                      data: "",
                      err: null
                    });
        }
      });

      await Promise.all(translationPromises);
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("SubCategory.SUBCATEGORY_UPDATED"),
      data: { subCategory, translations },
      err: null,
    });
  } catch (error) {
    console.error("Error in updating subcategory:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
   
    const subCategory = await SubCategory.findByPk(subCategoryId);
    if (!subCategory) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("SubCategory.SUBCATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    const accountsWithCategory = await Account.count({
      where: {
        subCategoryId: subCategoryId,
      }
    });

    if (accountsWithCategory > 0) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        msg: i18n.__("Category.CATEGORY_ASSIGNED_TO_ACCOUNT"),
        data: "",
        err: null
      });
    }

    subCategory.isDeleted = true;
    await subCategory.save();

    
    await SubCategoryTrans.update(
      { isDeleted: true },
      { where: { subcategoryId: subCategory.id } }
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("SubCategory.SUBCATEGORY_DELETED"),
      data: "",
      err: null,
    });
  } catch (error) {
    console.error("Error in deleting subcategory:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const getAllSubCategories = async (req, res) => {
  try {
   
    const subCategories = await SubCategory.findAll({
      include: [
        {
          model: SubCategoryTrans,
          as: "translations",  
        },
        {
          model: Category,
          as: "category", 
        },
      ],
    });

    if (subCategories.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("SubCategory.SUBCATEGORIES_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("SubCategory.SUBCATEGORIES_FETCHED"),
      data: subCategories,
      err: null,
    });
  } catch (error) {
    console.error("Error in getting all subcategories:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

module.exports = {
  createSubCategory,
  getSubCategoryById,
  getAllSubCategories,
  updateSubCategory,
  deleteSubCategory,
};