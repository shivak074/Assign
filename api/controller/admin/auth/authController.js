const { Admin } = require("../../../models/index");
const { generateToken } = require("../../../helper/auth/generateJWTToken");
const { HTTP_STATUS_CODE, BCRYPT, Op, VALIDATOR, TOKEN_EXPIRY } = require("../../../../config/constants");
const i18n = require('../../../../config/i18n');
const validationRules = require('../../../../config/validationRules');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validation = new VALIDATOR(req.body, validationRules.Admin);
    
    if (validation.fails()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("messages.INVALID_INPUT"),
        data: "",
        err: validation.errors.all()
      });
    }

    const admin = await Admin.findOne({
      where: { email: email },
      attributes: ["id", "password", "isDeleted"]
    });

    if (!admin) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("Admin.Auth.INVALID_CREDENTIALS"),
        data: "",
        err: null
      });
    }

    if (admin.isDeleted) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("Admin.Auth.USER_NOT_FOUND"),
        data: "",
        err: null
      });
    }

    const isPasswordValid = await BCRYPT.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        msg: i18n.__("Admin.Auth.INVALID_CREDENTIALS"),
        data: "",
        err: null
      });
    }

    const token = generateToken({ adminId: admin.id, email: admin.email }, TOKEN_EXPIRY);

    return res.status(HTTP_STATUS_CODE.OK).json({
      msg: i18n.__("Admin.Auth.LOGIN_SUCCESS"),
      data: { adminId: admin.id, email: admin.email, token },
      err: null
    });
  } catch (error) {
    console.error("Error in loginAdmin:", error);
    return res.status(HTTP_STATUS_CODE.SERVER_ERROR).json({
      msg: i18n.__("messages.INTERNAL_ERROR"),
      data: error.message,
      err: null
    });
  }
};

module.exports = {
  login
};
