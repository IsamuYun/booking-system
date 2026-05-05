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
      },
      // 日志
      out_file: '/app/logs/server-out.log',
      error_file: '/app/logs/server-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // 崩溃自动重启
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
