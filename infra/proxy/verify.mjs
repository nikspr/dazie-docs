// Read-only post-deployment verification. Run: node infra/proxy/verify.mjs [origin]
import assert from 'node:assert/strict';
const origin = process.argv[2] ?? 'https://docs.dazie.io';
const pages = ['/', '/account/export-and-delete', '/faq', '/guides/your-companion', '/how-dazie-works'];
for (const path of pages) {
  const response = await fetch(new URL(path, origin), { headers: { accept: 'text/html' }, signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(response.headers.get('link') ?? '', /rel="(?:alternate|describedby)"/);
  const html = await response.text();
  assert.match(html, /<h1\b[^>]*>/);
  const metas = [...html.matchAll(/<meta\b[^>]+>/g)].map(match => match[0]);
  for (const key of ['og:title', 'og:type', 'og:image', 'og:url']) {
    assert.ok(metas.some(tag => tag.includes(`property="${key}"`) && /content="[^"]+"/.test(tag)), `${path}: ${key}`);
  }
  console.log(`PASS ${path}: server HTML, Link header, Open Graph`);
}
for (const [path, field] of [
  ['/.well-known/api-catalog', 'linkset'],
  ['/.well-known/oauth-authorization-server', 'issuer'],
  ['/.well-known/oauth-protected-resource', 'resource'],
  ['/.well-known/agent-card.json', 'description'],
  ['/.well-known/http-message-signatures-directory', 'keys'],
  ['/.well-known/ard.json', 'entries'],
]) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, path);
  const data = await response.json();
  assert.ok(data[field], `${path}: ${field}`);
  if (field === 'keys') assert.ok(data.keys.length && data.keys.every(key => key.kid && !key.d), 'Public keys need IDs and must exclude private key material');
  console.log(`PASS ${path}`);
}
const markdown = await fetch(new URL('/index.md', origin));
assert.equal(markdown.status, 200);
assert.match(markdown.headers.get('content-type'), /text\/markdown/);
console.log('PASS Markdown export');
