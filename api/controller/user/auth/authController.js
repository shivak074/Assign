const { JWT, uuidv4, VALIDATOR, BCRYPT, Op, HTTP_STATUS_CODE,TOKEN_EXPIRY } = require("../../../../config/constants");
const { User,MstCountry,MstCity } = require("../../../models/index");
const { generateToken } = require("../../../helper/auth/generateJWTToken");
const { validationRules } = require("../../../../config/validationRules");
const i18n = require("../../../../config/i18n");
const sequelize = require("../../../../config/sequelize");

const SignUp = async (req, res) => {
  try {
    const { name, email, password, countryId, cityId, companyName } = req.body;

    const validation = new VALIDATOR(req.body, validationRules.User);
    
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }
    const existingUser = await User.findOne({
      where: { email:  email } ,
      attributes : ["id"]
    });

    if (existingUser) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("User.Auth.EMAIL_ALREADY_EXISTS"),
        data: "",
        err: null,
      });
    }

    const hashedPassword = await BCRYPT.hash(password, 10);

    const newUser = await User.create({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      countryId,
      cityId,
      companyName,
    });


    return res.status(HTTP_STATUS_CODE.CREATED).json({
      msg: i18n.__("User.Auth.USER_CREATED"),
      data: { id: newUser.id, name: newUser.name },
      err: null,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data:error.message,
      err: null,
    });
  }
};

const login = async (req, res) => { 

  try {
    const { email, password } = req.body;

    const validation = new VALIDATOR(req.body,{
      email: validationRules.User.email,
      password: validationRules.User.password
    });
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }

    const user = await User.findOne({
       where: { email: email },
      attributes: ["id", "password"]
     });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_CREDENTIALS"),
        data: "",
        err: null,
      });
    }

    const isPasswordValid = await BCRYPT.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_CREDENTIALS"),
        data: "",
        err: null,
      });
    }

    const token = generateToken(
      { userId: user.id, email: user.email },
      TOKEN_EXPIRY
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("User.Auth.LOGIN_SUCCESS"),
      data:{ userId: user.id, email: user.email, token },
      err: null,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: "",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, countryId, cityId, companyName } = req.body;
    const userId = req.user.id;

    const validation = new VALIDATOR(req.body, {
      name: validationRules.User.name,
      countryId: validationRules.User.countryId,
      cityId: validationRules.User.cityId,
      companyName: validationRules.User.companyName
    });

    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: validation.errors.all(),
        err: null,
      });
    }

    const user = await User.findOne({ where: { id: userId },attributes: ['id'] });
    
    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        msg: i18n.__("User.Auth.USER_NOT_FOUND"),
        data: "",
        err: null,
      });
    }

    const updatedData = {
      name: name,
      countryId: countryId,
      cityId: cityId, 
      companyName: companyName
    };
     
    user.updatedAt = Math.floor(Date.now() / 1000);
    user.updatedBy = userId;
    await user.update(updatedData);


    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("User.Auth.PROFILE_UPDATED"),
      data: {userId},
      err: null,
    });
  } catch (error) {
    console.error("Error in updating profile:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: "",
    });
  }
};




module.exports = {
  SignUp,
  login,
  updateProfile,
};