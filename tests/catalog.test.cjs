const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseEmojiTest, mergeMissingMappings, isValidCatalog } =
  require("../extension/catalog.js");

test("parses fully-qualified emoji sequences and ignores other qualification statuses", () => {
  const source = [
    "# Version: 18.0",
    "1F600 ; fully-qualified # 😀 E1.0 grinning face",
    "1F469 200D 1F4BB ; fully-qualified # 👩‍💻 E4.0 woman technologist",
    "1F600 FE0F ; minimally-qualified # 😀 E1.0 grinning face",
  ].join("\n");
  assert.deepEqual(parseEmojiTest(source), {
    version: "18.0",
    entries: [
      { emoji: "😀", name: "grinning face" },
      { emoji: "👩‍💻", name: "woman technologist" },
    ],
  });
  assert.throws(() => parseEmojiTest("# no version or emoji"), /version/i);
});

test("bulk import preserves existing mappings and skips emoji and shortcut conflicts", () => {
  const existing = [
    { shortcut: ":my_face:", emoji: "😀" },
    { shortcut: ":woman_technologist:", emoji: "custom" },
  ];
  const result = mergeMissingMappings(existing, [
    { emoji: "😀", name: "grinning face" },
    { emoji: "🧑‍💻", name: "woman technologist" },
    { emoji: "🥳", name: "partying face" },
    { emoji: "🥳", name: "another name" },
  ]);
  assert.deepEqual(result, {
    mappings: [
      ...existing,
      { shortcut: ":partying_face:", emoji: "🥳" },
    ],
    added: 1,
    alreadyPresent: 2,
    conflicts: 1,
    conflictDetails: [{ shortcut: ":woman_technologist:", emoji: "🧑‍💻", name: "woman technologist" }],
  });
});

test("validates a cached catalogue before use", () => {
  assert.equal(isValidCatalog({
    version: "18.0",
    fetchedAt: 1,
    entries: [{ emoji: "😀", name: "grinning face" }],
  }), true);
  assert.equal(isValidCatalog({ version: "18.0", fetchedAt: 1, entries: [] }), false);
  assert.equal(isValidCatalog({ version: "18.0", fetchedAt: NaN, entries: [] }), false);
});
