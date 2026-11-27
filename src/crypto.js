export const ITERATIONS = 600_000;
// Iteration counts come from the file; outside this range a hostile file could freeze every device.
const MIN_ITERATIONS = 100_000;
const MAX_ITERATIONS = 2_000_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Layout: format byte, iterations (uint32), 16-byte salt, 12-byte IV, then AES-GCM over gzipped JSON.
const FORMAT = 1;
const SALT_AT = 5;
const IV_AT = SALT_AT + 16;
const HEADER = IV_AT + 12;

export const toB64 = (bytes) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
export const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export const newSalt = () => crypto.getRandomValues(new Uint8Array(16));

export async function deriveKey(passphrase, salt, iterations) {
  const base = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function seal(value, key, salt, iterations) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // Compressed before encrypting, since ciphertext does not compress.
  const packed = await pipe(encoder.encode(JSON.stringify(value)), new CompressionStream("gzip"));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, packed));
  const out = new Uint8Array(HEADER + data.length);
  out[0] = FORMAT;
  new DataView(out.buffer).setUint32(1, iterations);
  out.set(salt, SALT_AT);
  out.set(iv, IV_AT);
  out.set(data, HEADER);
  return out;
}

export function readEnvelope(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const iterations = bytes.length > HEADER && bytes[0] === FORMAT ? view.getUint32(1) : 0;
  if (!(iterations >= MIN_ITERATIONS && iterations <= MAX_ITERATIONS)) {
    throw Object.assign(new Error("Unrecognized data file"), { code: "errSyncFormat" });
  }
  return { iterations, salt: bytes.slice(SALT_AT, IV_AT), iv: bytes.slice(IV_AT, HEADER), data: bytes.slice(HEADER) };
}

export async function unseal(envelope, key) {
  let plain;
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: envelope.iv }, key, envelope.data));
  } catch {
    throw Object.assign(new Error("Wrong passphrase"), { code: "errSyncPassphrase" });
  }
  return JSON.parse(decoder.decode(await pipe(plain, new DecompressionStream("gzip"))));
}
