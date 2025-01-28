const { Account, AccountNameTrans, Category, SubCategory } = require("../../../models/index");
const { HTTP_STATUS_CODE, VALIDATOR,uuidv4 } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const { validationRules } = require("../../../../config/validationRules");

const createAccount = async (req, res) => {
  try {
    const { translations, categoryId, subCategoryId, description } = req.body;
    const userId = req.user.id;
    const validation = new VALIDATOR(req.body, validationRules.AccountController);
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }

    const category = await Category.findByPk(categoryId);
    const subCategory = await SubCategory.findByPk(subCategoryId);

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
    
    for (let translation of translations) {
      const existingTranslation = await AccountNameTrans.findOne({
        where: {
          lang: translation.lang,
          name: translation.name
        }
      });

      if (existingTranslation) {
        return res.status(HTTP_STATUS_CODE.CONFLICT).json({
          msg: i18n.__("Account.ACCOUNT_TRANSLATION_EXISTS"),
          data: "",
          err: null
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
    });
    
    const translationPromises = translations.map(async (translation) => {
      return await AccountNameTrans.create({
        id: uuidv4(),
        name: translation.name,
        lang: translation.lang,
        accountId: newAccount.id,
      });
    });

    await Promise.all(translationPromises);


    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("Account.ACCOUNT_CREATED"),
      data: { account: newAccount, translations },
      err: null,
    });
  } catch (error) {
    console.error("Error in creating account:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: "",
      err: error.message,
    });
  }
};

const getAccountById = async (req, res) => {
    try {
      const { accountId } = req.params;
      const account = await Account.findByPk(accountId, {
        include: [
          { model: AccountNameTrans, as: "translations" },
          { model: Category, as: "category" },
          { model: SubCategory, as: "subcategory" },
        ],
      });
  
      if (!account) {
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
      const { accountId} = req.params;
      const { translations, categoryId, subCategoryId, description,userId } = req.body;
  
      const validation = new VALIDATOR(req.body, validationRules.AccountController);
      if (validation.fails()) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          msg: i18n.__("messages.INVALID_INPUT"),
          data: validation.errors.all(),
          err: null,
        });
      }
  
      const account = await Account.findByPk(accountId);
      if (!account) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          msg: i18n.__("Account.ACCOUNT_NOT_FOUND"),
          data: "",
          err: null,
        });
      }
  
      
      const category = await Category.findByPk(categoryId);
      const subCategory = await SubCategory.findByPk(subCategoryId);
  
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
  
      account.categoryId = categoryId;
      account.subCategoryId = subCategoryId;
      account.description = description;
      account.updatedAt = Math.floor(Date.now() / 1000);
      await account.save();
  
      
      if (translations && translations.length > 0) {
        const translationPromises = translations.map(async (translation) => {
          const existingTranslation = await AccountNameTrans.findOne({
            where: { accountId, lang: translation.lang },
          });
  
          if (existingTranslation) {
            existingTranslation.name = translation.name;
            await existingTranslation.save();
          } else {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
              msg: i18n.__("Account.ACCOUNT_TRANSLATION_NOT_FOUND"),
              data: "",
              err: null,
            });
          }
        });
  
        await Promise.all(translationPromises);
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
        data: "",
        err: error.message,
      });
    }
  };

  
  const deleteAccount = async (req, res) => {
    try {
      const { accountId } = req.params;
  
      const account = await Account.findByPk(accountId);
      if (!account) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          msg: i18n.__("Account.ACCOUNT_NOT_FOUND"),
          data: "",
          err: null,
        });
      }
  
      
      await AccountNameTrans.destroy({
        where: { accountId },
      });
  
      
      account.isDeleted = true;
      account.deletedAt = Math.floor(Date.now() / 1000);
      await account.save();
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        msg: i18n.__("Account.ACCOUNT_DELETED"),
        data: "",
        err: null,
      });
    } catch (error) {
      console.error("Error in deleting account:", error);
      return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
        msg: i18n.__("messages.INTERNAL_ERROR"),
        data: "",
        err: error.message,
      });
    }
  };

  const getAllAccounts = async (req, res) => {
    try {
      const accounts = await Account.findAll({
        include: [
          { model: AccountNameTrans, as: "translations" },
          { model: Category, as: "category" },
          { model: SubCategory, as: "subcategory" },
        ],
      });
  
      if (accounts.length === 0) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          msg: i18n.__("Account.ACCOUNTS_NOT_FOUND"),
          data: "",
          err: null,
        });
      }
  
      return res.status(HTTP_STATUS_CODE.OK).json({
        msg: i18n.__("Account.ACCOUNTS_FETCHED"),
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
  