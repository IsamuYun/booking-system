const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '/data/database.sqlite');

console.log(`正在连接数据库，路径: ${dbPath}`);

// 初始化SQLite数据库连接
// 数据库文件存储在项目根目录下的 'database.sqlite' 文件中
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // 关闭SQL日志输出

    define: {
        freezeTableName: true, // 禁止自动复数表名
    }
});

const db = {
    sequelize,
    DataTypes
};

module.exports = db;