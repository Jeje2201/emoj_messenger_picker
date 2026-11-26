const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const extensionPath = path.join(__dirname, "..", "extension");
const en = JSON.parse(fs.readFileSync(path.join(extensionPath, "_locales", "en", "messages.json"), "utf8"));
const fr = JSON.parse(fs.readFileSync(path.join(extensionPath, "_locales", "fr", "messages.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(extensionPath, "manifest.json"), "utf8"));

test("English is the default locale and every locale has the same message keys", () => {
  assert.equal(manifest.default_locale, "en");
  assert.deepEqual(Object.keys(en).sort(), Object.keys(fr).sort());
});

test("manifest and UI localization references exist in both locales", () => {
  const files = ["manifest.json", "options.html", "options.js", "content.js", "catalog.js"];
  const references = files.flatMap((file) => {
    const text = fs.readFileSync(path.join(extensionPath, file), "utf8");
    const pattern = file === "manifest.json"
      ? /__MSG_(\w+)__/gu
      : file === "options.html"
        ? /data-i18n(?:-[\w-]+)?="([^"]+)"/gu
        : /getMessage\("([^"]+)"/gu;
    return [...text.matchAll(pattern)].map((match) => match[1]);
  });
  for (const key of references) {
    assert.ok(en[key], `Missing English message: ${key}`);
    assert.ok(fr[key], `Missing French message: ${key}`);
  }
});
