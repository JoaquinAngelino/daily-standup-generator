import { test } from "node:test";
import assert from "node:assert/strict";
import { createSync } from "../src/sync.js";
import { EMPTY } from "../src/merge.js";
import { readEnvelope, unseal, deriveKey } from "../src/crypto.js";

const ITER = 100_000;
const PASS = "correct horse";

function fakeRepo() {
  let n = 0;
  const repo = {
    file: null,
    branch: false,
    writes: 0,
    staleNext: null,
    async read() {
      if (repo.staleNext !== null) {
        const stale = repo.staleNext;
        repo.staleNext = null;
        return stale;
      }
      return repo.file && { ...repo.file };
    },
    async write(_, bytes, version) {
      if ((repo.file?.version ?? null) !== version) throw Object.assign(new Error("conflict"), { conflict: true });
      repo.writes++;
      repo.file = { version: `v${++n}`, bytes };
      return repo.file.version;
    },
    async ensureBranch() {
      repo.branch = true;
    },
  };
  return repo;
}

function device(repo, initial = {}, passphrase = PASS) {
  const dev = { data: { ...EMPTY, ...initial }, saved: null, statuses: [] };
  dev.sync = createSync({
    backend: repo,
    config: () => ({ ready: true, target: "o/r@data", passphrase }),
    local: () => structuredClone(dev.data),
    apply: (d) => {
      dev.data = structuredClone(d);
    },
    storage: { load: () => dev.saved, save: (m) => (dev.saved = m && structuredClone(m)) },
    onStatus: (s, err) => dev.statuses.push(err?.code ?? s),
    iterations: ITER,
    delay: 0,
  });
  return dev;
}

async function openFile(repo) {
  const env = readEnvelope(repo.file.bytes);
  return unseal(env, await deriveKey(PASS, env.salt, env.iterations));
}

test("first sync creates the branch and an encrypted file", async () => {
  const repo = fakeRepo();
  const a = device(repo, { output: "hello" });
  await a.sync.sync();
  assert.equal(repo.branch, true);
  assert.equal((await openFile(repo)).output, "hello");
  assert.equal(new TextDecoder().decode(repo.file.bytes).includes("hello"), false);
  assert.equal(a.statuses.at(-1), "synced");
});

test("two devices merge their edits", async () => {
  const repo = fakeRepo();
  const a = device(repo, { tracker: [{ id: "t", title: "T", note: "" }] });
  await a.sync.sync();
  const b = device(repo);
  await b.sync.sync();
  assert.deepEqual(b.data.tracker, a.data.tracker);

  a.data.tracker[0].note = "from a";
  b.data.tracker[0].title = "from b";
  await a.sync.sync();
  await b.sync.sync();
  await a.sync.sync();
  assert.deepEqual(a.data.tracker, [{ id: "t", title: "from b", note: "from a" }]);
  assert.deepEqual(b.data.tracker, a.data.tracker);
});

test("a write that lost the race re-reads and merges", async () => {
  const repo = fakeRepo();
  const a = device(repo, { tracker: [{ id: "x" }] });
  await a.sync.sync();
  const b = device(repo);
  await b.sync.sync();

  const realRead = repo.read;
  let first = true;
  repo.read = async () => {
    const file = await realRead();
    if (first) {
      first = false;
      a.data.tracker.push({ id: "fromA" });
      await a.sync.sync();
    }
    return file;
  };
  b.data.tracker.push({ id: "fromB" });
  await b.sync.sync();
  repo.read = realRead;
  assert.deepEqual((await openFile(repo)).tracker.map((t) => t.id).sort(), ["fromA", "fromB", "x"]);
});

test("a stale read of a replaced version does not undo newer data", async () => {
  const repo = fakeRepo();
  const a = device(repo, { output: "one" });
  await a.sync.sync();
  const old = { ...repo.file };
  a.data.output = "two";
  await a.sync.sync();
  repo.staleNext = old;
  await a.sync.sync();
  assert.equal(a.data.output, "two");
  repo.staleNext = null;
  await a.sync.sync();
  assert.equal(a.data.output, "two");
});

test("a wrong passphrase is reported and nothing is written", async () => {
  const repo = fakeRepo();
  await device(repo, { output: "secret" }).sync.sync();
  const writes = repo.writes;
  const b = device(repo, { output: "mine" }, "wrong passphrase");
  await b.sync.sync();
  assert.equal(b.statuses.at(-1), "errSyncPassphrase");
  assert.equal(repo.writes, writes);
});

test("a short passphrase cannot create the file", async () => {
  const repo = fakeRepo();
  const a = device(repo, { output: "x" }, "short");
  await a.sync.sync();
  assert.equal(a.statuses.at(-1), "errSyncWeak");
  assert.equal(repo.file, null);
});

test("edits made during a sync stay and are reported unsynced", async () => {
  const repo = fakeRepo();
  const a = device(repo, { output: "one" });
  const realWrite = repo.write;
  repo.write = async (...args) => {
    a.data.repos = ["o/typed"];
    return realWrite(...args);
  };
  await a.sync.sync();
  repo.write = realWrite;
  assert.deepEqual(a.data.repos, ["o/typed"]);
  assert.equal(a.statuses.at(-1), "local");
  await a.sync.sync();
  assert.deepEqual((await openFile(repo)).repos, ["o/typed"]);
});
