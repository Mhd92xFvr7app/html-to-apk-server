const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    const appName = req.body.appName || 'MyApp';
    const pkgId = req.body.pkgId || 'com.example.app';
    const filePath = req.file.path;
    const workDir = `/tmp/build_${Date.now()}`;

    fs.mkdirSync(`${workDir}/www`, { recursive: true });

    if (req.file.originalname.endsWith('.zip')) {
      execSync(`unzip ${filePath} -d ${workDir}/www`);
    } else {
      fs.copyFileSync(filePath, `${workDir}/www/index.html`);
    }

    process.chdir(workDir);
    execSync('npm init -y');
    execSync('npm install @capacitor/core @capacitor/android @capacitor/cli');
    execSync(`npx cap init "${appName}" "${pkgId}" --web-dir www`);
    execSync('npx cap add android');
    execSync('npx cap sync');
    execSync('cd android && ./gradlew assembleDebug');

    const apkPath = `${workDir}/android/app/build/outputs/apk/debug/app-debug.apk`;
    res.download(apkPath, `${appName}.apk`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
