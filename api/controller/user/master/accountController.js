const { Account, AccountNameTrans, Category, SubCategory } = require("../../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR, uuidv4 } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { validationRules } = require("../../../../config/validationRules");
const sequelize = require("../../../../config/sequelize");

const createAccount = async (req, res) => {
  try {
    const { translations, categoryId, subCategoryId, description } = req.body;
    const userId = req.user.id;

    const validation = new VALIDATOR(req.body,{
      translations : validationRules.Account.translations,
      categoryId : validationRules.Account.categoryId, 
      subCategoryId : validationRules.Account.subCategoryId,
       description : validationRules.Account.description
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
      attributes: ['id'],
    });

    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    const subCategory = await SubCategory.findOne({
      where: { id: subCategoryId, categoryId: categoryId, isDeleted: false },
      attributes: ['id'],
    });

    if (!subCategory) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("SubCategory.SUBCATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    for (let i = 0; i < translations.length; i++) {
      const query = `
        SELECT id 
        FROM account_name_trans
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
          msg: i18n.__("Account.ACCOUNT_TRANSLATION_EXISTS"),
          data: "",
          err: null,
        });
      }
    }

    const newAccount = await Account.create({
      id: uuidv4(),
      categoryId,
      subCategoryId,
      description,
      userId,
      createdAt: Math.floor(Date.now() / 1000),
      createdBy: userId,
    });

    const translationsData = [];
    for (let i = 0; i < translations.length; i++) {
      translationsData.push({
        id: uuidv4(),
        name: translations[i].name,
        lang: translations[i].lang,
        accountId: newAccount.id,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: userId,
      });
    }

    await AccountNameTrans.bulkCreate(translationsData);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("Account.ACCOUNT_CREATED"),
      data: { accountId: newAccount.id ,userId},
      err: null,
    });
  } catch (error) {
    console.error("Error in creating account:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};


const getAccountById = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;
    const validation = new VALIDATOR(req.params, { accountId: validationRules.Account.accountId });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all(),
      });
    }

    const query = `
     SELECT 
      a.id AS account_id, 
      a.category_id, 
      a.subcategory_id, 
      a.description, 
      at.id AS translation_id, 
      at.name AS translation_name, 
      c.id AS category_id, 
      s.id AS subcategory_id
      FROM account a
      LEFT JOIN account_name_trans at ON at.account_id = a.id
      LEFT JOIN category c ON c.id = a.category_id
      LEFT JOIN sub_category s ON s.id = a.subcategory_id
      WHERE a.id = :accountId AND a.is_deleted = false AND a.user_id = :userId

    `;

    const account = await sequelize.query(query, {
      replacements: { accountId,userId },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!account || account.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Account.ACCOUNT_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Account.ACCOUNT_FETCHED"),
      data: account,
      err: null,
    });
  } catch (error) {
    console.error("Error in getting account:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};

const updateAccount = async (req, res) => {
  try {
    const { accountId, translations, categoryId, subCategoryId, description } = req.body;
    const userId = req.user.id;

    const validation = new VALIDATOR(req.body, validationRules.Account);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }

    const account = await Account.findOne({
      where: { id: accountId, isDeleted: false },
      attributes: ['id'],
    });
    if (!account) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Account.ACCOUNT_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    const category = await Category.findOne({
      where: { id: categoryId, isDeleted: false },
      attributes: ['id'],
    });
    const subCategory = await SubCategory.findOne({
      where: { id: subCategoryId, isDeleted: false },
      attributes: ['id'],
    });

    if (!category) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Category.CATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    if (!subCategory) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("SubCategory.SUBCATEGORY_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    if (translations && translations.length > 0) {
      for (let i = 0; i < translations.length; i++) {
        const query = `
           SELECT id 
            FROM account_name_trans
            WHERE is_deleted = false
            AND account_id != :accountId
            AND LOWER(lang) = LOWER(:lang) 
            AND LOWER(name) = LOWER(:name)
            AND a.user_id = :userID
        `;

        const existingTranslation = await sequelize.query(query, {
          replacements: { lang: translations[i].lang, name: translations[i].name, accountId,userId },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        });

        if (existingTranslation.length > 0) {
          return res.status(HTTP_STATUS_CODE.CONFLICT).json({
            msg: i18n.__("Account.ACCOUNT_TRANSLATIONS_EXISTS"),
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
          accountId,
          createdAt: Math.floor(Date.now() / 1000),
          createdBy: userId,
        });
      }
      
      account.categoryId = categoryId;
      account.subCategoryId = subCategoryId;
      account.description = description;
      account.updatedAt = Math.floor(Date.now() / 1000);
      account.updatedBy = userId;  
      await account.save();

      await AccountNameTrans.update(
        { isDeleted: true, deletedAt: Math.floor(Date.now() / 1000), deletedBy: userId },
        { where: { accountId, isDeleted: false } }
      );

      if (translationsData.length > 0) {
        await AccountNameTrans.bulkCreate(translationsData);
      }
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Account.ACCOUNT_UPDATED"),
      data: { account, translations },
      err: null,
    });
  } catch (error) {
    console.error("Error in updating account:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};


const deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;
    const account = await Account.findOne({
      where : {accountId : accountId, userId : userId, is_deleted : false},
      attributes : ['id']
    });
    
    if (!account) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Account.ACCOUNT_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    await AccountNameTrans.update(
      { 
        isDeleted: true, 
        deletedAt: Math.floor(Date.now() / 1000), 
        deletedBy: userId 
      },
      { 
        where: { accountId, isDeleted: false } 
      }
    );
   
    await Account.update(
      { 
        isDeleted: true, 
        deletedAt: Math.floor(Date.now() / 1000), 
        deletedBy: userId 
      },
      { 
        where: { id: accountId, isDeleted: false } 
      }
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Account.ACCOUNT_DELETED"),
      data: "",
      err: null,
    });
  } catch (error) {
    console.error("Error in deleting account:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};


const getAllAccounts = async (req, res) => {
  try {
    const lang = i18n.getLocale() || "en"; 
    const userId = req.user.id;

    const query = `
      SELECT a.id, a.category_id, a.subcategory_id, a.description, 
             ct.id AS category, st.id AS subCategory, at.name AS translationName, at.lang
      FROM account a
      LEFT JOIN account_name_trans at ON at.account_id = a.id AND at.lang = :lang
      LEFT JOIN category ct ON ct.id = a.category_id
      LEFT JOIN sub_category st ON st.id = a.subcategory_id
      WHERE a.user_id = :userId AND a.is_deleted = false
    `;

    const accounts = await sequelize.query(query, {
      replacements: { userId, lang }, 
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!accounts || accounts.length === 0) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("Account.ACCOUNT_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Account.ACCOUNT_FETCHED"),
      data: accounts,
      err: null,
    });
  } catch (error) {
    console.error("Error in getting all accounts:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null,
    });
  }
};



module.exports = {
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
  getAllAccounts,
};