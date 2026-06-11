# Ubuntu 24 部署指南

本文记录将本项目的服务端和后台管理端部署到 Ubuntu 24.04 LTS 的完整步骤。

部署后的访问方式：

- 管理后台：`https://your-domain.com`
- API：`https://your-domain.com/api/...`
- Node.js 服务：只监听服务器本机 `127.0.0.1:5100`
- SQLite 数据库：`/app/server/data/database.sqlite`
- Excel 上传目录：`/app/server/data/xls/`

## 1. 架构

```text
Browser
  |
  v
Nginx 80/443
  |-- /             -> /app/admin/dist/ 管理后台静态文件
  |-- /api/...      -> http://127.0.0.1:5100/... 服务端 API
                          |
                          v
                     SQLite database.sqlite
```

说明：

- `admin/src/api/client.js` 中的 API 前缀固定为 `/api`。
- `server/routes/index.js` 中的服务端路由没有 `/api` 前缀。
- 因此生产环境 Nginx 需要把 `/api/xxx` 反向代理到 `http://127.0.0.1:5100/xxx`，并去掉 `/api` 前缀。

## 2. 约定和占位符

以下命令假设：

| 项目 | 值 |
| --- | --- |
| 域名 | `your-domain.com` |
| 服务器公网 IP | `your-server-ip` |
| 部署用户 | `deploy` |
| 项目根目录 | `/app` |
| 服务端目录 | `/app/server` |
| 管理端目录 | `/app/admin` |
| 服务端端口 | `5100` |

如果项目不放在 `/app`，需要同步修改：

- `/app/ecosystem.config.js` 中的 `cwd`、`DB_PATH`、日志路径
- Nginx 配置中的 `root /app/admin/dist`
- 备份脚本里的数据库路径

## 3. 服务器前置条件

1. Ubuntu 24.04 LTS 服务器。
2. 域名 A 记录已解析到服务器公网 IP。
3. 云厂商安全组至少放行：
   - TCP `22`：SSH
   - TCP `80`：HTTP，申请证书和跳转 HTTPS
   - TCP `443`：HTTPS
4. 不要对公网放行 `5100`。Node.js 服务只应由 Nginx 在本机访问。

本地验证域名解析：

```bash
ping your-domain.com
```

返回 IP 应该是服务器公网 IP。

## 4. 初始化 Ubuntu 24

用默认用户登录服务器：

```bash
ssh ubuntu@your-server-ip
```

创建部署用户：

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo su - deploy
```

更新系统并安装基础工具：

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl ca-certificates build-essential python3 make g++ nginx ufw unzip sqlite3
```

设置服务器时区：

```bash
sudo timedatectl set-timezone Asia/Shanghai
timedatectl
```

配置防火墙：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

如果云厂商安全组没有放行 `80/443`，即使 UFW 已放行，外部也访问不到。

## 5. 安装 Node.js、npm 和 PM2

建议使用 Node.js 22 LTS。项目依赖 `sqlite3`，安装前已在上一步安装原生编译工具。

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

node --version
npm --version
```

安装 PM2：

```bash
sudo npm install -g pm2
pm2 --version
```

## 6. 上传或克隆代码

### 6.1 Git 克隆

如果服务器可以访问代码仓库，推荐直接克隆到 `/app`：

```bash
sudo mkdir -p /app
sudo chown deploy:deploy /app
cd /app
git clone git@github.com:your-org/booking-system.git .
```

如果使用 HTTPS 仓库：

```bash
git clone https://github.com/your-org/booking-system.git .
```

### 6.2 本地打包上传

在本地项目根目录执行：

```bash
tar \
  --exclude='.git' \
  --exclude='*/node_modules' \
  --exclude='admin/dist' \
  --exclude='server/data/*.sqlite' \
  --exclude='server/data/xls/*' \
  -czf booking-system.tar.gz .

