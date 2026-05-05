# 部署指南 — 腾讯云 Ubuntu VPS

> 本指南将整套系统（Node.js 后端 + React 管理后台）部署到腾讯云 Ubuntu 服务器，通过域名 + Nginx + HTTPS 对外提供服务。

---

## 目录

1. [架构说明](#1-架构说明)
2. [前提条件](#2-前提条件)
3. [服务器初始化](#3-服务器初始化)
4. [安装运行环境](#4-安装运行环境)
5. [上传 / 克隆项目代码](#5-上传--克隆项目代码)
6. [配置环境变量](#6-配置环境变量)
7. [安装依赖 & 构建前端](#7-安装依赖--构建前端)
8. [配置 PM2 进程守护](#8-配置-pm2-进程守护)
9. [配置 Nginx 反向代理](#9-配置-nginx-反向代理)
10. [配置 HTTPS（Let's Encrypt）](#10-配置-httpslets-encrypt)
11. [腾讯云安全组配置](#11-腾讯云安全组配置)
12. [更新小程序 BaseURL](#12-更新小程序-baseurl)
13. [验证部署](#13-验证部署)
14. [日常维护命令](#14-日常维护命令)
15. [安全加固建议](#15-安全加固建议)

---

## 1. 架构说明

```
Internet
   │
   ▼
腾讯云安全组（放行 80 / 443 / 22）
   │
   ▼
Nginx（80 → 301 重定向到 HTTPS）
Nginx（443 SSL）
   ├── /          → 管理后台静态文件 (admin/dist/)
   └── /api/      → 反向代理 → Node.js :5100
                              （自动去掉 /api 前缀）
   │
   ▼
Node.js (PM2 守护, port 5100)
   │
   ▼
SQLite (/app/data/database.sqlite)
```

| 组件 | 说明 |
|------|------|
| **域名** | `your-domain.com`（替换为实际域名） |
| **管理后台** | `https://your-domain.com` |
| **API** | `https://your-domain.com/api/...` |
| **Node.js** | 监听 `localhost:5100`，不对外暴露 |
| **数据库** | SQLite，文件存储于 `/app/data/database.sqlite` |

---

## 2. 前提条件

- 腾讯云 CVM 实例（Ubuntu 20.04 / 22.04 LTS）
- 已完成域名注册，并将域名 **A 记录解析** 到服务器公网 IP
- 本地已安装 SSH 客户端
- 服务器已开放 22（SSH）端口

> **域名解析验证**：在本地终端执行 `ping your-domain.com`，确认返回的 IP 与服务器公网 IP 一致后再继续。

---

## 3. 服务器初始化

### 3.1 SSH 登录服务器

```bash
ssh ubuntu@your-server-ip
# 如果使用密钥文件：
ssh -i ~/.ssh/your-key.pem ubuntu@your-server-ip
```

### 3.2 更新系统软件包

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget unzip ufw
```

### 3.3 创建专用部署用户（可选，推荐）

```bash
sudo useradd -m -s /bin/bash appuser
sudo usermod -aG sudo appuser
# 切换到 appuser
sudo su - appuser
```

---

## 4. 安装运行环境

### 4.1 安装 Node.js 20.x（LTS）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# 验证
node --version   # 应显示 v20.x.x
npm --version
```

### 4.2 安装 PM2（进程守护）

```bash
sudo npm install -g pm2
```

### 4.3 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
# 验证
sudo nginx -t
```

### 4.4 安装 Certbot（Let's Encrypt SSL）

```bash
sudo apt install -y snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

---

## 5. 上传 / 克隆项目代码

### 方式 A：使用 Git 克隆（推荐）

```bash
sudo mkdir -p /app
sudo chown $USER:$USER /app
cd /app
git clone https://github.com/your-username/booking-system.git .
# 如果是私有仓库，需先配置 SSH Key 或 Personal Access Token
```

### 方式 B：从本地上传（使用 scp）

在**本地终端**执行：

```bash
# 打包项目（排除 node_modules 和 data 目录）
cd /path/to/booking-system
tar --exclude='*/node_modules' \
    --exclude='server/data/*.sqlite' \
    --exclude='admin/dist' \
    -czf booking-system.tar.gz .

# 上传到服务器
scp booking-system.tar.gz ubuntu@your-server-ip:/tmp/

# 回到服务器，解压
ssh ubuntu@your-server-ip
sudo mkdir -p /app
sudo chown $USER:$USER /app
tar -xzf /tmp/booking-system.tar.gz -C /app
```

### 5.1 创建必要目录

```bash
# SQLite 数据库和上传文件的目录
mkdir -p /app/server/data/xls

# 设置权限
chmod 755 /app/server/data
chmod 755 /app/server/data/xls
```

---

## 6. 配置环境变量

```bash
# 创建服务端环境变量文件
cat > /app/server/.env << 'EOF'
# 服务器端口
PORT=5100
HOST=127.0.0.1

# 数据库路径（生产环境）
DB_PATH=/app/server/data/database.sqlite

# 管理后台 JWT 密钥（务必修改为随机字符串！）
ADMIN_JWT_SECRET=请替换为至少32位的随机字符串

# 小程序凭据（如需要）
# WECHAT_APP_ID=your_app_id
# WECHAT_APP_SECRET=your_app_secret
EOF

# 限制读取权限
chmod 600 /app/server/.env
```

> ⚠️ **重要**：`ADMIN_JWT_SECRET` 务必替换为随机字符串，可使用以下命令生成：
> ```bash
> openssl rand -base64 48
> ```

### 6.1 让 Node.js 加载 .env 文件

安装 dotenv：

```bash
cd /app/server
npm install dotenv
```

在 `server/app.js` 顶部（第一行）添加：

```js
require('dotenv').config();
```

---

## 7. 安装依赖 & 构建前端

### 7.1 安装服务端依赖

```bash
cd /app/server
npm install --omit=dev
```

### 7.2 初始化数据库

首次启动会自动执行，也可手动运行种子脚本：

```bash
# 如需重置数据库并填入初始数据（会清空现有数据！）
# npm run seed

# 正常情况下直接启动即可，程序会自动创建表和管理员账号
node app.js &
# 看到 "数据库同步完成" 和 "[Init] 已创建默认管理员账号" 后 Ctrl+C 停止
kill %1
```

### 7.3 构建管理后台静态文件

```bash
cd /app/admin
npm install
npm run build
# 构建产物位于 /app/admin/dist/
ls /app/admin/dist/   # 应看到 index.html 和 assets/ 目录
```

---

## 8. 配置 PM2 进程守护

### 8.1 创建 PM2 配置文件

```bash
cat > /app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'booking-server',
      script: 'app.js',
      cwd: '/app/server',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5100,
        HOST: '127.0.0.1',
        DB_PATH: '/app/server/data/database.sqlite',
      },
      // 日志配置
      out_file: '/app/logs/server-out.log',
      error_file: '/app/logs/server-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 崩溃自动重启
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
EOF
```

### 8.2 创建日志目录

```bash
mkdir -p /app/logs
```

### 8.3 启动服务

```bash
cd /app
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看实时日志
pm2 logs booking-server
```

### 8.4 设置开机自启

```bash
pm2 startup
# 复制并执行命令输出的那条 sudo env PATH=... 命令

pm2 save
```

---

## 9. 配置 Nginx 反向代理

### 9.1 创建站点配置文件

```bash
sudo nano /etc/nginx/sites-available/booking-system
```

粘贴以下内容（替换 `your-domain.com`）：

```nginx
# HTTP → HTTPS 重定向
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Let's Encrypt 验证目录（申请证书时需要）
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主站
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书路径（Certbot 申请后自动填充，先用占位符）
    # ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    # include             /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # 安全响应头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # 文件上传大小限制（Excel 文件）
    client_max_body_size 20M;

    # ── 管理后台静态文件 ─────────────────────────────────
    root /app/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|ico|svg|woff2?)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # ── Node.js API 反向代理 ────────────────────────────
    # /api/xxx → http://localhost:5100/xxx（去掉 /api 前缀）
    location /api/ {
        proxy_pass         http://127.0.0.1:5100/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 上传超时
        proxy_read_timeout    300s;
        proxy_connect_timeout 10s;
        proxy_send_timeout    300s;
    }
}
```

### 9.2 启用配置（先不含 SSL，用于申请证书）

将 HTTPS server 块中 `ssl_*` 那几行先保留注释状态，仅启用 HTTP 版本：

```bash
# 临时只保留 HTTP 版本，让 Certbot 能通过 HTTP 验证域名
sudo nano /etc/nginx/sites-available/booking-system
# 注释掉整个 "server { listen 443 ..." 块

sudo ln -s /etc/nginx/sites-available/booking-system \
           /etc/nginx/sites-enabled/booking-system

# 删除默认站点
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t          # 检查语法
sudo systemctl reload nginx
```

---

## 10. 配置 HTTPS（Let's Encrypt）

### 10.1 申请 SSL 证书

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email
```

Certbot 会自动修改 Nginx 配置，填入证书路径并处理 HTTP→HTTPS 跳转。

### 10.2 验证证书自动续期

```bash
# 测试续期（不实际执行）
sudo certbot renew --dry-run
```

Let's Encrypt 证书 90 天过期，Certbot 安装时会自动创建 systemd timer 定期续期。

### 10.3 重启 Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. 腾讯云安全组配置

进入**腾讯云控制台** → **云服务器** → **安全组** → **入站规则**，确保以下规则存在：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0（或限制 IP） | SSH 管理 |
| TCP | 80 | 0.0.0.0/0 | HTTP（用于 HTTPS 跳转） |
| TCP | 443 | 0.0.0.0/0 | HTTPS |

> ⚠️ **5100 端口不要放行**，Node.js 服务只对 `127.0.0.1` 监听，通过 Nginx 代理访问。

---

## 12. 更新小程序 BaseURL

小程序中有两处硬编码的后端地址需要更新为正式域名。

**文件 1**：`miniprogram/utils/request.js`

```js
// 修改前
const BASE_URL = 'http://192.168.0.22:5100';

// 修改后
const BASE_URL = 'https://your-domain.com/api';
```

**文件 2**：`miniprogram/pages/admin/index.js`

```js
// 修改前
const BASE_URL = 'http://192.168.0.22:5100';

// 修改后
const BASE_URL = 'https://your-domain.com/api';
```

> 📌 修改后需要在微信开发者工具重新上传并发布小程序版本。同时在微信公众平台的**服务器域名**白名单中添加 `https://your-domain.com`。

---

## 13. 验证部署

### 13.1 检查各组件状态

```bash
# PM2 进程状态
pm2 status

# Nginx 状态
sudo systemctl status nginx

# 端口监听情况
ss -tlnp | grep -E '80|443|5100'
```

### 13.2 API 连通性测试

```bash
# 测试 API 是否正常响应（替换域名）
curl https://your-domain.com/api/counselors

# 预期返回：{"data":[...]}
```

### 13.3 浏览器验证

1. 访问 `https://your-domain.com`，应显示管理后台登录页
2. 使用账号 `admin` / `Password1234` 登录
3. 验证各功能页面（咨询师、房间、定期预约、导入、报表）

### 13.4 查看服务日志

```bash
# 实时查看 Node.js 日志
pm2 logs booking-server --lines 50

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 14. 日常维护命令

### 代码更新

```bash
cd /app

# 拉取最新代码
git pull

# 重新安装依赖（如有变动）
cd server && npm install --omit=dev && cd ..

# 重新构建管理后台
cd admin && npm install && npm run build && cd ..

# 重启 Node.js 服务
pm2 restart booking-server

# 重载 Nginx（配置变更时）
sudo nginx -t && sudo systemctl reload nginx
```

### 数据库备份

```bash
# 手动备份
cp /app/server/data/database.sqlite \
   /app/server/data/database.sqlite.bak.$(date +%Y%m%d_%H%M%S)

# 设置定时备份（每天凌晨 2 点）
(crontab -l 2>/dev/null; echo "0 2 * * * cp /app/server/data/database.sqlite /app/server/data/database.sqlite.bak.\$(date +\%Y\%m\%d) 2>&1") | crontab -

# 查看备份列表
ls -lh /app/server/data/database.sqlite*
```

### PM2 常用命令

```bash
pm2 status                      # 查看进程状态
pm2 logs booking-server         # 实时日志
pm2 logs booking-server --lines 100  # 最近 100 行
pm2 restart booking-server      # 重启
pm2 stop booking-server         # 停止
pm2 delete booking-server       # 删除进程
pm2 monit                       # 可视化监控面板
```

### 修改管理员密码

在服务器上执行 Node.js 脚本：

```bash
node -e "
const bcrypt = require('bcryptjs');
const { AdminUser } = require('/app/server/models/init');
const hash = bcrypt.hashSync('新密码', 10);
AdminUser.update({ password_hash: hash }, { where: { username: 'admin' }})
  .then(() => { console.log('密码已更新'); process.exit(0); });
"
```

### 修改 Session 有效期

```bash
node -e "
const { SystemConfig } = require('/app/server/models/init');
// 修改为 7200 秒（2小时）
SystemConfig.update({ value: '7200' }, { where: { key: 'session_ttl' }})
  .then(() => { console.log('已更新'); process.exit(0); });
"
```

---

## 15. 安全加固建议

### 15.1 立即执行

- [ ] **修改默认管理员密码**（登录后台 → 服务器执行脚本修改）
- [ ] **设置强 JWT 密钥**（`ADMIN_JWT_SECRET` 至少 32 位随机字符串）
- [ ] **限制 SSH 来源 IP**（安全组 22 端口改为你自己的 IP）
- [ ] **禁用 root SSH 登录**：编辑 `/etc/ssh/sshd_config`，设置 `PermitRootLogin no`

### 15.2 配置防火墙（UFW）

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 15.3 其他建议

- **定期更新系统**：`sudo apt update && sudo apt upgrade -y`
- **数据库定期备份**（见上方 crontab 配置）
- **日志轮转**：PM2 日志默认不限大小，建议安装 `pm2-logrotate`：
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 50M
  pm2 set pm2-logrotate:retain 7
  ```
- **HTTPS 证书续期**：Certbot 已自动配置，可用 `sudo certbot renew --dry-run` 验证
- **考虑迁移到 PostgreSQL**：SQLite 适合中小规模，如并发量增大可迁移到 PostgreSQL

---

## 附录：目录结构说明

```
/app/
├── server/                 # Node.js 后端
│   ├── app.js
│   ├── .env                # 环境变量（chmod 600）
│   ├── data/
│   │   ├── database.sqlite # 数据库文件（重要！定期备份）
│   │   └── xls/            # Excel 上传临时目录
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── middleware/
├── admin/
│   ├── dist/               # 构建产物，由 Nginx 直接提供
│   └── src/
├── logs/                   # PM2 日志目录
│   ├── server-out.log
│   └── server-err.log
└── ecosystem.config.js     # PM2 配置
```

---

*生成时间：2026-05-04*
