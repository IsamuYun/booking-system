const axios = require('axios');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.wechatLogin = async (req, res) => {
  const { code } = req.body;
  const appId = 'YOUR_APP_ID';
  const appSecret = 'YOUR_APP_SECRET';
  
  // 1. 请求微信服务器换取 openid
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
  
  try {
    const { data } = await axios.get(url);
    const { openid } = data;

    // 2. 查找或创建用户
    let user = await User.findOne({ openid });
    if (!user) {
      user = await User.create({ openid });
    }

    // 3. 生成 JWT Token 返回给前端
    const token = jwt.sign({ id: user._id }, 'YOUR_JWT_SECRET');
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};