const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models/init');
const routes = require('./routes/index');

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", routes);

// 启动服务器前，同步数据库
// { force: false } 确保不会删除已有数据, 只会创建缺失的表
sequelize.sync({ force: false }).then(() => {
    console.log('数据库同步完成');
    const PORT = process.env.PORT || 5100;
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
        console.log(`服务器正在运行，地址: ${HOST}, 端口号: ${PORT}`);
    });
}).catch(err => {
    console.error('数据库同步失败:', err);
});

