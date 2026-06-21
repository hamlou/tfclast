import { Client } from 'ssh2';
import fs from 'fs';

const conn = new Client();

const VPS_IP = '62.171.159.136';
const VPS_USER = 'root';
const VPS_PASS = 'Yahya2026';

const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('close', (code, signal) => {
                resolve({ code, output });
            }).on('data', (data) => {
                process.stdout.write(data);
                output += data;
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
                output += data;
            });
        });
    });
};

const uploadFile = (localPath, remotePath) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
};

const downloadFile = (remotePath, localPath) => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.fastGet(remotePath, localPath, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
};

conn.on('ready', async () => {
    console.log('Connected to VPS.');
    try {
        console.log('Uploading tiny 6MB tfc-mobile.tar...');
        await uploadFile('../tfc-mobile.tar', '/root/tfc-mobile.tar');

        console.log('Setting up Android SDK...');
        await runCommand(`
            mkdir -p /opt/android-sdk/cmdline-tools &&
            wget -qO cmdline.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip &&
            unzip -q -o cmdline.zip -d /opt/android-sdk/cmdline-tools &&
            rm -rf /opt/android-sdk/cmdline-tools/latest &&
            mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest &&
            yes | /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses &&
            /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
        `);

        console.log('Extracting and building Android app...');
        await runCommand(`
            rm -rf /root/tfc-mobile &&
            tar -xf /root/tfc-mobile.tar -C /root &&
            cd /root/tfc-mobile &&
            npm install --legacy-peer-deps &&
            npm run build &&
            npx cap sync android &&
            export ANDROID_HOME=/opt/android-sdk &&
            cd android &&
            chmod +x ./gradlew &&
            ./gradlew assembleRelease &&
            ./gradlew bundleRelease
        `);

        console.log('Downloading APK...');
        await downloadFile('/root/tfc-mobile/android/app/build/outputs/apk/release/app-release.apk', './app-release.apk');
        console.log('Downloading AAB...');
        await downloadFile('/root/tfc-mobile/android/app/build/outputs/bundle/release/app-release.aab', './app-release.aab');

        console.log('All done successfully!');
    } catch (e) {
        console.error('Error:', e);
    }
    conn.end();
}).connect({
    host: VPS_IP,
    port: 22,
    username: VPS_USER,
    password: VPS_PASS,
    readyTimeout: 99999
});
