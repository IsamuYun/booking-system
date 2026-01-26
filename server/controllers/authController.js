const axios = require('axios');
const { User } = require('../models/init');
const jwt = require('jsonwebtoken');

const APP_ID = 'wx99a20a046dadba5d';
const APP_SECRET = 'abba442da47c4f1944e9a392cb2089e4';
const JWT_SECRET = 'YOUR_JWT_SECRET';

const INVITE_CODE = 'LING2026';

exports.loginByPhone = async (req, res) => {
  const { phone, code } = req.body;

  try {
    // 1. 根据手机号查询用户
    let user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.json({
        success: false,
        action: 'redirect_to_register',
        message: '该手机号未注册，请先注册'
      });
    }

    // 2. 绑定 openid
    if (!user.openid) {
      if (!code) {
        return res.status(400).json({
          message: "缺少微信登录凭证，无法绑定 openid"
        });
      }

      // 调用微信接口获取 openid
      const wx_url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
      const wx_res = await axios.get(wx_url);
      const { openid, errcode, errmsg } = wx_res.data;

      if (errcode) {
        console.error("微信API错误: ", errmsg);
        return res.status(500).json({
          message: "微信登录失败，请重试"
        });
      }
      user.openid = openid;
      await user.save();
      console.log(`用户${user.name} 绑定OpenID成功`);
    }

    // 3. 生成 JWT Token 返回给前端
    const token = jwt.sign(
      { id: user.id, role: user.role, openid: user.openid },
      JWT_SECRET,
      { expiresIn: '7d' });
    // 4. 
    res.json({
      success: true,
      action: 'redirect_to_home',
      token: token,
      user: {
        id: user.id,
        role: user.role,
        openid: user.openid,
        phone: user.phone,
        name: user.name,
      }
    });
  }
  catch (error) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }

  // 
};

exports.register = async (req, res) => {
  const { name, phone, code, invite_code } = req.body;
  console.log("注册信息: ", name, phone, code, invite_code);
  // 1. 基础校验
  if (!phone || !invite_code || !name) {
    return res.status(400).json({
      message: "请填写完整信息"
    });
  }

  // 2. 验证邀请码
  if (invite_code !== INVITE_CODE) {
    return res.status(400).json({
      message: "邀请码错误，请联系管理员"
    });
  }

  try {
    // 3. 检查手机号是否已经注册
    let user = await User.findOne({ where: { phone } });
    if (user) {
      return res.json({
        success: false,
        action: 'redirect_to_login',
        message: '该手机号已注册，请登录'
      });
    }

    // 4. 先获取openid
    let openid = null;
    if (code) {
      const wx_url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
      const wx_res = await axios.get(wx_url);
      const { errcode, errmsg } = wx_res.data;

      if (errcode) {
        console.error("微信API错误: ", errmsg);
        return res.status(500).json({
          message: "微信登录失败，请重试"
        });
      }
      if (wx_res.data.openid) {
        openid = wx_res.data.openid;
      }
    }

    // 5. 创建新用户
    user = await User.create({
      phone,
      role: 'user',
      name: name,
      openid,
    });

    // 6. 生成 JWT Token 返回给前端
    const token = jwt.sign(
      { id: user.id, role: user.role, openid: user.openid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. 
    res.json({
      success: true,
      action: 'redirect_to_home',
      token: token,
      user: {
        id: user.id,
        role: user.role,
        openid: user.openid,
        phone: user.phone,
        name: user.name,
      }
    });
  }
  catch (error) {
    console.error("注册失败: ", error);
    res.status(500).json({ message: '注册失败' });
  }
}