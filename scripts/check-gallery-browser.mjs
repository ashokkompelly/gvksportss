import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import express from 'express';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gvk-gallery-browser-'));
await build({
  stdin: {
    contents: `import React, {useState} from 'react';
      import {createRoot} from 'react-dom/client';
      import GalleryCard from './apps/web/src/components/GalleryCard.jsx';
      import GalleryImagesUpload from './apps/web/src/components/GalleryImagesUpload.jsx';
      import './apps/web/src/styles.css';
      function App() {
        const [images, setImages] = useState(['/one.svg']);
        return <><div className="gallery"><GalleryCard item={{title:'Sports day',description:'Event details for sports day.', images:['/one.svg','/two.svg']}} /></div>
          <form onSubmit={e=>{e.preventDefault();window.saved=images;}}><GalleryImagesUpload value={images} onChange={setImages}/><button type="submit">Save</button></form></>;
      }
      createRoot(document.getElementById('root')).render(<App/>);`,
    resolveDir: process.cwd(),
    loader: 'jsx',
  },
  bundle: true,
  outfile: path.join(temp, 'app.js'),
  jsx: 'automatic',
});
const app = express();
let uploadCount = 0;
app.post('/api/admin/uploads', express.raw({ type: '*/*' }), async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  res.json({ url: `/uploaded-${++uploadCount}.svg` });
});
app.get('/{name}.svg', (req, res) =>
  res
    .type('svg')
    .send(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="gold"/></svg>',
    ),
);
app.use(express.static(temp));
app.get('/', (req, res) =>
  res.send(
    '<html><head><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>',
  ),
);
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const browser = spawn(
  process.env.CMS_TEST_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=0',
    `--user-data-dir=${path.join(temp, 'browser')}`,
    '--no-first-run',
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
let ws;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const portFile = path.join(temp, 'browser', 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await wait(100);
  assert.ok(fs.existsSync(portFile), 'Chrome started');
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:${server.address().port}`, {
      method: 'PUT',
    })
  ).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const next = ++id;
      pending.set(next, resolve);
      ws.send(JSON.stringify({ id: next, method, params }));
    });
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    assert.ok(
      !response.result?.exceptionDetails,
      JSON.stringify(response.result?.exceptionDetails),
    );
    return response.result.result.value;
  };
  for (let i = 0; i < 100; i++) {
    if (await evaluate("!!document.querySelector('.gallery-open')")) break;
    await wait(100);
  }
  for (const width of [1440, 1280, 768, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(
      "document.querySelector('.gallery-open').focus(); document.querySelector('.gallery-open').click()",
    );
    await wait(100);
    assert.equal(await evaluate("!!document.querySelector('dialog[open]')"), true);
    assert.equal(
      await evaluate(
        "document.querySelector('dialog').textContent.includes('Event details for sports day.')",
      ),
      true,
    );
    await evaluate('document.querySelector(\'dialog [aria-label^="Next photo"]\').click()');
    await wait(50);
    assert.equal(
      await evaluate("document.querySelector('dialog .gallery-slider > img').getAttribute('src')"),
      '/two.svg',
    );
    await evaluate('document.querySelector(\'dialog [aria-label="Show photo 1"]\').click()');
    await wait(50);
    assert.equal(
      await evaluate("document.querySelector('dialog .gallery-slider > img').getAttribute('src')"),
      '/one.svg',
    );
    assert.equal(
      await evaluate(
        "(()=>{const d=document.querySelector('dialog');return d.scrollWidth<=d.clientWidth && d.getBoundingClientRect().right<=innerWidth;})()",
      ),
      true,
    );
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
    await wait(50);
    assert.equal(
      await evaluate(
        "!document.querySelector('dialog[open]') && document.activeElement.classList.contains('gallery-open')",
      ),
      true,
    );
  }
  await evaluate(
    `(()=>{const input=document.querySelector('input[type=file]');const transfer=new DataTransfer();for(const name of ['first.png','second.png']) transfer.items.add(new File(['photo'],name,{type:'image/png'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('form').requestSubmit();})()`,
  );
  assert.equal(await evaluate('window.saved === undefined'), true, 'save blocked during uploads');
  for (let i = 0; i < 100; i++) {
    if (await evaluate("document.querySelectorAll('.gallery-upload-item').length === 3")) break;
    await wait(100);
  }
  assert.equal(await evaluate("document.querySelectorAll('.gallery-upload-item').length"), 3);
  await evaluate('document.querySelector(\'[aria-label="Move photo 3 earlier"]\').click()');
  await wait(50);
  await evaluate('document.querySelector(\'[aria-label="Remove photo 1"]\').click()');
  await wait(50);
  await evaluate("document.querySelector('form').requestSubmit()");
  assert.deepEqual(await evaluate('window.saved'), ['/uploaded-2.svg', '/uploaded-1.svg']);
  console.log(
    'Gallery browser checks passed: popup, slides, thumbnails, Escape/focus, responsive widths, batch upload, save guard, reorder and removal.',
  );
} finally {
  ws?.close();
  browser.kill();
  server.close();
}
