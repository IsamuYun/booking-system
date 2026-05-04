const { Counselor }  = require('../models/init');

exports.getCounselors = async (req, res) => {
  try {
    const counselors = await Counselor.findAll();
    res.status(200).json({ data: counselors });
  }
  catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createCounselor = async (req, res) => {
  try {
    const { name, type, sub_type, booking_price, booking_multi_price, note, status } = req.body;
    if (!name || !type) return res.status(400).json({ error: '姓名和类型为必填项' });
    const counselor = await Counselor.create({ name, type, sub_type, booking_price, booking_multi_price, note, status: status ?? 1 });
    res.status(201).json({ data: counselor });
  } catch (error) {
    console.error('创建咨询师失败:', error);
    res.status(500).json({ error: '创建咨询师失败' });
  }
};

exports.updateCounselor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, sub_type, booking_price, booking_multi_price, note, status } = req.body;
    const counselor = await Counselor.findByPk(id);
    if (!counselor) return res.status(404).json({ error: '咨询师不存在' });
    await counselor.update({ name, type, sub_type, booking_price, booking_multi_price, note, status });
    res.json({ data: counselor });
  } catch (error) {
    console.error('更新咨询师失败:', error);
    res.status(500).json({ error: '更新咨询师失败' });
  }
};

exports.deleteCounselor = async (req, res) => {
  try {
    const { id } = req.params;
    const counselor = await Counselor.findByPk(id);
    if (!counselor) return res.status(404).json({ error: '咨询师不存在' });
    await counselor.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('删除咨询师失败:', error);
    res.status(500).json({ error: '删除咨询师失败' });
  }
};