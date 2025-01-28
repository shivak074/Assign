const { Category, CategoryTrans, SubCategory, SubCategoryTrans, User, MstCity, MstCountry, Account } = require("../../../models/index");
const { HTTP_STATUS_CODE, Op } = require("../../../../config/constants");
const i18n = require("../../../../config/i18n");
const Sequelize = require('../../../../config/sequelize')

const listCategoriesWithSubcategories = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const categories = await Category.findAll({
      include: [
        {
          model: CategoryTrans,
          as: "translations", 
          where: {
            name: {
              [Op.like]: `%${search}%`, 
            },
          },
          attributes: ["id", "name", "lang"],
        },
        {
          model: SubCategory,
          as: "subcategories", 
          attributes: ["id", "isActive"],
          include: [
            {
              model: SubCategoryTrans,
              as: "translations", 
              attributes: ["id", "name", "lang"],
            },
          ],
        },
      ],
      attributes: ["id"], 
      order: [["id", "ASC"]],
    });
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      translations: category.translations.map((translation) => ({
        id: translation.id,
        name: translation.name,
        lang: translation.lang,
      })),
      subcategories: category.subcategories.map((subcategory) => ({
        id: subcategory.id,
        isActive: subcategory.isActive,
        translations: subcategory.translations.map((translation) => ({
          id: translation.id,
          name: translation.name,
          lang: translation.lang,
        })),
      })),
    }));

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("messages.CATEGORIES_LISTED"),
      data: {
        categories: formattedCategories,
      },
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

const getUsersWithFilters = async (req, res) => {
  try {
    const { city, country, search } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (city) {
      where['cityId'] = city;
    }

    if (country) {
      where['countryId'] = country;
    }

    const users = await User.findAll({
      where,
      include: [
        {
          model: MstCity,
          as: 'city',
          required: false, 
          where: city ? { id: city } : undefined,
          attributes: ['id'], 
        },
        {
          model: MstCountry,
          as: 'country',
          required: false,
          where: country ? { id: country } : undefined,
          attributes: ['id'], 
        },
        {
          model: Account,
          as: 'accounts',
          required: false, 
          attributes: [], 
        },
      ],
      attributes: [
        'id', 'name', 'email',
        [Sequelize.fn('COUNT', Sequelize.col('accounts.id')), 'accountCount'], 
      ],
      group: ['User.id', 'city.id', 'country.id'], 
    });

    return res.status(200).json({
      msg: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error in fetching users:", error);
    return res.status(500).json({
      msg: "Internal server error",
      data: error.message,
      err: error,
    });
  }
};



module.exports = { listCategoriesWithSubcategories ,getUsersWithFilters};
