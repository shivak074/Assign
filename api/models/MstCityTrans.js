const { DataTypes } = require("sequelize")
const sequelize = require("../../config/sequelize")
const { uuidv4 } = require("../../config/constants")
const MstCity = require("./MstCity")

const MstCityTrans = sequelize.define(
  "MstCityTrans",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lang: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cityId: {
      type: DataTypes.UUID,
      field: "city_id",
      references: {
        model: MstCity,
        key: "id"
      },
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: "is_active",
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.BIGINT,
      field: "created_at",
      allowNull: false,
      defaultValue: Math.floor(Date.now() / 1000)
    },
    createdBy: {
      type: DataTypes.UUID,
      field: "created_by",
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.BIGINT,
      field: "updated_at",
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      field: "updated_by",
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: "is_deleted",
      defaultValue: false
    },
    deletedBy: {
      type: DataTypes.UUID,
      field: "deleted_by",
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.BIGINT,
      field: "deleted_at",
      allowNull: true
    }
  },
  {
    tableName: "mst_city_trans",
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = MstCityTrans
