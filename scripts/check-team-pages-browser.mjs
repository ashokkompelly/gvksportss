import { randomUUID } from 'node:crypto'; // End-to-end CMS check against an isolated database; never edits the working site's data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import express from 'express';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gvk-cms-browser-'));
process.env.MONGODB_DATABASE = 'gvk_test_' + randomUUID().replaceAll('-', '').slice(0, 24);
process.env.NODE_ENV = 'test';
const { app } = await import('../apps/api/src/app.js');
const { store } = await import('../apps/api/src/db/index.js');
const { hashPassword } = await import('../apps/api/src/modules/auth.js');
await store.insert('users', {
  name: 'CMS Browser Test',
  email: 'cms-browser@example.com',
  password: await hashPassword('temporary-cms-browser-password'),
  role: 'admin',
});
app.use(express.static(path.resolve('apps/web/dist')));
app.get('/{*path}', (req, res) => res.sendFile(path.resolve('apps/web/dist/index.html')));
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const executable =
  process.env.CMS_TEST_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = spawn(
  executable,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--in-process-gpu',
    '--remote-debugging-port=0',
    '--user-data-dir=' + path.join(temp, 'browser'),
    '--no-first-run',
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
let ws;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const portFile = path.join(temp, 'browser', 'DevToolsActivePort');
  for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt++) await wait(100);
  assert.ok(fs.existsSync(portFile), 'Browser started');
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?${origin}`, { method: 'PUT' })
  ).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', (event) => {
    const m = JSON.parse(event.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.id) {
      pending.get(m.id)?.(m);
      pending.delete(m.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, (m) => (m.error ? reject(m.error) : resolve(m.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails)
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const until = async (expression) => {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (await evaluate(expression)) return;
      await wait(100);
    }
    throw new Error('Timed out: ' + expression);
  };
  const navigate = async (route) => {
    await send('Page.navigate', { url: origin + route });
    await until('!!document.querySelector("main")');
  };
  const tab = async (label) => {
    await evaluate(
      'Array.from(document.querySelectorAll(".admin-nav button")).find(b=>b.textContent.trim()===' +
        JSON.stringify(label) +
        ').click()',
    );
    await until('!!document.querySelector(".admin-main h2")');
    await wait(150);
  };
  const click = async (text, scope = '.admin-main') => {
    await evaluate(
      'Array.from(document.querySelector(' +
        JSON.stringify(scope) +
        ').querySelectorAll("button")).find(b=>b.textContent.trim()===' +
        JSON.stringify(text) +
        ').click()',
    );
    await wait(80);
  };
  const fieldHelpers =
    'const form=document.querySelector(".admin-modal[open] form");const field=(label)=>Array.from(form.querySelectorAll("label.field")).find(node=>node.querySelector("span")?.textContent.trim()===label)?.querySelector("input,textarea,select");const set=(node,value)=>{const proto=node.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:node.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(node,value);node.dispatchEvent(new Event("input",{bubbles:true}));node.dispatchEvent(new Event("change",{bubbles:true}));};';
  const change = async (code) => {
    await evaluate('(()=>{' + fieldHelpers + code + '})()');
    await wait(60);
  };
  const fill = (label, value) =>
    change('set(field(' + JSON.stringify(label) + '),' + JSON.stringify(value) + ');');
  const save = async () => {
    await evaluate('document.querySelector(".admin-modal[open] form").requestSubmit()');
    await until('!document.querySelector(".admin-modal[open]")');
    await until('!!document.querySelector(".toast-success")');
  };
  await until('location.origin === ' + JSON.stringify(origin));
  await evaluate('sessionStorage.setItem("gvk-launch-seen-v1","yes")');
  assert.equal(
    await evaluate(
      '(async ()=>(await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"cms-browser@example.com",password:"temporary-cms-browser-password"})})).status)()',
    ),
    200,
  );
  await navigate('/admin');
  await until('!!document.querySelector(".admin-nav")');
  await tab('Team members');
  await until('document.querySelectorAll(".admin-main .visual-editable").length === 5');
  await evaluate('document.querySelector(".admin-main .visual-toolbar button").click()');
  await until('!!document.querySelector(".admin-modal[open]")');
  await fill('Full name', 'Browser Edited Profile');
  await save();
  await until(
    'document.querySelector(".admin-main").textContent.includes("Browser Edited Profile")',
  );
  await click('Move down');
  await until(
    'document.querySelectorAll(".admin-main .visual-editable")[1].textContent.includes("Browser Edited Profile")',
  );
  await navigate('/about');
  await until('document.querySelector("main").textContent.includes("Browser Edited Profile")');
  assert.equal(await evaluate('document.querySelectorAll(".coach-card").length'), 5);
  await navigate('/admin');
  await until('!!document.querySelector(".admin-nav")');
  await tab('Team members');
  await until('document.querySelectorAll(".admin-main .visual-editable").length === 5');
  await evaluate(
    'Array.from(document.querySelectorAll(".admin-main .visual-editable")).find(card=>card.textContent.includes("Browser Edited Profile")).querySelectorAll(".visual-item-actions button")[2].click()',
  );
  await until(
    'Array.from(document.querySelectorAll(".admin-main .visual-editable")).find(card=>card.textContent.includes("Browser Edited Profile")).querySelector(".badge").textContent === "Hidden"',
  );
  await tab('Contact page');
  await click('Edit page settings');
  await fill('Title', 'Browser Contact Heading');
  await save();
  await tab('Gallery page');
  await click('Edit page settings');
  await fill('Title', 'Browser Gallery Heading');
  await save();
  await navigate('/contact');
  await until('document.querySelector("h1")?.textContent === "Browser Contact Heading"');
  assert.ok(await evaluate('document.querySelector("main a[href^=mailto]") !== null'));
  await navigate('/gallery');
  await until('document.querySelector("h1")?.textContent === "Browser Gallery Heading"');
  await navigate('/about');
  await until('document.querySelectorAll(".coach-card").length === 4');
  assert.equal(
    await evaluate('document.querySelector("main").textContent.includes("Browser Edited Profile")'),
    false,
  );
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate('/admin');
  await until('!!document.querySelector(".admin-nav")');
  await tab('Team members');
  await until('document.querySelectorAll(".admin-main .visual-editable").length === 5');
  await evaluate('document.querySelector(".admin-main .visual-toolbar button").click()');
  await until('!!document.querySelector(".admin-modal[open]")');
  assert.equal(
    await evaluate(
      'document.querySelector(".admin-modal").scrollWidth > document.querySelector(".admin-modal").clientWidth',
    ),
    false,
  );
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log(
    'PASS: Team editing, ordering, hiding, public profiles, Contact/Gallery edits, and mobile editor layout.',
  );
  await send('Browser.close');
  ws.close();
} finally {
  ws?.close();
  if (browser.exitCode === null) {
    browser.kill();
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), wait(1500)]);
  }
  await new Promise((resolve) => server.close(resolve));
  await store.database.dropDatabase();
  await store.close();
  assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