scp booking-system.tar.gz deploy@your-server-ip:/tmp/
```

在服务器上解压：

```bash
sudo mkdir -p /app
sudo chown deploy:deploy /app
tar -xzf /tmp/booking-system.tar.gz -C /app
```

## 7. 数据目录和权限

创建 SQLite 数据库目录、上传目录和日志目录：

```bash
mkdir -p /app/server/data/xls
mkdir -p /app/logs
chmod 750 /app/server/data
chmod 750 /app/server/data/xls
chmod 750 /app/logs
```

如果是从旧服务器迁移，把旧库复制到：

```text
/app/server/data/database.sqlite
```

复制后确认权限：

```bash
chown deploy:deploy /app/server/data/database.sqlite
chmod 640 /app/server/data/database.sqlite
```

没有旧库时不用手动创建数据库文件，服务首次启动会自动创建表。

## 8. 服务端环境变量

当前服务端不会自动读取 `.env` 文件，生产部署推荐通过 PM2 的 `ecosystem.config.js` 注入环境变量。

在 `/app/ecosystem.config.js` 中写入或确认以下配置：

```bash
nano /app/ecosystem.config.js
```

内容：

```js
module.exports = {
  apps: [
    {
      name: 'booking-server',
      script: 'app.js',
      cwd: '/app/server',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5100,
        HOST: '127.0.0.1',
        DB_PATH: '/app/server/data/database.sqlite',

        // 管理后台 JWT 密钥。必须改成随机值。
        ADMIN_JWT_SECRET: 'replace_with_openssl_rand_base64_48',

        // 首次启动且数据库内没有任何 admin 用户时，会创建这个默认管理员。
        DEFAULT_ADMIN_PHONE: 'admin',
        DEFAULT_ADMIN_PASSWORD: 'replace_with_a_strong_password',
      },
      out_file: '/app/logs/server-out.log',
      error_file: '/app/logs/server-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
```

生成 JWT 密钥：

```bash
openssl rand -base64 48
```

注意：

- `ADMIN_JWT_SECRET` 必须固定保存，不能每次部署都换。换掉后，所有已登录管理端会立即失效。
- `DEFAULT_ADMIN_PHONE` 和 `DEFAULT_ADMIN_PASSWORD` 只在“数据库里没有任何 `role='admin'` 用户”时生效。
- 首次启动后如果已经生成了管理员，再修改 `DEFAULT_ADMIN_PASSWORD` 不会自动改密码。
- 小程序登录相关的 `APP_ID`、`APP_SECRET`、小程序 JWT 密钥目前在 `server/controllers/authController.js` 中硬编码，尚未改成环境变量；上线前应单独确认这部分安全性。

## 9. 安装依赖

服务端：

```bash
cd /app/server
npm ci --omit=dev
```

管理端：

```bash
cd /app/admin
npm ci
```

如果 `npm ci` 报 `sqlite3` 编译错误，先确认系统包已安装：

```bash
sudo apt install -y build-essential python3 make g++
```

然后重新执行：

```bash
cd /app/server
npm ci --omit=dev
```

## 10. 构建后台管理端

```bash
cd /app/admin
npm run build
ls -lah /app/admin/dist
```

构建成功后应看到：

```text
index.html
assets/
```

生产环境由 Nginx 直接托管 `/app/admin/dist`，不需要运行 `npm run dev` 或 `npm run preview`。

## 11. 首次启动服务端

启动：

```bash
cd /app
pm2 start ecosystem.config.js --env production
pm2 status
```

查看日志：

```bash
pm2 logs booking-server --lines 100
```

日志中应看到类似：

```text
数据库同步完成
服务器正在运行，地址: 127.0.0.1, 端口号: 5100
```

本机测试服务端：

```bash
curl http://127.0.0.1:5100/counselors
curl http://127.0.0.1:5100/rooms
```

首次启动时，服务会执行：

- `sequelize.sync({ force: false })`：创建缺失表，不会主动清空数据。
- `migrateAdminUsers()`：如存在旧 `AdminUser` 表，会迁移到 `User` 表并删除旧表。
- `initDefaults()`：创建默认系统配置；如果没有 admin 用户，会创建默认管理员。

不要在已有生产数据上执行：

```bash
npm run seed
```

因为 `server/config/seed.js` 使用 `sequelize.sync({ force: true })`，会清空数据库并重建初始数据。

## 12. 配置 PM2 开机自启

以 `deploy` 用户运行：

```bash
pm2 startup systemd -u deploy --hp /home/deploy
```

PM2 会输出一条 `sudo env PATH=... pm2 startup ...` 命令，复制并执行它。

保存当前进程列表：

```bash
pm2 save
```

重启服务器后验证：

```bash
sudo reboot
```

重新登录后：

```bash
pm2 status
curl http://127.0.0.1:5100/counselors
```

## 13. 配置 Nginx

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/booking-system
```

写入以下内容，把 `your-domain.com` 换成真实域名：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    root /app/admin/dist;
    index index.html;

    client_max_body_size 20m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        proxy_pass http://127.0.0.1:5100/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 300s;
    }

    location /assets/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/booking-system /etc/nginx/sites-enabled/booking-system
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

HTTP 测试：

```bash
curl -I http://your-domain.com
curl http://your-domain.com/api/counselors
```

如果 `curl http://your-domain.com/api/counselors` 返回 `502`：

1. 检查 PM2：`pm2 status`
2. 检查 Node 监听端口：`ss -tlnp | grep 5100`
3. 检查 Nginx 错误日志：`sudo tail -n 100 /var/log/nginx/error.log`

## 14. 配置 HTTPS

安装 Certbot：

```bash
sudo apt install -y snapd
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

申请证书并让 Certbot 自动改 Nginx 配置：

```bash
sudo certbot --nginx \
  -d your-domain.com \
  -d www.your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

验证自动续期：

```bash
sudo certbot renew --dry-run
```

重新检查 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS 测试：

```bash
curl -I https://your-domain.com
curl https://your-domain.com/api/counselors
```

## 15. 验证后台管理端

浏览器访问：

```text
https://your-domain.com
```

验证项目：

1. 页面应显示管理后台登录页。
2. 使用首次启动前配置的 `DEFAULT_ADMIN_PHONE` / `DEFAULT_ADMIN_PASSWORD` 登录。
3. 登录后验证以下页面：
   - 咨询师管理
   - 房间管理
   - 定期预约
   - 导入
   - 报表
4. 导入 Excel 时，如果文件较大，确认 Nginx `client_max_body_size 20m` 足够。

如果登录后接口报 `401`：

- 确认 PM2 中的 `ADMIN_JWT_SECRET` 与服务启动时一致。
- 修改 `ADMIN_JWT_SECRET` 后需要重新登录。
- 如果有多台服务器，所有实例必须使用同一个 `ADMIN_JWT_SECRET`。

## 16. 修改管理员密码

当前项目没有独立的管理端改密页面。可在服务器上执行脚本修改 `User` 表中管理员密码。

```bash
cd /app/server
ADMIN_PHONE='admin' ADMIN_PASSWORD='ChangeMe1234!' node <<'NODE'
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models/init');

const phone = process.env.ADMIN_PHONE;
const password = process.env.ADMIN_PASSWORD;

(async () => {
  if (!phone || !password) {
    throw new Error('ADMIN_PHONE 和 ADMIN_PASSWORD 不能为空');
  }

  const hash = await bcrypt.hash(password, 10);
  const [count] = await User.update(
    { role: 'admin', password_hash: hash },
    { where: { phone } }
  );

  if (count === 0) {
    await User.create({
      phone,
      name: '系统管理员',
      role: 'admin',
      password_hash: hash,
      openid: '',
    });
    console.log(`已创建管理员：${phone}`);
  } else {
    console.log(`已更新管理员密码：${phone}`);
  }

  await sequelize.close();
})();
NODE
```

把 `ADMIN_PHONE` 和 `ADMIN_PASSWORD` 改成要创建或修改的管理员账号和密码。

修改后无需重启服务，使用新密码重新登录即可。

## 17. 更新发布流程

每次发布新代码：

```bash
cd /app
git pull

cd /app/server
npm ci --omit=dev

cd /app/admin
npm ci
npm run build

cd /app
pm2 restart booking-server --env production --update-env

sudo nginx -t
sudo systemctl reload nginx
```

发布后验证：

```bash
pm2 status
pm2 logs booking-server --lines 50
curl https://your-domain.com/api/counselors
```

浏览器打开 `https://your-domain.com`，确认管理端资源已更新。

## 18. 数据库备份

创建备份目录：

```bash
mkdir -p /app/backups
chmod 750 /app/backups
```

手动备份 SQLite：

```bash
sqlite3 /app/server/data/database.sqlite \
  ".backup '/app/backups/database-$(date +%Y%m%d_%H%M%S).sqlite'"
```

查看备份：

```bash
ls -lh /app/backups
```

建议写一个备份脚本：

```bash
nano /app/backup-db.sh
```

内容：

```bash
#!/usr/bin/env bash
set -euo pipefail

DB="/app/server/data/database.sqlite"
BACKUP_DIR="/app/backups"
TS="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB" ".backup '$BACKUP_DIR/database-$TS.sqlite'"
find "$BACKUP_DIR" -name 'database-*.sqlite' -mtime +30 -delete
```

赋予执行权限：

```bash
chmod 750 /app/backup-db.sh
```

手动执行一次：

```bash
/app/backup-db.sh
```

加入定时任务，每天凌晨 2 点备份：

```bash
crontab -e
```

添加：

```cron
0 2 * * * /app/backup-db.sh >> /app/logs/backup.log 2>&1
```

## 19. 数据库恢复

恢复前先停止服务并备份当前数据库：

```bash
pm2 stop booking-server

sqlite3 /app/server/data/database.sqlite \
  ".backup '/app/backups/database-before-restore-$(date +%Y%m%d_%H%M%S).sqlite'"
```

用备份覆盖当前数据库：

```bash
cp /app/backups/database-YYYYMMDD_HHMMSS.sqlite /app/server/data/database.sqlite
chown deploy:deploy /app/server/data/database.sqlite
chmod 640 /app/server/data/database.sqlite
```

启动服务：

```bash
pm2 start booking-server
pm2 logs booking-server --lines 100
curl http://127.0.0.1:5100/counselors
```

## 20. 日常运维命令

PM2：

```bash
pm2 status
pm2 logs booking-server
pm2 logs booking-server --lines 100
pm2 restart booking-server --env production --update-env
pm2 stop booking-server
pm2 delete booking-server
pm2 monit
```

Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

端口检查：

```bash
ss -tlnp | grep -E '80|443|5100'
```

磁盘检查：

```bash
df -h
du -sh /app/server/data /app/backups /app/logs
```

## 21. 小程序 API 地址

本文件只记录服务端和后台管理端部署。若小程序也要连接生产环境，需要更新小程序接口地址：

```text
miniprogram/utils/request.js
```

当前小程序 `BASE_URL` 是局域网地址。生产环境通常应改为：

```js
const BASE_URL = "https://your-domain.com/api";
```

改完后：

1. 在微信开发者工具重新上传小程序。
2. 在微信公众平台配置服务器域名白名单，添加 `https://your-domain.com`。
3. 重新发布小程序版本。

## 22. 可选：Docker 部署服务端

仓库里有 `server/Dockerfile` 和 `server/docker-compose.yml`，但当前 compose 文件只覆盖服务端，不负责管理端静态文件，也需要 Nginx 单独托管 `admin/dist`。

当前 `server/app.js` 默认端口是 `5100`，而 `server/docker-compose.yml` 示例映射的是 `3000:3000`。如果使用 Docker，需要让容器端口和应用监听端口一致，例如：

```yaml
services:
  booking-server:
    build: .
    container_name: booking-server
    restart: always
    ports:
      - "127.0.0.1:5100:5100"
    environment:
      - NODE_ENV=production
      - PORT=5100
      - HOST=0.0.0.0
      - DB_PATH=/app/data/database.sqlite
      - ADMIN_JWT_SECRET=replace_with_openssl_rand_base64_48
      - DEFAULT_ADMIN_PHONE=admin
      - DEFAULT_ADMIN_PASSWORD=replace_with_a_strong_password
    volumes:
      - ./data:/app/data
```

启动：

```bash
cd /app/server
docker compose up -d --build
docker compose logs -f
```

Nginx 的 `/api/` 仍然反向代理到：

```nginx
proxy_pass http://127.0.0.1:5100/;
```

如果没有明确需要容器化，推荐优先使用本文前面的 PM2 方案，调试和备份 SQLite 更直接。

## 23. 常见问题

### 23.1 管理后台空白或资源 404

检查：

```bash
ls -lah /app/admin/dist
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
```

确认 Nginx `root` 指向 `/app/admin/dist`，并且已执行：

```bash
cd /app/admin
npm run build
```

### 23.2 `/api/...` 返回 404

确认 Nginx `location /api/` 的 `proxy_pass` 结尾带 `/`：

```nginx
proxy_pass http://127.0.0.1:5100/;
```

这个斜杠用于去掉 `/api/` 前缀。否则 `/api/admin/auth/login` 可能会被转发成服务端不存在的路径。

### 23.3 `/api/...` 返回 502

检查 Node.js 是否运行：

```bash
pm2 status
pm2 logs booking-server --lines 100
ss -tlnp | grep 5100
curl http://127.0.0.1:5100/counselors
```

### 23.4 Excel 导入失败

检查：

```bash
ls -ld /app/server/data/xls
sudo tail -n 100 /var/log/nginx/error.log
pm2 logs booking-server --lines 100
```

常见原因：

- `/app/server/data/xls` 不存在或无写权限。
- 文件超过 Nginx `client_max_body_size`。
- 上传文件不是 `.xlsx`。

### 23.5 管理员账号无法登录

检查数据库中是否有 admin 用户：

```bash
cd /app/server
sqlite3 data/database.sqlite "select id, phone, name, role, password_hash is not null as has_password from User;"
```

如果没有管理员或没有密码，按“修改管理员密码”章节创建或重置。

### 23.6 修改 `ecosystem.config.js` 后环境变量没生效

需要带生产环境重启：

```bash
cd /app
pm2 restart booking-server --env production --update-env
pm2 logs booking-server --lines 50
```

如果仍未生效，删除后重新启动：

```bash
pm2 delete booking-server
pm2 start ecosystem.config.js --env production
pm2 save
```
