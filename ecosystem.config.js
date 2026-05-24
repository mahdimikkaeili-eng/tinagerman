module.exports = {
  apps: [
    {
      name: 'tinagerman-web',
      script: 'server.js',
      cwd: '/home/tinagerman/app/.next/standalone',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      // تنظیمات ریستارت خودکار - Auto restart settings
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      // تنظیمات لاگ - Log settings
      error_file: '/home/tinagerman/logs/web-error.log',
      out_file: '/home/tinagerman/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // تنظیمات حافظه - Memory settings
      max_memory_restart: '512M',
    },
    {
      name: 'tinagerman-chat',
      script: 'index.ts',
      cwd: '/home/tinagerman/app/mini-services/chat-service',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      // تنظیمات ریستارت خودکار
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      // تنظیمات لاگ
      error_file: '/home/tinagerman/logs/chat-error.log',
      out_file: '/home/tinagerman/logs/chat-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // تنظیمات حافظه
      max_memory_restart: '256M',
    },
  ],
};
