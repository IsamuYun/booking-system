const { sequelize, DataTypes } = require('./index');
const { Op } = require('sequelize');

// 1. 用户表
const User = sequelize.define('User', {
  openid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // OpenID 必须唯一
  },
  nickname: {
    type: DataTypes.STRING
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  avatarUrl: {
    type: DataTypes.STRING
  }
});

// 2. 咨询师档案表 - Counselor - 12/18 新增
const Counselor = sequelize.define('Counselor', {
  // 咨询师姓名
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // 类型 (例如：'内部'，'外部'，'合作-漫漫')
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '内部'
  },
  sub_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  // 预订咨询室的价格
  booking_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  // 预订多功能房的价格
  booking_multi_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0,
  },
  // 备注
  note: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  }
})

// 3. 咨询室表
const Room = sequelize.define('Room', {
  // id 会自动创建为主键，不需要手动定义
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // 房间类型 (例如：'咨询室'，'多功能房') - 12/18 新增
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '咨询室'
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// 4. 预约记录表
const Booking = sequelize.define('Booking', {
  booking_date: {
    type: DataTypes.STRING, // 格式 YYYY-MM-DD
    allowNull: false
  },
  start_time_slot: {
    type: DataTypes.INTEGER, // 例如 9 代表 9:00-10:00
    allowNull: false
  },
  start_time: {
    type: DataTypes.STRING, // 例如 "09:00"
    allowNull: false
  },
  end_time_slot: {
    type: DataTypes.INTEGER, // 例如 10 代表 10:00-11:00
    allowNull: false
  },
  end_time: {
    type: DataTypes.STRING, // 例如 "10:00"
    allowNull: false
  },
  counselor_id: {
    type: DataTypes.INTEGER, // 咨询师 ID
    allowNull: false
  },
  booker_name: {
    type: DataTypes.STRING, // 预约咨询师姓名
    allowNull: false
  },
  booker_type: {
    type: DataTypes.STRING, // 预约咨询师类型（内部/外部/合作-漫漫）
    allowNull: false
  },
  booking_fee: {
    type: DataTypes.FLOAT, // 房间费用
    allowNull: false,
    defaultValue: 0.0
  },
  status: {
    type: DataTypes.ENUM('booked', 'cancelled', 'completed'),
    defaultValue: 'booked'
  },
  user_id: {
    type: DataTypes.STRING, // 预约人的 OpenID
    allowNull: false
  },
  room_id: {
    type: DataTypes.INTEGER, // 房间 ID
    allowNull: false
  }
});

// --- 建立关联关系 (这非常重要) ---
// 用户拥有多个预约
/*
User.hasMany(Booking, {
  foreignKey: 'user_id'
});
Booking.belongsTo(User, {
  foreignKey: 'user_id',  // 通过 booking.user_id 关联 User 表
  targetKey: 'openid'         // 指向 User 表的 id 字段
});
*/
// 咨询师拥有多个预约
Counselor.hasMany(Booking, {
  foreignKey: 'counselor_id'
});
Booking.belongsTo(Counselor, {
  foreignKey: 'counselor_id',  // 通过 booking.counselor_id 关联 Counselor 表
  targetKey: 'id'               // 指向 Counselor 表的 id 字段
});
/*
// 房间拥有多个预约
Room.hasMany(Booking, {
  foreignKey: 'room_id'
});
Booking.belongsTo(Room, {
  foreignKey: 'room_id',  // 通过 booking.room_id 关联 Room 表
  targetKey: 'id'         // 指向 Room 表的 id 字段
});
*/
// 导出模型
module.exports = { User, Counselor, Room, Booking, sequelize, Op };