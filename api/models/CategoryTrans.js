const { DataTypes } = require("sequelize")
const sequelize = require("../../config/sequelize")
const Category = require("./Category")

const CategoryTrans = sequelize.define(
  "CategoryTrans",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    lang: {
      type: DataTypes.STRING,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.UUID,
      field: "category_id",
      allowNull: false,
      references: {
        model: Category,
        key: "id"
      }
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
    tableName: "category_trans",
    freezeTableName: true,
    timestamps: false
  }
)

module.exports = CategoryTrans
