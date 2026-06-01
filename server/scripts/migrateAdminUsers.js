/**
 * 一次性迁移：AdminUsers 表 → Users 表（role='admin' + password_hash）
 *
 * 触发时机：app.js sync 完成后、initDefaults 之前自动执行。
 * 幂等性：扫描 AdminUsers 表是否还在 → 在则迁移并 DROP，不在则直接返回。
 *
 * 映射规则：
 *   - phone           ← AdminUser.username
 *   - name            ← AdminUser.display_name || '管理员'
 *   - role            ← 'admin'
 *   - password_hash   ← AdminUser.password_hash
 *   - openid          ← '' （管理员通常不绑定微信）
 *
 * 如果目标 phone 已存在 User：仅升级其 role='admin' 并写入 password_hash（不覆盖姓名）。
 */
const { sequelize, User } = require('../models/init');

// 数据库配置了 freezeTableName: true，因此表名是单数。
const ADMIN_TABLE = 'AdminUser';
const USER_TABLE = 'User';

async function tableExists(name) {
  // sqlite_master 兼容 SQLite；如果切换数据库需要换成 queryInterface.showAllTables
  const [rows] = await sequelize.query(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=:name`,
    { replacements: { name } }
  );
  return rows.length > 0;
}

async function columnExists(table, column) {
  const [rows] = await sequelize.query(`PRAGMA table_info(${table})`);
  return rows.some(r => r.name === column);
}

// sequelize.sync({ force: false }) 不会给已存在的表追加列。
// 这里显式把 password_hash 列补到 Users 表上，确保模型与表结构对齐。
async function ensureUserPasswordHashColumn() {
  if (!(await tableExists(USER_TABLE))) return;
  if (await columnExists(USER_TABLE, 'password_hash')) return;
  await sequelize.query(`ALTER TABLE ${USER_TABLE} ADD COLUMN password_hash VARCHAR(255)`);
  console.log('[migrateAdminUsers] 已为 Users 表追加 password_hash 列');
}

async function migrateAdminUsers() {
  await ensureUserPasswordHashColumn();

  const exists = await tableExists(ADMIN_TABLE);
  if (!exists) {
    return { migrated: 0, dropped: false, reason: `${ADMIN_TABLE} 表不存在，跳过迁移` };
  }

  const [rows] = await sequelize.query(
    `SELECT id, username, password_hash, display_name FROM ${ADMIN_TABLE}`
  );

  let migrated = 0;
  for (const row of rows) {
    const phone = String(row.username || '').trim();
    if (!phone) {
      console.warn('[migrateAdminUsers] 跳过空 username 行 id=', row.id);
      continue;
    }

    const existing = await User.findOne({ where: { phone } });
    if (existing) {
      const update = { role: 'admin' };
      if (!existing.password_hash) update.password_hash = row.password_hash;
      await existing.update(update);
      console.log(`[migrateAdminUsers] 已存在 User(phone=${phone})，升级为管理员`);
    } else {
      await User.create({
        phone,
        name: row.display_name || '管理员',
        role: 'admin',
        password_hash: row.password_hash,
        openid: '',
      });
      console.log(`[migrateAdminUsers] 创建管理员 User(phone=${phone})`);
    }
    migrated += 1;
  }

  await sequelize.query(`DROP TABLE ${ADMIN_TABLE}`);
  console.log(`[migrateAdminUsers] 已删除旧表 ${ADMIN_TABLE}，迁移 ${migrated} 条记录`);

  return { migrated, dropped: true };
}

module.exports = { migrateAdminUsers };
