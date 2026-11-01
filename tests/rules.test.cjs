const { test } = require("node:test");
const assert = require("node:assert/strict");
const { defaults, normalizeSettings, findReplacement } = require("../extension/rules.js");

test("replaces a completed shortcut at the caret, including adjacent text", () => {
  assert.deepEqual(findReplacement("Salut (sob)", defaults), {
    start: 6, length: 5, emoji: "\uD83D\uDE2D",
  });
  assert.ok(findReplacement("Salut(cwl)", defaults));
  assert.equal(findReplacement("(so", defaults), null);
  assert.equal(findReplacement("(sob) suite", defaults), null);
});

test("supports literal custom shortcuts and prefers the longest match", () => {
  const settings = { enabled: true, mappings: [
    { shortcut: ")", emoji: "short" },
    { shortcut: "(a+b)", emoji: "long" },
    { shortcut: "cool", emoji: "\uD83D\uDE0E" },
  ] };
  assert.equal(findReplacement("(a+b)", settings).emoji, "long");
  assert.ok(findReplacement("C'est cool", settings));
  assert.equal(findReplacement("uncool", settings), null);
  assert.equal(findReplacement("COOL", settings), null);
});

test("disabled settings never replace text", () => {
  assert.equal(findReplacement("(sob)", { ...defaults, enabled: false }), null);
});

test("validates stored settings without restoring intentionally empty mappings", () => {
  assert.deepEqual(normalizeSettings({ mappings: [], enabled: false }), {
    mappings: [], enabled: false,
  });
  assert.deepEqual(normalizeSettings(null), defaults);
  assert.deepEqual(normalizeSettings({ mappings: [
    null, { shortcut: "", emoji: "x" }, { shortcut: "ok", emoji: "" },
    { shortcut: "(a)", emoji: "first" }, { shortcut: "(a)", emoji: "second" },
  ] }).mappings, [{ shortcut: "(a)", emoji: "first" }]);
});