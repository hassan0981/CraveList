import fs from 'fs';
import path from 'path';

// Auto-load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim();
      process.env[k] = v;
    }
  }
}

import { resendService } from '../src/services/resendService';

async function runWelcomeEmailSend() {
  console.log('Sending live Welcome Email to Hassan via Resend...');

  const res1 = await resendService.sendWelcomeEmail('has.javed25@gmail.com', 'Hassan');
  console.log('Send to has.javed25@gmail.com result:', res1);

  const res2 = await resendService.sendWelcomeEmail('hass.javed25@gmail.com', 'Hassan Javed');
  console.log('Send to hass.javed25@gmail.com result:', res2);
}

runWelcomeEmailSend();
