const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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

    const opts = { cwd: workDir, stdio: 'pipe', timeout: 300000 };

    execSync('npm init -y', opts);
    execSync('npm install @capacitor/core @capacitor/android @capacitor/cli', opts);
    execSync(`npx cap init "${appName}" "${pkgId}" --web-dir www`, opts);
    execSync('npx cap add android', opts);
    execSync('npx cap sync', opts);

    const gradleProps = `${workDir}/android/gradle.properties`;
    let propsContent = fs.readFileSync(gradleProps, 'utf8');
    propsContent += '\norg.gradle.daemon=false\n';
    propsContent += 'org.gradle.jvmargs=-Xmx512m -XX:MaxMetaspaceSize=256m\n';
    propsContent += 'org.gradle.parallel=false\n';
    propsContent += 'org.gradle.configureondemand=false\n';
    fs.writeFileSync(gradleProps, propsContent);

    execSync('cd android && ./gradlew assembleDebug --no-daemon --max-workers=1', {
      cwd: workDir,
      stdio: 'pipe',
      timeout: 300000,
      env: {
        ...process.env,
        GRADLE_OPTS: '-Xmx512m -XX:MaxMetaspaceSize=256m'
      }
    });

    const apkPath = `${workDir}/android/app/build/outputs/apk/debug/app-debug.apk`;
    res.download(apkPath, `${appName}.apk`, () => {
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
      try { fs.unlinkSync(filePath); } catch {}
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
