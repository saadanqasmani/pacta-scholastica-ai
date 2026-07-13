import { chromium } from 'playwright-core';

const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage();
const fails = [];
const check = (name, cond, extra='') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${extra}`); if (!cond) fails.push(name); };

// 1. Auth + signup
await page.goto(base + '/', { waitUntil: 'networkidle' });
check('redirect-to-auth', page.url().includes('/auth'));
await page.getByRole('tab', { name: /sign ?up/i }).click();
await page.fill('#signup-name', 'Saadan Qasmani');
await page.fill('#signup-email', 'saadan@demo.local');
await page.fill('#signup-password', 'demo12345');
await page.fill('#signup-confirm', 'demo12345');
await page.click('[role="tabpanel"][data-state="active"] button[type="submit"]');
await page.waitForURL('**/register-university', { timeout: 15000 }).catch(() => {});
check('signup-navigates', page.url().includes('/register-university'));

// 2. Link account to home university, reload as registered user
await page.evaluate(async () => {
  await new Promise((resolve, reject) => {
    const req = indexedDB.open('iris-local-db');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('profiles', 'readwrite');
      const st = tx.objectStore('profiles');
      st.getAll().onsuccess = (e) => {
        const rows = e.target.result;
        rows[0].university_id = '54dfc8d0-8e29-4ef8-ace4-147df5c9557d';
        st.put(rows[0]).onsuccess = () => resolve();
      };
    };
    req.onerror = reject;
  });
});
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// 3. Dashboard shows LIVING demo data
const body = await page.textContent('body');
check('dashboard-loads', body.includes('IMG/IPI'));
const activeMatch = await page.locator('text=Active Partnerships').first().isVisible();
check('active-partnerships-visible', activeMatch);
const zeros = /Active Partnerships\s*0\b/.test(body.replace(/\n/g, ' '));
check('active-partnerships-nonzero', !zeros, '(demo MOUs counted)');
check('mobility-nonzero', !/0 in \/ 0 out/.test(body));

// 4. University registry seeded with internationals
const uniCount = await page.evaluate(() => new Promise((resolve) => {
  const req = indexedDB.open('iris-local-db');
  req.onsuccess = () => {
    const tx = req.result.transaction('universities');
    tx.objectStore('universities').count().onsuccess = (e) => resolve(e.target.result);
  };
}));
check('universities-seeded', uniCount === 79, `(count=${uniCount}, expect 51 TR + 28 intl)`);
const assessCount = await page.evaluate(() => new Promise((resolve) => {
  const req = indexedDB.open('iris-local-db');
  req.onsuccess = () => {
    const tx = req.result.transaction('img_ipi_assessments');
    tx.objectStore('img_ipi_assessments').count().onsuccess = (e) => resolve(e.target.result);
  };
}));
check('assessments-seeded', assessCount === 79, `(count=${assessCount})`);

// 5. Dashboard IMG/IPI card shows the seeded baseline (not the CTA)
check('imgipi-card-has-scores', /IMG · (Low|Moderate|High|Critical)/.test(body));

// 6. Diagnostics: history shows seeded assessment; open it; forecast renders
await page.goto(base + '/diagnostics', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByRole('tab', { name: /history/i }).click();
await page.waitForTimeout(800);
const histBody = await page.textContent('body');
check('history-has-baseline', /History \(1\)/.test(histBody) || /IMG 0\./.test(histBody));
await page.getByRole('button', { name: /^view$/i }).first().click();
await page.waitForTimeout(1200);
const resBody = await page.textContent('body');
check('results-render', /Institutional profile/.test(resBody));
check('forecast-renders', /Intervention forecast/.test(resBody));
check('forecast-combined', /All interventions combined/.test(resBody));

// 7. PDF export triggers a download
const dl = page.waitForEvent('download', { timeout: 20000 });
await page.getByRole('button', { name: /export report/i }).click();
const download = await dl.catch(() => null);
check('pdf-downloads', !!download, download ? `(${download.suggestedFilename()})` : '');
if (download) {
  const path = await download.path();
  const fs = await import('node:fs');
  const head = fs.readFileSync(path).subarray(0, 5).toString();
  check('pdf-valid', head.startsWith('%PDF-'), `(size=${fs.statSync(path).size}b)`);
}

// 8. Ask AI answers offline with demo data
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.locator('button.fixed.bottom-6').click();
await page.waitForTimeout(600);
await page.fill('input[placeholder*="uestion"]', 'How many MOUs do we have and what does our IMG assessment say?');
await page.keyboard.press('Enter');
await page.waitForTimeout(5000);
const chatBody = await page.textContent('body');
check('askai-mou-count', /MOU status for/.test(chatBody));
check('askai-imgipi', /Latest IMG\/IPI assessment/.test(chatBody));
check('askai-engine-tag', /built-in engine/.test(chatBody));

// 9. Partner recommendations page (engine, gap-conditioned)
await page.goto(base + '/partners', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByRole('tab', { name: /ai recommended/i }).click();
await page.waitForTimeout(2000);
const genBtn = page.getByRole('button', { name: /generate/i }).first();
if (await genBtn.isVisible().catch(() => false)) await genBtn.click();
await page.waitForTimeout(9000);
const partBody = await page.textContent('body');
check('partners-page', /Partner Discovery/.test(partBody));
check('recommendations-appear', /AI-recommended partners/i.test(partBody) && /Initiate MOU/.test(partBody));

// ---- Entry creation, persistence and diagnosis (full-section sweep) --------

// Library pre-loaded with handbooks + per-university briefs
const docCount = await page.evaluate(() => new Promise((resolve) => {
  const req = indexedDB.open('iris-local-db');
  req.onsuccess = () => { const tx = req.result.transaction('library_documents');
    tx.objectStore('library_documents').count().onsuccess = (e) => resolve(e.target.result); };
}));
check('library-preloaded', docCount >= 82, `(docs=${docCount}, expect 3 handbooks + 79 briefs)`);

// Add University via the real form
await page.goto(base + '/add-university', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.fill('input[placeholder*="Example University"]', 'E2E Test University');
await page.getByRole('button', { name: /add university/i }).click();
await page.waitForTimeout(2000);
const uniAdded = await page.evaluate(() => new Promise((resolve) => {
  const req = indexedDB.open('iris-local-db');
  req.onsuccess = () => { const tx = req.result.transaction('universities');
    tx.objectStore('universities').getAll().onsuccess = (e) =>
      resolve(e.target.result.some((u) => u.name === 'E2E Test University')); };
}));
check('add-university-persists', uniAdded === true);

// Run a diagnosis through the UI (worked example -> calculate -> saved)
await page.goto(base + '/diagnostics', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByRole('button', { name: /load worked example/i }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /calculate img/i }).click();
await page.waitForTimeout(1500);
const resBody2 = await page.textContent('body');
check('diagnosis-runs', /0\.689/.test(resBody2), '(Institution A IMG)');
await page.getByRole('tab', { name: /history/i }).click();
await page.waitForTimeout(600);
check('diagnosis-saved', /History \(2\)/.test(await page.textContent('body')));

// Upload a document to the Data Library through the real file input
await page.goto(base + '/library', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.getByRole('tab', { name: /documents/i }).click();
await page.waitForTimeout(600);
await page.setInputFiles('input[type="file"]', {
  name: 'e2e-note.txt', mimeType: 'text/plain',
  buffer: Buffer.from('The E2E verification codeword is zephyr-42. Nomination deadline for the test partner is 1 December.'),
});
await page.waitForTimeout(2000);
await page.getByRole('tab', { name: /ask the library/i }).click();
await page.fill('input[placeholder*="e.g."]', 'what is the verification codeword?');
await page.keyboard.press('Enter');
await page.waitForTimeout(1500);
check('library-upload-searchable', /zephyr-42/.test(await page.textContent('body')));

// Everything persists across a full reload
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const persist = await page.evaluate(() => new Promise((resolve) => {
  const req = indexedDB.open('iris-local-db');
  req.onsuccess = () => {
    const db = req.result; const out = {};
    const tx = db.transaction(['universities', 'img_ipi_assessments', 'library_documents']);
    tx.objectStore('universities').count().onsuccess = (e) => (out.u = e.target.result);
    tx.objectStore('img_ipi_assessments').count().onsuccess = (e) => (out.a = e.target.result);
    tx.objectStore('library_documents').count().onsuccess = (e) => (out.d = e.target.result);
    tx.oncomplete = () => resolve(out);
  };
}));
check('persistence-after-reload', persist.u >= 80 && persist.a >= 80 && persist.d >= 83, JSON.stringify(persist));
check('agenda-card-renders', /Automated agenda/.test(await page.textContent('body')));

// RBAC: a SECOND account must be university-scoped (no switcher)
await page.evaluate(() => localStorage.removeItem('iris-auth-session'));
await page.goto(base + '/auth', { waitUntil: 'networkidle' });
await page.getByRole('tab', { name: /sign ?up/i }).click();
await page.fill('#signup-name', 'University User');
await page.fill('#signup-email', 'uni@warsaw.local');
await page.fill('#signup-password', 'demo12345');
await page.fill('#signup-confirm', 'demo12345');
await page.click('[role="tabpanel"][data-state="active"] button[type="submit"]');
await page.waitForURL('**/register-university', { timeout: 15000 });
await page.evaluate(async () => new Promise((resolve) => {
  const req = indexedDB.open('iris-local-db');
  req.onsuccess = () => {
    const tx = req.result.transaction('profiles', 'readwrite'); const st = tx.objectStore('profiles');
    st.getAll().onsuccess = (e) => {
      const rows = e.target.result;
      const me = rows.find((r) => r.email === 'uni@warsaw.local');
      me.university_id = 'int-warsaw';
      st.put(me).onsuccess = () => resolve();
    };
  };
}));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const rbac = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('header button')];
  return {
    hasSwitcher: btns.some((b) => b.textContent.includes('Viewing as')),
    shows: document.querySelector('header')?.innerText.includes('Warsaw'),
  };
});
check('rbac-university-locked', rbac.hasSwitcher === false && rbac.shows === true, JSON.stringify(rbac));

console.log(fails.length === 0 ? 'ALL_PASS' : 'FAILURES: ' + fails.join(', '));
await browser.close();
process.exit(fails.length === 0 ? 0 : 1);
