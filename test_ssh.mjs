import { Client } from 'ssh2';
import fs from 'fs';

const conn = new Client();
const config = {
    host: '62.171.159.136',
    port: 22,
    username: 'root',
    password: 'Yahya2026',
    readyTimeout: 10000,
};

console.log('Testing SSH connection to VPS...');

conn.on('ready', () => {
    console.log('Connected successfully!');
    conn.exec('echo "VPS is alive!"', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            console.log('OUTPUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect(config);
