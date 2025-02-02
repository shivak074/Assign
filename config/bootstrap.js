const { Admin } = require('../api/models/index');
const { BCRYPT, HTTP_STATUS_CODE, VALIDATOR,uuidv4 } = require('./constants');
const i18n = require('./i18n');

const bootstrap = async () => {
  try {
    const existingAdmin = await Admin.findAll({
      where: { isDeleted: false },
      attributes: ["id"],
      limit: 1,
    });

    if (existingAdmin.length > 0) {
      return {
        status: HTTP_STATUS_CODE.OK,
        msg: i18n.__('Admin.Auth.ADMIN_ALREADY_EXISTS'),
        data: existingAdmin,
        error: null,
      };
    }

    const data = {
      name: 'shiva',
      email: 'shiva1234@gmail.com',
      password: 'Shiva@1234',
    };

    const hashedPassword = await BCRYPT.hash(data.password, 10);

    const newAdmin = await Admin.create({
      id: uuidv4(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    return {
      status: HTTP_STATUS_CODE.CREATED,
      msg: i18n.__('Admin.Auth.ADMIN_CREATED'),
      data: newAdmin.id,
      error: null,
    };
  } catch (error) {
    console.error('Error in bootstrap:', error.message);
   throw error;
  }
};

module.exports = bootstrap;
