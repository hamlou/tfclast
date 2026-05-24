// PM2 Ecosystem Configuration for TFC Backend
// Usage: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'tfc-api',
      script: './server/server.js',
      cwd: '/var/www/tfc',
      instances: 'max',          // Use all available CPU cores
      exec_mode: 'cluster',      // Cluster mode for load balancing
      watch: false,              // Don't watch files in production
      max_memory_restart: '500M',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/tfc-error.log',
      out_file: '/var/log/pm2/tfc-out.log',
      merge_logs: true,
      log_file: '/var/log/pm2/tfc-combined.log',

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
