const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { CustomSourceStore } = require('../../desktop/custom-source/store');

test('initializes an empty index file on construction', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  new CustomSourceStore(root);
  const indexFile = path.join(root, 'sources.json');
  assert.equal(fs.existsSync(indexFile), true);
  assert.deepEqual(JSON.parse(fs.readFileSync(indexFile, 'utf8')), { activeId: '', items: [] });
});

test('backs up invalid index before initializing defaults', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const invalid = '{not json';
  fs.writeFileSync(path.join(root, 'sources.json'), invalid, 'utf8');
  const store = new CustomSourceStore(root);
  assert.deepEqual(store.list(), []);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'sources.json'), 'utf8')), { activeId: '', items: [] });
  const backups = fs.readdirSync(root).filter(name => name.startsWith('sources.json.corrupt'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(root, backups[0]), 'utf8'), invalid);
});

test('backs up schema-invalid index before initializing defaults', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const invalid = JSON.stringify({ activeId: { bad: true }, items: [1] });
  fs.writeFileSync(path.join(root, 'sources.json'), invalid, 'utf8');
  const store = new CustomSourceStore(root);
  assert.deepEqual(store.list(), []);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'sources.json'), 'utf8')), { activeId: '', items: [] });
  const backups = fs.readdirSync(root).filter(name => name.startsWith('sources.json.corrupt'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(root, backups[0]), 'utf8'), invalid);
});

test('backs up and resets an index whose only invalid field is activeId', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const invalid = JSON.stringify({ activeId: { bad: true }, items: [] });
  fs.writeFileSync(path.join(root, 'sources.json'), invalid, 'utf8');

  const store = new CustomSourceStore(root);

  assert.deepEqual(store.list(), []);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'sources.json'), 'utf8')), { activeId: '', items: [] });
  const backups = fs.readdirSync(root).filter(name => name.startsWith('sources.json.corrupt'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(root, backups[0]), 'utf8'), invalid);
});

test('keeps status sources isolated from caller and returned copies', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const store = new CustomSourceStore(root);
  const first = store.importScript('a.js', '/**\n * @name A\n */\nvoid 0');
  const sources = { platforms: { tx: true }, list: ['a'] };
  store.setStatus(first.id, 'ready', '', sources);

  sources.platforms.tx = false;
  sources.list.push('b');
  assert.deepEqual(store.get(first.id).sources, { platforms: { tx: true }, list: ['a'] });

  const fromGet = store.get(first.id);
  fromGet.sources.platforms.tx = false;
  fromGet.sources.list.push('b');
  assert.deepEqual(store.get(first.id).sources, { platforms: { tx: true }, list: ['a'] });

  const fromList = store.list()[0];
  fromList.sources.platforms.tx = false;
  fromList.sources.list.push('b');
  assert.deepEqual(store.get(first.id).sources, { platforms: { tx: true }, list: ['a'] });
});

test('imports scripts through a temporary file rename', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const store = new CustomSourceStore(root);
  const script = '/**\n * @name A\n */\nvoid 0';
  const scriptWrites = [];
  const renames = [];
  const originalWriteFileSync = fs.writeFileSync;
  const originalRenameSync = fs.renameSync;

  try {
    fs.writeFileSync = function writeFileSync(file, data, options) {
      if (data === script) scriptWrites.push(path.basename(String(file)));
      return originalWriteFileSync.apply(this, arguments);
    };
    fs.renameSync = function renameSync(from, to) {
      renames.push([path.basename(String(from)), path.basename(String(to))]);
      return originalRenameSync.apply(this, arguments);
    };

    const imported = store.importScript('a.js', script);
    assert.equal(scriptWrites.length, 1);
    assert.notEqual(scriptWrites[0], `${imported.id}.js`);
    assert.equal(renames.some(([from, to]) => from !== `${imported.id}.js` && to === `${imported.id}.js`), true);
  } finally {
    fs.writeFileSync = originalWriteFileSync;
    fs.renameSync = originalRenameSync;
  }
});

test('replaceScript stages the replacement at the exact .js.next path', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const store = new CustomSourceStore(root);
  const first = store.importScript('a.js', '/**\n * @name A\n * @version 1\n */\nvoid 0');
  const replacement = '/**\n * @name A\n * @version 2\n */\nvoid 0';
  const scriptWrites = [];
  const renames = [];
  const originalWriteFileSync = fs.writeFileSync;
  const originalRenameSync = fs.renameSync;

  try {
    fs.writeFileSync = function writeFileSync(file, data, options) {
      if (data === replacement) scriptWrites.push(path.basename(String(file)));
      return originalWriteFileSync.apply(this, arguments);
    };
    fs.renameSync = function renameSync(from, to) {
      renames.push([path.basename(String(from)), path.basename(String(to))]);
      return originalRenameSync.apply(this, arguments);
    };

    store.replaceScript(first.id, replacement);

    assert.deepEqual(scriptWrites, [`${first.id}.js.next`]);
    assert.equal(renames.some(([from, to]) => from === `${first.id}.js.next` && to === `${first.id}.js`), true);
  } finally {
    fs.writeFileSync = originalWriteFileSync;
    fs.renameSync = originalRenameSync;
  }
});

test('replaceScript restores in-memory metadata and script file when index save fails', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const store = new CustomSourceStore(root);
  const firstScript = '/**\n * @name A\n * @version 1\n */\nvoid 0';
  const secondScript = '/**\n * @name A\n * @version 2\n */\nvoid 0';
  const first = store.importScript('a.js', firstScript);
  const originalRenameSync = fs.renameSync;

  try {
    fs.renameSync = function renameSync(from, to) {
      if (String(to) === path.join(root, 'sources.json')) throw new Error('save failed');
      return originalRenameSync.apply(this, arguments);
    };
    assert.throws(() => store.replaceScript(first.id, secondScript), /save failed/);
  } finally {
    fs.renameSync = originalRenameSync;
  }

  assert.equal(store.get(first.id).version, '1');
  assert.equal(store.getScript(first.id), firstScript);
});

test('imports, lists, activates, replaces, and removes scripts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const store = new CustomSourceStore(root);
  const first = store.importScript('/tmp/a.js', '/**\n * @name A\n * @version 1\n */\nvoid 0');
  assert.equal(store.list()[0].name, 'A');
  store.setActive(first.id);
  assert.equal(store.getActive().id, first.id);
  store.replaceScript(first.id, '/**\n * @name A\n * @version 2\n */\nvoid 0');
  assert.equal(store.get(first.id).version, '2');
  store.remove(first.id);
  assert.deepEqual(store.list(), []);
});

test('rejects identical content', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mineradio-source-'));
  const store = new CustomSourceStore(root);
  const script = '/**\n * @name A\n */\nvoid 0';
  store.importScript('a.js', script);
  assert.throws(() => store.importScript('b.js', script), /duplicate/i);
});
