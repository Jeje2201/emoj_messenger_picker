const { test } = require("node:test");
const assert = require("node:assert/strict");
const { defaults, normalizeSettings, findReplacement, findSuggestions } = require("../extension/rules.js");

test("replaces a completed shortcut at the caret, including adjacent text", () => {
  assert.deepEqual(findReplacement("Salut :sob:", defaults), {
    start: 6, length: 5, emoji: "\uD83D\uDE2D",
  });
  assert.ok(findReplacement("Salut:cwl:", defaults));
  assert.equal(findReplacement(":so", defaults), null);
  assert.equal(findReplacement(":sob: suite", defaults), null);
  assert.equal(findReplacement("(sob)", defaults), null);
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
  assert.equal(findReplacement(":sob:", { ...defaults, enabled: false }), null);
});

test("validates stored settings without restoring intentionally empty mappings", () => {
  assert.deepEqual(normalizeSettings({ mappings: [], enabled: false }), {
    mappings: [], enabled: false,
  });
  assert.deepEqual(normalizeSettings(null), defaults);
  assert.deepEqual(normalizeSettings({ mappings: [
    null, { shortcut: "", emoji: "x" }, { shortcut: "ok", emoji: "" },
    { shortcut: ":a:", emoji: "first" }, { shortcut: ":a:", emoji: "second" },
  ] }).mappings, [{ shortcut: ":a:", emoji: "first" }]);
});

test("migrates legacy parenthesized shortcuts and preserves existing colon mappings", () => {
  const settings = normalizeSettings({ enabled: false, mappings: [
    { shortcut: "(custom)", emoji: "custom" },
    { shortcut: "(cwl)", emoji: "old" },
    { shortcut: ":cwl:", emoji: "preferred" },
    { shortcut: "plain", emoji: "unchanged" },
  ] });
  assert.deepEqual(settings, { enabled: false, mappings: [
    { shortcut: ":custom:", emoji: "custom" },
    { shortcut: ":cwl:", emoji: "preferred" },
    { shortcut: "plain", emoji: "unchanged" },
  ] });
  assert.equal(findReplacement(":custom:", { ...settings, enabled: true }).emoji, "custom");
});

test("does not migrate shortcuts saved in the current format", () => {
  assert.deepEqual(normalizeSettings({ formatVersion: 2, mappings: [
    { shortcut: "(custom)", emoji: "custom" },
  ] }).mappings, [{ shortcut: "(custom)", emoji: "custom" }]);
});

test("suggests configured colon shortcuts matching the prefix at the caret", () => {
  const settings = { enabled: true, mappings: [
    { shortcut: ":cwl:", emoji: "laugh" },
    { shortcut: ":cry:", emoji: "cry" },
    { shortcut: ":sob:", emoji: "sad" },
    { shortcut: "cool", emoji: "cool" },
  ] };
  assert.deepEqual(findSuggestions("Salut :", settings), {
    length: 1, mappings: settings.mappings.slice(0, 3),
  });
  assert.deepEqual(findSuggestions("Salut :c", settings), {
    length: 2, mappings: settings.mappings.slice(0, 2),
  });
  assert.equal(findSuggestions("Salut :C", settings), null);
  assert.equal(findSuggestions("Salut :none", settings), null);
  assert.equal(findSuggestions("Salut :c\n", settings), null);
  assert.equal(findSuggestions("Salut", settings), null);
  assert.equal(findSuggestions(":", { ...settings, enabled: false }), null);
  assert.equal(findSuggestions(":", { enabled: true, mappings: [] }), null);
});