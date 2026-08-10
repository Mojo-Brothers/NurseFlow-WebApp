/**
 * NurseFlow Multi-Device Sync Engine (Enhanced Device Indicator)
 * Automatically tracks, tags commits, pulls, and pushes based on computer hostname.
 * Identifies source device on pull so you know exactly which computer pushed the update.
 */

import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

const mode = process.argv[2] || 'push'; // 'push', 'pull', or 'status'
const userNote = process.argv.slice(3).join(' ') || 'Work session update';

const currentHostname = os.hostname();
const now = new Date();
const formattedTime = now.toISOString().replace('T', ' ').slice(0, 19);

const run = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return err.stdout || err.stderr || err.message;
  }
};

const parseDeviceFromCommit = (commitSubject) => {
  const match = commitSubject.match(/^sync\(([^)]+)\):/i);
  return match ? match[1] : 'Unknown Device';
};

const updateDeviceLog = (commitMessage) => {
  const logPath = path.join(process.cwd(), 'docs', 'device_sync_log.md');
  const logEntry = `| ${formattedTime} | \`${currentHostname}\` | ${commitMessage} |\n`;

  if (!fs.existsSync(logPath)) {
    const header = `# 🖥️ NurseFlow Multi-Device Sync Audit Log\n\n| Timestamp (UTC) | Device Hostname | Commit Note |\n|---|---|---|\n`;
    fs.writeFileSync(logPath, header + logEntry, 'utf-8');
  } else {
    fs.appendFileSync(logPath, logEntry, 'utf-8');
  }
};

console.log(`\n================================================================`);
console.log(`🖥️  NURSEFLOW DEVICE SYNC ENGINE`);
console.log(`📍 Device Anda Saat Ini : ${currentHostname}`);
console.log(`⏰ Waktu Sesi (UTC)      : ${formattedTime}`);
console.log(`🔄 Mode Akses            : ${mode.toUpperCase()}`);
console.log(`================================================================\n`);

if (mode === 'push') {
  const statusOutput = run('git status --porcelain');
  
  if (!statusOutput) {
    console.log(`✨ Tidak ada perubahan baru yang perlu di-commit di ${currentHostname}.`);
    console.log(`🚀 Mendorong commit ke remote GitHub...`);
    const pushRes = run('git push origin main');
    console.log(pushRes || 'Remote sudah yang terbaru.');
  } else {
    const commitMsg = `sync(${currentHostname}): ${userNote} [${formattedTime}]`;
    console.log(`📦 Mengumpulkan perubahan file di peranti: ${currentHostname}...`);
    
    // Update local device log file
    updateDeviceLog(commitMsg);

    run('git add -A');
    console.log(`📝 Membuat Commit: "${commitMsg}"...`);
    const commitRes = run(`git commit -m "${commitMsg}"`);
    console.log(commitRes);

    console.log(`🌐 Mengunggah ke GitHub (origin/main)...`);
    const pushRes = run('git push origin main');
    console.log(pushRes);

    console.log(`\n✅ BERHASIL DI-PUSH DARI DEVICE: [ ${currentHostname} ]`);
  }
} else if (mode === 'pull') {
  console.log(`🔎 Memeriksa update terbaru dari GitHub Remote (origin/main)...`);
  run('git fetch origin');

  const remoteLatestSubject = run('git log origin/main -n 1 --pretty=format:"%s"');
  const remoteLatestAuthor = run('git log origin/main -n 1 --pretty=format:"%an"');
  const remoteLatestDate = run('git log origin/main -n 1 --pretty=format:"%cd"');
  const remoteLatestHash = run('git log origin/main -n 1 --pretty=format:"%h"');
  
  const sourceDevice = parseDeviceFromCommit(remoteLatestSubject);

  console.log(`\n----------------------------------------------------------------`);
  console.log(`📢 INDIKATOR UPDATE DEVICE ASAL:`);
  console.log(`💻 Peranti Pengirim (Komputer Asal) : [ ${sourceDevice} ]`);
  console.log(`🔑 Commit Hash                     : ${remoteLatestHash}`);
  console.log(`📝 Pesan Commit                    : ${remoteLatestSubject}`);
  console.log(`📅 Waktu Di-Push                   : ${remoteLatestDate}`);
  
  if (sourceDevice === currentHostname) {
    console.log(`ℹ️  Catatan: Commit terakhir di remote dibuat oleh KOMPUTER INI JUGA (${currentHostname}).`);
  } else {
    console.log(`🚀 Menarik update yang dikerjakan dari KOMPUTER LAIN (${sourceDevice}) ke komputer ini (${currentHostname})...`);
  }
  console.log(`----------------------------------------------------------------\n`);

  const pullRes = run('git pull origin main');
  console.log(pullRes);
  console.log(`\n✅ SUKSES MERESET & MENARIK UPDATE DARI DEVICE [ ${sourceDevice} ] KE [ ${currentHostname} ]!`);

} else if (mode === 'status') {
  const branch = run('git branch --show-current');
  const remoteLatestSubject = run('git log origin/main -n 1 --pretty=format:"%s"');
  const sourceDevice = parseDeviceFromCommit(remoteLatestSubject);

  console.log(`🌿 Active Branch         : ${branch}`);
  console.log(`💻 Device Terakhir Sync  : [ ${sourceDevice} ]`);
  console.log(`\n📜 Riwayat Commit Peranti Terakhir:`);
  const recentLogs = run('git log -n 5 --oneline');
  console.log(recentLogs);
}
