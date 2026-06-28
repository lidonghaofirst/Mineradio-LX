const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseScriptInfo } = require('./protocol');

class CustomSourceStore {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.scriptDir = path.join(rootDir, 'scripts');
    this.indexFile = path.join(rootDir, 'sources.json');
    fs.mkdirSync(this.scriptDir, { recursive: true });
    this.state = this.#readState();
  }

  #readState() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
      return { activeId: parsed.activeId || '', items: Array.isArray(parsed.items) ? parsed.items : [] };
    } catch {
      return { activeId: '', items: [] };
    }
  }

  #save() {
    const temp = `${this.indexFile}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(temp, this.indexFile);
  }

  #hash(script) {
    return crypto.createHash('sha256').update(script).digest('hex');
  }

  importScript(originalPath, script) {
    const hash = this.#hash(script);
    if (this.state.items.some(item => item.hash === hash)) throw new Error('IMPORT_INVALID: duplicate script');
    const id = `user_api_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const item = { id, ...parseScriptInfo(script), originalPath: String(originalPath || ''), hash, allowUpdateAlert: true, status: 'idle', message: '' };
    fs.writeFileSync(path.join(this.scriptDir, `${id}.js`), script, 'utf8');
    this.state.items.push(item);
    this.#save();
    return { ...item };
  }

  list() { return this.state.items.map(item => ({ ...item, active: item.id === this.state.activeId })); }
  get(id) { const item = this.state.items.find(value => value.id === id); return item ? { ...item } : null; }
  getScript(id) { return fs.readFileSync(path.join(this.scriptDir, `${id}.js`), 'utf8'); }
  getActive() { return this.get(this.state.activeId); }
  setActive(id) { if (id && !this.get(id)) throw new Error('SOURCE_NOT_FOUND'); this.state.activeId = id || ''; this.#save(); }
  setStatus(id, status, message, sources) {
    const item = this.state.items.find(value => value.id === id);
    if (!item) return;
    Object.assign(item, { status, message: String(message || ''), sources: sources || item.sources || {} });
    this.#save();
  }
  setAllowUpdateAlert(id, enable) {
    const item = this.state.items.find(value => value.id === id);
    if (!item) throw new Error('SOURCE_NOT_FOUND');
    item.allowUpdateAlert = !!enable;
    this.#save();
  }
  replaceScript(id, script) {
    const item = this.state.items.find(value => value.id === id);
    if (!item) throw new Error('SOURCE_NOT_FOUND');
    const info = parseScriptInfo(script);
    const hash = this.#hash(script);
    fs.writeFileSync(path.join(this.scriptDir, `${id}.js.next`), script, 'utf8');
    fs.renameSync(path.join(this.scriptDir, `${id}.js.next`), path.join(this.scriptDir, `${id}.js`));
    Object.assign(item, info, { hash, status: 'idle', message: '' });
    this.#save();
    return { ...item };
  }
  remove(id) {
    this.state.items = this.state.items.filter(item => item.id !== id);
    if (this.state.activeId === id) this.state.activeId = '';
    fs.rmSync(path.join(this.scriptDir, `${id}.js`), { force: true });
    this.#save();
  }
}

module.exports = { CustomSourceStore };
