const { Counselor }  = require('../models/init');

exports.getCounselors = async (req, res) => {
  try {
    const counselors = await Counselor.findAll();
    res.status(200).json({ data: counselors });
  }
  catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}