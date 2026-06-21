const fs = require('fs');
let c = fs.readFileSync('server/server.js', 'utf8');
c = c.replace(
  /const allowedOrigins = process\.env\.NODE_ENV === 'production'[\s\S]*?process\.env\.FRONTEND_URL\]\.filter\(Boolean\);/,
  `const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://tfc-event.com', 'https://tfc.events', 'http://localhost', 'capacitor://localhost'].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost', 'capacitor://localhost', process.env.FRONTEND_URL].filter(Boolean);`
);
fs.writeFileSync('server/server.js', c);
console.log('CORS updated.');
