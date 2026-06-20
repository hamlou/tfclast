import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to VPS — deploying...');
  const cmd = 'cd /var/www/tfc && git pull origin master && npm run build && pm2 restart all';
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\nDeployment finished. Exit code: ${code}`);
      conn.end();
    }).on('data', (data) => process.stdout.write(data))
      .stderr.on('data', (data) => process.stderr.write(data));
  });
}).connect({ host: '62.171.159.136', port: 22, username: 'root', password: 'Yahya2026' });
