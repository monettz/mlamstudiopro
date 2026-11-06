// Asks for the Supabase database password and writes it into DATABASE_URL in
// .env.local, URL-encoding characters such as @ that would break the string.
// On Windows a small password window opens (typing shows dots); elsewhere the
// terminal asks and shows * per character. The password is never printed.
// Usage: npm run db:password
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const file = '.env.local';
if (!existsSync(file)) throw new Error('.env.local not found. Run this from the project folder.');
const text = readFileSync(file, 'utf8');
const line = text.split(/\r?\n/).find(entry => entry.startsWith('DATABASE_URL='));
if (!line || !line.startsWith('DATABASE_URL=postgresql://')) throw new Error('Paste the Session pooler connection string into DATABASE_URL in .env.local first.');

// Windows Forms dialog with a masked field; prints the password to stdout only.
const dialog = `
Add-Type -AssemblyName System.Windows.Forms
$f = New-Object Windows.Forms.Form
$f.Text = 'MLAM - Supabase database password'; $f.Width = 420; $f.Height = 180; $f.StartPosition = 'CenterScreen'; $f.TopMost = $true
$l = New-Object Windows.Forms.Label; $l.Text = 'Type the database password, then press Save:'; $l.Left = 16; $l.Top = 16; $l.Width = 380
$t = New-Object Windows.Forms.TextBox; $t.UseSystemPasswordChar = $true; $t.Left = 16; $t.Top = 44; $t.Width = 370
$b = New-Object Windows.Forms.Button; $b.Text = 'Save'; $b.Left = 296; $b.Top = 80; $b.Width = 90; $b.DialogResult = 'OK'
$f.Controls.AddRange(@($l, $t, $b)); $f.AcceptButton = $b
if ($f.ShowDialog() -eq 'OK') { [Console]::Out.Write($t.Text) }
`;

function askWithWindow() {
  const result = spawnSync('powershell.exe', ['-NoProfile', '-STA', '-Command', dialog], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout : null;
}

function askInTerminal() {
  return new Promise(resolve => {
    process.stdout.write('Database password: ');
    let value = '';
    process.stdin.setRawMode?.(true); process.stdin.resume(); process.stdin.setEncoding('utf8');
    process.stdin.on('data', key => {
      for (const ch of key) {
        if (ch === '\r' || ch === '\n') { process.stdin.setRawMode?.(false); process.stdin.pause(); process.stdout.write('\n'); resolve(value); return; }
        if (ch === '\u0003') process.exit(1);
        if (ch === '\u007f' || ch === '\b') { if (value) { value = value.slice(0, -1); process.stdout.write('\b \b'); } continue; }
        value += ch; process.stdout.write('*');
      }
    });
  });
}

console.log(process.platform === 'win32' ? 'A password window is opening. Type the password there and press Save.' : '');
const password = ((process.platform === 'win32' ? askWithWindow() : null) ?? await askInTerminal()).trim();
if (!password) { console.log('No password entered. Nothing was changed.'); process.exit(1); }

const url = new URL(line.slice('DATABASE_URL='.length));
url.password = encodeURIComponent(password);
const updated = text.replace(line, `DATABASE_URL=${url.protocol}//${url.username}:${url.password}@${url.host}${url.pathname}`);
writeFileSync(file, updated);
console.log('Saved. DATABASE_URL in .env.local now has your password.');
