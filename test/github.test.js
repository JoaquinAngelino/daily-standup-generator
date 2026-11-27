import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "../src/github.js";

function mockFetch(routes) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const key = `${init.method ?? "GET"} ${url.replace("https://api.github.com", "")}`;
    calls.push({ key, init });
    const [status, body] = routes[key] ?? [404, { message: "Not Found" }];
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
  return calls;
}

const cfg = { repo: "o/r", branch: "standup-data" };

test("readFile returns null when the file or branch is missing, else its bytes and sha", async () => {
  const client = createClient("t");
  mockFetch({});
  assert.equal(await client.readFile(cfg), null);
  mockFetch({ "GET /repos/o/r/contents/standup.enc?ref=standup-data": [200, { sha: "s1", content: "AQID\n" }] });
  assert.deepEqual(await client.readFile(cfg), { version: "s1", bytes: new Uint8Array([1, 2, 3]) });
});

test("writeFile sends the sha and branch, and flags conflicts", async () => {
  const client = createClient("t");
  const calls = mockFetch({ "PUT /repos/o/r/contents/standup.enc": [200, { content: { sha: "s2" } }] });
  assert.equal(await client.writeFile(cfg, new Uint8Array([1]), "s1"), "s2");
  assert.deepEqual(JSON.parse(calls[0].init.body), { message: "Update standup data", content: "AQ==", branch: "standup-data", sha: "s1" });

  mockFetch({ "PUT /repos/o/r/contents/standup.enc": [409, { message: "conflict" }] });
  await assert.rejects(client.writeFile(cfg, new Uint8Array([1]), "old"), (err) => err.conflict === true);
});

test("ensureBranch creates the branch from the default branch head", async () => {
  const client = createClient("t");
  const calls = mockFetch({
    "GET /repos/o/r": [200, { default_branch: "main" }],
    "GET /repos/o/r/git/ref/heads/main": [200, { object: { sha: "c0" } }],
    "POST /repos/o/r/git/refs": [201, {}],
  });
  await client.ensureBranch(cfg);
  assert.deepEqual(JSON.parse(calls.at(-1).init.body), { ref: "refs/heads/standup-data", sha: "c0" });

  const existing = mockFetch({ "GET /repos/o/r/branches/standup-data": [200, {}] });
  await client.ensureBranch(cfg);
  assert.equal(existing.length, 1);
});
