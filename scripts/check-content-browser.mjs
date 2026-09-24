// End-to-end CMS check against an isolated database; never edits the working site's data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import express from 'express';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gvk-cms-browser-'));
process.env.DATABASE_PATH = path.join(temp, 'preview.sqlite');
process.env.NODE_ENV = 'test';
const { app } = await import('../apps/api/src/app.js');
const { db } = await import('../apps/api/src/db/index.js');
const { hashPassword } = await import('../apps/api/src/modules/auth.js');
db.prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'admin')").run(
  'CMS Browser Test',
  'cms-browser@example.com',
  await hashPassword('temporary-cms-browser-password'),
);
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
  const editCard = async (path, index = 0) => {
    await evaluate(
      'document.querySelectorAll(' +
        JSON.stringify('[data-collection="' + path + '"] .visual-editable') +
        ')[' +
        index +
        '].querySelector(".visual-toolbar button").click()',
    );
    await until('!!document.querySelector(".admin-modal[open]")');
  };
  const selectImage = async (file) => {
    const { root } = await send('DOM.getDocument');
    const { nodeId } = await send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '.admin-modal[open] input[type="file"]',
    });
    assert.ok(nodeId, 'Upload control is present');
    await send('DOM.setFileInputFiles', { nodeId, files: [file] });
  };
  const uploadImage = async () => {
    const previous = await evaluate(
      'document.querySelector(".admin-modal .image-upload-preview")?.src || ""',
    );
    await selectImage(path.resolve('apps/web/public/icon-192.png'));
    await until(
      '!document.querySelector(".admin-modal [data-uploading=true]") && document.querySelector(".admin-modal .image-upload-preview")?.src.includes("/uploads/") && document.querySelector(".admin-modal .image-upload-preview").src !== ' +
        JSON.stringify(previous),
    );
    return await evaluate(
      'new URL(document.querySelector(".admin-modal .image-upload-preview").src).pathname',
    );
  };
  let acceptDialog = true;
  ws.addEventListener('message', (event) => {
    const m = JSON.parse(event.data);
    if (m.method === 'Page.javascriptDialogOpening')
      void send('Page.handleJavaScriptDialog', { accept: acceptDialog });
  });
  await until('!!document.querySelector("h1")');
  await until('!!document.querySelector(".launch-experience[open] .launch-button")');
  const checkLaunchFit = async () => {
    for (const [width, height] of [
      [320, 480],
      [390, 844],
      [568, 320],
      [844, 390],
      [768, 1024],
      [1024, 768],
      [1280, 600],
      [1920, 1080],
    ]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 1024,
      });
      await wait(80);
      const fit = await evaluate(`(() => {
        const panel = document.querySelector('.launch-content');
        const stage = document.querySelector('.launch-viewport');
        const dialog = document.querySelector('.launch-experience');
        const p = panel.getBoundingClientRect(), s = stage.getBoundingClientRect();
        const nodes = [panel, stage, dialog, document.documentElement, document.body];
        nodes.forEach(node => { node.scrollTop = 100; node.scrollLeft = 100; });
        return {
          fits: p.top >= s.top - 1 && p.bottom <= s.bottom + 1 && p.left >= s.left - 1 && p.right <= s.right + 1,
          stationary: nodes.every(node => node.scrollTop === 0 && node.scrollLeft === 0),
          offsets: nodes.map(node => [node.className, node.scrollTop, node.scrollLeft]),
          fullWidth: document.documentElement.scrollWidth === innerWidth,
        };
      })()`);
      assert.ok(
        fit.fits && fit.stationary && fit.fullWidth,
        `Launch fits without scrolling at ${width}x${height}: ${JSON.stringify(fit)}`,
      );
    }
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await wait(80);
  };
  await checkLaunchFit();
  fs.writeFileSync(
    path.join(os.tmpdir(), 'gvk-launch-desktop.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
  );
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await wait(150);
  assert.equal(
    await evaluate('document.querySelector(".launch-experience").scrollWidth>innerWidth'),
    false,
  );
  assert.ok(
    await evaluate(
      'document.querySelector(".launch-button").getBoundingClientRect().bottom<innerHeight',
    ),
  );
  assert.ok(
    await evaluate(
      'Math.abs(visualViewport.scale-1)<0.01 && document.documentElement.scrollWidth===innerWidth',
    ),
    'Launch stays full-screen without mobile zoom or overflow',
  );
  fs.writeFileSync(
    path.join(os.tmpdir(), 'gvk-launch-mobile.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
  );
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const launchedAt = await evaluate(
    '(()=>{const start=performance.now();document.querySelector(".launch-button").click();return start})()',
  );
  await until('document.querySelector(".launch-number")?.textContent==="5"');
  await checkLaunchFit();
  assert.ok(
    await evaluate(
      'Math.abs(document.querySelector(".launch-experience").getBoundingClientRect().width-innerWidth)<2',
    ),
  );
  fs.writeFileSync(
    path.join(os.tmpdir(), 'gvk-launch-countdown.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
  );
  await wait(3000);
  assert.ok(await evaluate('!!document.querySelector(".launch-countdown")'));
  await until('!!document.querySelector(".launch-phase-revealing")');
  assert.ok(
    (await evaluate('performance.now()')) - launchedAt >= 4900,
    'Five seconds before curtain rises',
  );
  await wait(950);
  fs.writeFileSync(
    path.join(os.tmpdir(), 'gvk-launch-curtain.png'),
    Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
  );
  await until('!document.querySelector(".launch-experience[open]")');
  assert.ok(await evaluate('document.activeElement===document.querySelector("main h1")'));
  await navigate('/');
  await until('!!document.querySelector("main h1")');
  assert.equal(
    await evaluate('document.querySelectorAll(".launch-experience").length'),
    0,
    'Only once per tab',
  );
  await navigate('/?launch=1');
  await until('!!document.querySelector(".launch-button")');
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await until('!document.querySelector(".launch-experience")');
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await navigate('/?launch=1');
  await until('!!document.querySelector(".launch-button")');
  assert.equal(
    await evaluate('getComputedStyle(document.querySelector(".launch-spotlight")).animationName'),
    'none',
  );
  await evaluate('document.querySelector(".launch-button").click()');
  await until('!document.querySelector(".launch-experience")');
  await send('Emulation.setEmulatedMedia', { features: [] });
  console.log(
    'PASS: Five-second launch, curtain reveal, session memory, replay, Escape and reduced motion.',
  );

  if (!process.argv.includes('--launch-only')) {
    assert.equal(
      await evaluate(
        '(async ()=>(await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"cms-browser@example.com",password:"temporary-cms-browser-password"})})).status)()',
      ),
      200,
    );
    await navigate('/admin');
    await until('!!document.querySelector(".admin-nav")');
    await tab('Home');
    await until('!!document.querySelector(".visual-page-editor")');
    await click('Edit launch screen');
    await change('field("Show this section").click();');
    await save();
    await evaluate('sessionStorage.removeItem("gvk-launch-seen-v1")');
    await navigate('/');
    await until('!!document.querySelector("main h1")');
    assert.equal(
      await evaluate('document.querySelectorAll(".launch-experience").length'),
      0,
      'Admin can disable launch',
    );
    await navigate('/admin');
    await until('!!document.querySelector(".admin-nav")');
    await tab('Home');
    await click('Edit launch screen');
    await change('field("Show this section").click();');
    await save();
    await evaluate('sessionStorage.setItem("gvk-launch-seen-v1","yes")');

    assert.equal(
      await evaluate('document.querySelectorAll(".admin-main form").length'),
      0,
      'No inline forms',
    );
    await editCard('config.hero.slides');
    await fill('Title', 'Visual editor chess headline');
    const sliderImage = await uploadImage();
    await evaluate('window.dispatchEvent(new Event("focus"))');
    await wait(150);
    assert.equal(
      await evaluate('(()=>{' + fieldHelpers + 'return field("Title").value})()'),
      'Visual editor chess headline',
    );
    // Focus remains trapped inside the native modal.
    await evaluate('document.querySelector(".admin-nav button").focus()');
    assert.ok(
      await evaluate('document.querySelector(".admin-modal").contains(document.activeElement)'),
    );
    await save();
    await wait(2200);
    assert.equal(await evaluate('document.querySelectorAll(".toast-success").length'), 0);
    await editCard('config.hero.slides');
    await fill('Title', 'Discard this headline');
    acceptDialog = false;
    await evaluate('document.querySelector(".admin-modal-heading > button").click()');
    assert.ok(await evaluate('!!document.querySelector(".admin-modal[open]")'));
    acceptDialog = true;
    await evaluate('document.querySelector(".admin-modal-heading > button").click()');
    await until('!document.querySelector(".admin-modal[open]")');
    await navigate('/');
    await until('document.querySelector("h1")?.textContent==="Visual editor chess headline"');
    assert.ok(await evaluate('!!document.querySelector(".footer-instagram-link")'));
    assert.ok(
      await evaluate(
        'Array.from(document.querySelectorAll(".hero-slider img")).some(img=>new URL(img.src).pathname===' +
          JSON.stringify(sliderImage) +
          ')',
      ),
    );
    console.log('PASS: Visual Home preview, modal save/cancel, focus trap and timed notification.');

    await navigate('/admin');
    await until('!!document.querySelector(".admin-nav")');
    await tab('About & team');
    await editCard('config.team.members');
    await fill('Full name', 'Updated Team Leader');
    const teamImage = await uploadImage();
    await change(
      'const a=Array.from(form.querySelectorAll("fieldset")).find(f=>f.querySelector(":scope > legend")?.textContent==="Achievements");set(a.querySelector("textarea"),"Achievement from visual editor");',
    );
    await save();
    await click('Add new team member');
    await fill('Full name', 'New Visual Team Member');
    await fill('Role', 'Event coordinator');
    await change('field("Published on website").click();');
    await save();
    await navigate('/about');
    await until('document.body.innerText.includes("New Visual Team Member")');
    await evaluate('document.querySelector(".achievement-toggle").click()');
    assert.ok(
      await evaluate(
        'document.querySelector("dialog[open]").innerText.includes("Achievement from visual editor")',
      ),
    );
    await evaluate('document.querySelector("dialog[open]").close()');
    console.log('PASS: Team cards and achievements save from individual modals.');

    await navigate('/admin');
    await until('!!document.querySelector(".admin-nav")');
    await tab('Coaching page');
    await click('Add new coaching card');
    await fill('Title', 'New visual coaching card');
    await fill('Sport', 'Chess');
    await uploadImage();
    await change('field("Published on website").click();');
    await save();
    await navigate('/coaching');
    await until('document.body.innerText.includes("New visual coaching card")');
    await navigate('/admin');
    await until('!!document.querySelector(".admin-nav")');
    await tab('Events page');
    await click('Edit page settings');
    await fill('Title', 'Events from visual editor');
    await save();
    await navigate('/events');
    await until('document.querySelector("h1")?.textContent==="Events from visual editor"');
    console.log('PASS: Coaching additions and page-heading settings reach public pages.');

    for (const kind of ['events', 'gallery', 'slots', 'plans', 'pages']) {
      await navigate('/admin');
      await until('!!document.querySelector(".admin-nav")');
      const labels = {
        events: 'Events',
        gallery: 'Gallery',
        slots: 'Coaching sessions',
        plans: 'Membership plans',
        pages: 'Other pages',
      };
      await tab(labels[kind]);
      await click(
        kind === 'events'
          ? 'Add new event'
          : kind === 'gallery'
            ? 'Add new gallery item'
            : kind === 'slots'
              ? 'Add new coaching session'
              : 'Add new item',
      );
      await until('!!document.querySelector(".admin-modal[open] form")');
      const values = {
        events: {
          title: 'Visual portal event',
          imageAlt: 'Visual event poster',
          description: 'Event from modal editor',
          start: '2030-01-01T10:00',
          capacity: '30',
        },
        gallery: {
          title: 'Visual gallery card',
          description: 'Gallery from modal editor',
        },
        slots: {
          title: 'Visual session',
          start: '2030-01-01T10:00',
          end: '2030-01-01T11:00',
          location: 'Online',
          capacity: '10',
        },
        plans: {
          title: 'Visual plan',
          description: 'Plan from modal editor',
          price: '100',
          durationDays: '30',
        },
        pages: { title: 'Visual extra page', slug: 'visual-page', body: 'Page from modal editor' },
      }[kind];
      for (const [name, value] of Object.entries(values))
        await change(
          'set(form.querySelector("[name=' + name + ']"),' + JSON.stringify(value) + ');',
        );
      let uploadedImage;
      if (['events', 'gallery'].includes(kind)) {
        assert.ok(
          await evaluate('document.querySelector(".image-upload input[type=file]").required'),
        );
        uploadedImage = await uploadImage();
        assert.equal(
          await evaluate(
            'document.querySelectorAll("input[type=text][name=image],input[type=text][name=url]").length',
          ),
          0,
        );
      }
      await change('form.querySelector("[name=published]").click();');
      await save();
      await until(
        'document.querySelector(".admin-main").innerText.includes(' +
          JSON.stringify(values.title) +
          ')',
      );
      if (['events', 'gallery', 'pages'].includes(kind)) {
        await navigate(kind === 'pages' ? '/pages/visual-page' : '/' + kind);
        await until('document.body.innerText.includes(' + JSON.stringify(values.title) + ')');
        if (kind === 'events') {
          assert.ok(
            await evaluate(
              'new URL(Array.from(document.querySelectorAll(".event-card")).find(card=>card.innerText.includes("Visual portal event")).querySelector("img").src).pathname === ' +
                JSON.stringify(uploadedImage),
            ),
          );
          assert.ok(
            await evaluate(
              'Array.from(document.querySelectorAll(".event-card img")).every(img=>!img.src.includes("unsplash.com"))',
            ),
          );
        }
      }
    }
    console.log('PASS: Event, gallery, session, plan and additional page modal saves.');

    await navigate('/admin');
    await until('!!document.querySelector(".admin-nav")');
    await tab('Footer');
    assert.equal(await evaluate('document.querySelectorAll(".admin-main form").length'), 0);
    await click('Edit footer');
    await fill('Instagram link label', 'Follow our tournaments');
    await save();
    await until('document.querySelector("footer").innerText.includes("Follow our tournaments")');
    await tab('Members & access');
    await click('+ Add account');
    await fill('Full name', 'Visual Account');
    await fill('Email address', 'visual@example.com');
    await fill('Password (12+ characters)', 'visual-account-password');
    await save();
    await until('document.querySelector(".admin-main").innerText.includes("Visual Account")');
    console.log('PASS: Footer preview and account editor use modal saves.');

    await tab('Header & navigation');
    await click('Edit logo & brand');
    await fill('Brand name', 'Managed Visual Header');
    const logoImage = await uploadImage();
    await save();
    await until('document.querySelector("header").innerText.includes("Managed Visual Header")');
    await editCard('config.navigation.items');
    await fill('Label', 'Start here');
    await save();
    await until('document.querySelector(".desktop-nav").innerText.includes("Start here")');
    await click('Edit logo & brand');
    const invalidFile = path.join(temp, 'invalid.png');
    fs.writeFileSync(invalidFile, 'This is not a real image');
    await selectImage(invalidFile);
    await until('!!document.querySelector(".admin-modal .toast-error")');
    await wait(2200);
    assert.ok(await evaluate('!!document.querySelector(".toast-error")'));
    await evaluate('document.querySelector(".toast-error button").click()');
    assert.equal(await evaluate('document.querySelectorAll(".toast-error").length'), 0);
    assert.equal(
      await evaluate('new URL(document.querySelector(".image-upload-preview").src).pathname'),
      logoImage,
      'Invalid upload preserves previous image',
    );
    await uploadImage();
    await save();
    console.log('PASS: Header/menu previews, errors above modal, correction and retry.');

    await tab('About & team');
    await wait(2200);
    await evaluate('document.querySelector(".visual-collection").scrollIntoView({block:"start"})');
    fs.writeFileSync(
      path.join(os.tmpdir(), 'gvk-visual-admin-desktop.png'),
      Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
    );
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await wait(150);
    assert.equal(
      await evaluate('document.documentElement.scrollWidth>innerWidth'),
      false,
      'Mobile preview fits viewport',
    );
    fs.writeFileSync(
      path.join(os.tmpdir(), 'gvk-visual-admin-mobile.png'),
      Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
    );
    await editCard('config.team.members');
    assert.equal(
      await evaluate(
        'document.querySelector(".admin-modal").scrollWidth>document.querySelector(".admin-modal").clientWidth',
      ),
      false,
      'Modal has no horizontal overflow',
    );
    fs.writeFileSync(
      path.join(os.tmpdir(), 'gvk-visual-modal-mobile.png'),
      Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'),
    );
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
    await until('!document.querySelector(".admin-modal[open]")');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log('PASS: Mobile visual previews, modal layout and Escape dismissal.');
  }
  await send('Browser.close');
  ws.close();
} finally {
  ws?.close();
  if (browser.exitCode === null) {
    browser.kill();
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), wait(1500)]);
  }
  await new Promise((resolve) => server.close(resolve));
  db.close();
  assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
