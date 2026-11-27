import { ITERATIONS, deriveKey, seal, unseal, readEnvelope, newSalt, toB64, fromB64 } from "./crypto.js";
import { EMPTY, merge3, normalize, hasContent, sameData } from "./merge.js";

// Batch edits: every save is a commit.
export const SAVE_DELAY = 30_000;
// Coming back to the tab checks for changes from other devices at most this often.
export const REFRESH_AFTER = 120_000;
export const MIN_PASSPHRASE = 8;
const MAX_ATTEMPTS = 5;

export const emptyMeta = (target = null) => ({ target, version: null, seen: [], base: null, salt: null, iterations: null });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failure = (code, message) => Object.assign(new Error(message), { code });

// `backend` reads and writes the encrypted file; `local()` snapshots the state and `apply(data)` replaces it.
// `meta` is what was last synced: the file's version, the data it held, and the versions it replaced.
export function createSync({ backend, config, local, apply, storage, onStatus, iterations = ITERATIONS, delay = SAVE_DELAY }) {
  let meta = { ...emptyMeta(), ...storage.load() };
  let running = null;
  let again = false;
  let timer = 0;
  let generation = 0;
  let checkedAt = 0;
  let status = "off";
  let key = null;
  let keyId = "";

  function report(next, err) {
    status = next;
    onStatus(next, err);
  }

  async function keyFor(passphrase, salt, rounds) {
    const id = `${passphrase}\n${toB64(salt)}\n${rounds}`;
    if (keyId !== id) {
      key = await deriveKey(passphrase, salt, rounds);
      keyId = id;
    }
    return key;
  }

  const dirty = () => !sameData(normalize(local()), normalize(meta.base ?? EMPTY));

  // A version this device already replaced, or a missing file it wrote, is GitHub serving a stale read.
  function current(remote, attempt) {
    if (!meta.version) return remote;
    if (remote ? remote.version === meta.version || meta.seen.includes(remote.version) : attempt === 0) {
      return { version: meta.version, known: true };
    }
    return remote;
  }

  async function pass() {
    const cfg = config();
    if (!cfg.ready) return report("off");
    const run = generation;
    const stale = () => run !== generation || config().target !== cfg.target;
    if (meta.target !== cfg.target) meta = emptyMeta(cfg.target);
    report("syncing");
    try {
      let remote = await backend.read(cfg);
      for (let attempt = 0; ; attempt++) {
        if (stale()) return;
        remote = current(remote, attempt);
        let remoteData = null;
        let salt = meta.salt ? fromB64(meta.salt) : null;
        let rounds = meta.iterations;
        if (remote?.known) remoteData = meta.base;
        else if (remote) {
          const envelope = readEnvelope(remote.bytes);
          ({ salt, iterations: rounds } = envelope);
          remoteData = normalize(await unseal(envelope, await keyFor(cfg.passphrase, salt, rounds)));
        }
        const snap = local();
        const merged = remoteData ? merge3(meta.base, snap, remoteData) : normalize(snap);
        let version = remote?.version ?? null;
        if (remoteData ? !sameData(merged, remoteData) : hasContent(merged)) {
          // The first save fixes the passphrase for every device, so a weak one is refused before it.
          if (!remote && cfg.passphrase.length < MIN_PASSPHRASE) throw failure("errSyncWeak", "Passphrase too short");
          if (!remote) await backend.ensureBranch(cfg);
          if (!salt) [salt, rounds] = [newSalt(), iterations];
          const bytes = await seal(merged, await keyFor(cfg.passphrase, salt, rounds), salt, rounds);
          if (stale()) return;
          try {
            version = await backend.write(cfg, bytes, remote?.version ?? null);
          } catch (err) {
            if (!err.conflict || attempt >= MAX_ATTEMPTS - 1) throw err;
            await wait(500 * 2 ** attempt);
            remote = await backend.read(cfg);
            continue;
          }
        }
        if (stale()) return;
        // Edits made while the request was out are replayed on top of the merged data.
        const now = local();
        const result = sameData(now, snap) ? merged : merge3(snap, now, merged);
        if (!sameData(normalize(result), normalize(now))) apply(result);
        const seen = [...meta.seen, meta.version].filter((v) => v && v !== version);
        meta = { target: cfg.target, version, seen: seen.slice(-20), base: merged, salt: salt && toB64(salt), iterations: rounds };
        storage.save(meta);
        checkedAt = Date.now();
        return report(dirty() ? "local" : "synced");
      }
    } catch (err) {
      if (!stale()) report("error", err);
    }
  }

  // Resolves once everything edited so far was pushed, or the attempt failed.
  function sync() {
    clearTimeout(timer);
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        await pass();
      } while (again);
    })().finally(() => {
      running = null;
    });
    return running;
  }

  return {
    sync,
    status: () => status,
    dirty,
    changed() {
      if (!config().ready) return;
      if (status !== "syncing" && status !== "error") report("local");
      clearTimeout(timer);
      timer = setTimeout(sync, delay);
    },
    refresh(now = Date.now()) {
      return config().ready && (dirty() || now - checkedAt >= REFRESH_AFTER) ? sync() : Promise.resolve();
    },
    // The next sync decrypts the file again, so a changed passphrase is checked before it is used.
    recheck() {
      meta = { ...meta, version: null, seen: [], salt: null, iterations: null };
      storage.save(meta);
    },
    stop() {
      clearTimeout(timer);
      generation++;
      meta = emptyMeta();
      storage.save(null);
      key = null;
      keyId = "";
      report("off");
    },
  };
}
