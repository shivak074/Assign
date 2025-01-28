const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');
const MstCountry = require('./MstCountry');
const MstCity = require('./MstCity');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4, 
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MstCountry, 
      key: 'id',
    },
    field: 'country_id',
  },
  cityId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MstCity, 
      key: 'id',
    },
    field: 'city_id',
  },
  companyName: {
    type: DataTypes.STRING,
    field: 'company_name',
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    defaultValue: true,
  },
  createdAt: {
    type: DataTypes.BIGINT,
    field: 'created_at',
    allowNull: false,
    defaultValue: Math.floor(Date.now() / 1000),
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.BIGINT,
    field: 'updated_at',
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    field: 'updated_by',
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    field: 'is_deleted',
    defaultValue: false,
  },
  deletedBy: {
    type: DataTypes.UUID,
    field: 'deleted_by',
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.BIGINT,
    field: 'deleted_at',
    allowNull: true,
  },
}, {
  tableName: 'user',
  freezeTableName: true,
  timestamps: false,
});

module.exports = User;
