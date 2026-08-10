/**
 * NurseFlow Multi-Device Sync Engine
 * Automatically tracks, tags commits, pulls, and pushes based on computer hostname.
 * Works seamlessly for switching between Office and Home computers.
 */

import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

const mode = process.argv[2] || 'push'; // 'push', 'pull', or 'status'
const userNote = process.argv.slice(3).join(' ') || 'Work session update';

const hostname = os.hostname();
const now = new Date();
const formattedTime = now.toISOString().replace('T', ' ').slice(0, 19);

const run = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return err.stdout || err.stderr || err.message;
  }
};

const updateDeviceLog = (commitMessage) => {
  const logPath = path.join(process.cwd(), 'docs', 'device_sync_log.md');
  const logEntry = `| ${formattedTime} | \`${hostname}\` | ${commitMessage} |\n`;

  if (!fs.existsSync(logPath)) {
    const header = `# 🖥️ NurseFlow Multi-Device Sync Audit Log\n\n| Timestamp (UTC) | Device Hostname | Commit Note |\n|---|---|---|\n`;
    fs.writeFileSync(logPath, header + logEntry, 'utf-8');
  } else {
    fs.appendFileSync(logPath, logEntry, 'utf-8');
  }
};

console.log(`\n==================================================`);
console.log(`🖥️  NURSEFLOW DEVICE SYNC ENGINE`);
console.log(`📍 Device Hostname : ${hostname}`);
console.log(`⏰ Time (UTC)      : ${formattedTime}`);
console.log(`🔄 Mode            : ${mode.toUpperCase()}`);
console.log(`==================================================\n`);

if (mode === 'push') {
  const statusOutput = run('git status --porcelain');
  
  if (!statusOutput) {
    console.log(`✨ Working tree is clean. No uncommitted changes on ${hostname}.`);
    console.log(`🚀 Triggering push to remote...`);
    const pushRes = run('git push origin main');
    console.log(pushRes || 'Remote up to date.');
  } else {
    const commitMsg = `sync(${hostname}): ${userNote} [${formattedTime}]`;
    console.log(`📦 Staging changes on ${hostname}...`);
    
    // Update local device log file
    updateDeviceLog(commitMsg);

    run('git add -A');
    console.log(`📝 Committing: "${commitMsg}"...`);
    const commitRes = run(`git commit -m "${commitMsg}"`);
    console.log(commitRes);

    console.log(`🌐 Pushing to GitHub (origin/main)...`);
    const pushRes = run('git push origin main');
    console.log(pushRes);

    console.log(`\n✅ BERHASIL SYNC & PUSH KE GITHUB DARI KELOMPOK DEVICE: ${hostname}!`);
  }
} else if (mode === 'pull') {
  console.log(`📥 Fetching & Pulling latest updates from GitHub...`);
  const pullRes = run('git pull origin main');
  console.log(pullRes);
  console.log(`\n✅ BERHASIL MENTARIK UPDATE TERBARU DI DEVICE: ${hostname}!`);
} else if (mode === 'status') {
  const branch = run('git branch --show-current');
  const recentLogs = run('git log -n 5 --oneline');
  console.log(`🌿 Active Branch: ${branch}`);
  console.log(`\n📜 Recent Device Commits:`);
  console.log(recentLogs);
}
