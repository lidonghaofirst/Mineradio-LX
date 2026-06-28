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
