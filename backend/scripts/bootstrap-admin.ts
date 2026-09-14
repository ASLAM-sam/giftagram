import { execSync } from 'node:child_process';
import path from 'node:path';
import { passwordService } from '../src/services/passwordService';
import { generateId } from '../src/utils/ids';

/**
 * Local-only Admin Bootstrap Utility for Giftagram
 * 
 * Usage:
 *   npm run bootstrap:admin -- --username=giftstudio --password=YourSecurePassword --name="Giftagram Atelier Admin" [--role=admin] [--remote]
 */
async function bootstrapAdmin() {
  const args = process.argv.slice(2);
  const argMap: Record<string, string> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        argMap[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        argMap[arg.slice(2)] = 'true';
      }
    }
  }

  const username = (argMap.username || 'giftstudio').trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || argMap.password;
  const fullName = argMap.name || 'Giftagram Atelier Admin';
  const role = argMap.role || 'admin';
  const isRemote = argMap.remote === 'true';

  if (!password || !password.trim()) {
    console.error('Error: Password is required. Provide it via --password=<password> or ADMIN_BOOTSTRAP_PASSWORD env var');
    process.exit(1);
  }

  console.log('--- GIFTAGRAM ADMIN BOOTSTRAP ---');
  console.log(`Target Username: ${username}`);
  console.log(`Full Name:       ${fullName}`);
  console.log(`Role:            ${role}`);
  console.log(`Environment:     ${isRemote ? 'REMOTE Cloud D1' : 'LOCAL D1'}`);

  // Hash password using the same WebCrypto PBKDF2-SHA256 service
  const passwordHash = await passwordService.hashPassword(password.trim());
  console.log('Password hash generated successfully using WebCrypto PBKDF2-SHA256 (prefix: pbkdf2_sha256).');

  const adminId = generateId('adm');
  const d1Flag = isRemote ? '--remote' : '--local';

  // Safely escape single quotes in SQL string
  const escapedHash = passwordHash.replace(/'/g, "''");
  const escapedName = fullName.replace(/'/g, "''");
  const escapedUsername = username.replace(/'/g, "''");

  const checkSql = `SELECT id, username, active FROM admin_users WHERE username = '${escapedUsername}';`;
  const existingOutput = execSync(`npx wrangler d1 execute DB ${d1Flag} --command "${checkSql}" --json`, {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf-8',
  });

  if (existingOutput.includes(escapedUsername)) {
    console.log(`Admin user '${username}' already exists. Updating password hash and details...`);
    const updateSql = `UPDATE admin_users SET password_hash = '${escapedHash}', full_name = '${escapedName}', role = '${role}', active = 1, updated_at = CURRENT_TIMESTAMP WHERE username = '${escapedUsername}';`;
    execSync(`npx wrangler d1 execute DB ${d1Flag} --command "${updateSql}" --json`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  } else {
    console.log(`Inserting new admin user '${username}'...`);
    const insertSql = `INSERT INTO admin_users (id, username, password_hash, full_name, role, active) VALUES ('${adminId}', '${escapedUsername}', '${escapedHash}', '${escapedName}', '${role}', 1);`;
    execSync(`npx wrangler d1 execute DB ${d1Flag} --command "${insertSql}" --json`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  }

  console.log(`✅ SUCCESS: Admin user '${username}' is active and ready in D1.`);
}

bootstrapAdmin().catch((err) => {
  console.error('Bootstrap failed:', err?.message || err);
  process.exit(1);
});
