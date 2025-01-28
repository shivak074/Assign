const { DataTypes } = require("sequelize")
const sequelize = require("../../config/sequelize")
const { uuidv4 } = require("../../config/constants")
const MstCountry = require("./MstCountry")

const MstCity = sequelize.define(
  "MstCity",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    countryId: {
      type: DataTypes.UUID,
      field: "country_id",
      references: {
        model: MstCountry,
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
      defaultValue: () => Math.floor(Date.now() / 1000),
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
    tableName: "mst_city",
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = MstCity
