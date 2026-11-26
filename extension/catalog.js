(function () {
  "use strict";

  const sourceUrl = "https://unicode.org/Public/emoji/latest/emoji-test.txt";
  const maximumEntries = 10000;

  function getMessage(key, fallback) {
    return globalThis.chrome?.i18n?.getMessage(key) || fallback;
  }

  function parseEmojiTest(text) {
    if (typeof text !== "string") {
      throw new Error(getMessage("catalogInvalid", "Invalid Unicode catalogue."));
    }
    const version = text.match(/^# Version:\s*(\S+)/m)?.[1];
    if (!version) {
      throw new Error(getMessage("catalogVersionMissing", "Unicode catalogue version not found."));
    }

    const entries = [];
    for (const line of text.split(/\r?\n/u)) {
      const match = line.match(
        /^([0-9A-F ]+?)\s*;\s*fully-qualified\s+#\s+\S+\s+E\d+(?:\.\d+)?\s+(.+)$/u,
      );
      if (!match) continue;
      const codePoints = match[1].trim().split(/\s+/u).map((value) => Number.parseInt(value, 16));
      if (!codePoints.length || codePoints.some((value) => !Number.isInteger(value) ||
          value < 0 || value > 0x10ffff)) continue;
      entries.push({
        emoji: String.fromCodePoint(...codePoints),
        name: match[2].trim(),
      });
      if (entries.length > maximumEntries) {
        throw new Error(getMessage("catalogTooManyEntries", "The Unicode catalogue has too many entries."));
      }
    }
    if (!entries.length) {
      throw new Error(getMessage("catalogNoEmoji", "No emoji found in the Unicode catalogue."));
    }
    return { version, entries };
  }

  function shortcutFor(name) {
    const slug = name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
      .replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
    return slug ? `:${slug}:` : "";
  }

  function mergeMissingMappings(existingMappings, entries) {
    const mappings = existingMappings.map(({ shortcut, emoji }) => ({ shortcut, emoji }));
    const shortcuts = new Set(mappings.map(({ shortcut }) => shortcut));
    const emojis = new Set(mappings.map(({ emoji }) => emoji));
    const result = { mappings, added: 0, alreadyPresent: 0, conflicts: 0, conflictDetails: [] };

    for (const entry of entries) {
      if (!entry || typeof entry.emoji !== "string" || !entry.emoji ||
          typeof entry.name !== "string" || !entry.name) {
        result.conflicts += 1;
        if (result.conflictDetails.length < 5) {
          result.conflictDetails.push({ shortcut: "", emoji: entry?.emoji || "", name: entry?.name || "" });
        }
        continue;
      }
      if (emojis.has(entry.emoji)) {
        result.alreadyPresent += 1;
        continue;
      }
      const shortcut = shortcutFor(entry.name);
      if (!shortcut || shortcut.length > 80 || shortcuts.has(shortcut)) {
        result.conflicts += 1;
        if (result.conflictDetails.length < 5) {
          result.conflictDetails.push({ shortcut, emoji: entry.emoji, name: entry.name });
        }
        continue;
      }
      mappings.push({ shortcut, emoji: entry.emoji });
      shortcuts.add(shortcut);
      emojis.add(entry.emoji);
      result.added += 1;
    }
    return result;
  }

  function isValidCatalog(value) {
    return Boolean(value && typeof value.version === "string" &&
      Number.isFinite(value.fetchedAt) && Array.isArray(value.entries) &&
      value.entries.length > 0 && value.entries.length <= maximumEntries &&
      value.entries.every((entry) => entry && typeof entry.emoji === "string" &&
        entry.emoji.length > 0 && typeof entry.name === "string" && entry.name.length > 0));
  }

  const api = { sourceUrl, parseEmojiTest, mergeMissingMappings, isValidCatalog };
  globalThis.MessengerEmojiCatalog = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
