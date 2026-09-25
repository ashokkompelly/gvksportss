import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/export-database.mjs', import.meta.url));

test('database export includes committed WAL data and refuses to overwrite an existing database', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'gvk-export-test-'));
  const sourcePath = path.join(directory, 'source.sqlite');
  const targetPath = path.join(directory, 'export.sqlite');
  const source = new DatabaseSync(sourcePath);
  try {
    source.exec(
      'PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE resources(kind TEXT, data TEXT)',
    );
    source.prepare('INSERT INTO resources VALUES(?, ?)').run('pages', 'latest committed content');
    assert.ok(statSync(sourcePath + '-wal').size > 0);
    execFileSync(process.execPath, [script, sourcePath, targetPath]);
    const exported = new DatabaseSync(targetPath, { readOnly: true });
    try {
      assert.equal(
        exported.prepare('SELECT data FROM resources').get().data,
        'latest committed content',
      );
      assert.equal(exported.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
      assert.equal(exported.prepare('PRAGMA journal_mode').get().journal_mode, 'delete');
    } finally {
      exported.close();
    }
    assert.equal(existsSync(targetPath + '-wal'), false);
    source.prepare('INSERT INTO resources VALUES(?, ?)').run('pages', 'later change');
    const retry = spawnSync(process.execPath, [script, sourcePath, targetPath], {
      encoding: 'utf8',
    });
    assert.notEqual(retry.status, 0);
    assert.match(retry.stderr, /refusing to overwrite/);
    assert.equal(source.prepare('SELECT count(*) AS count FROM resources').get().count, 2);
  } finally {
    source.close();
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('gvk-export-test-'));
    rmSync(resolved, { recursive: true, force: true });
  }
});
