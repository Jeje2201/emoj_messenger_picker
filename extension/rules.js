(function () {
  "use strict";

  const defaults = {
    enabled: true,
    mappings: [
      { shortcut: "(cwl)", emoji: "\uD83D\uDE02" },
      { shortcut: "(sob)", emoji: "\uD83D\uDE2D" },
      { shortcut: "(heart)", emoji: "\u2764\uFE0F" },
      { shortcut: "(smile)", emoji: "\uD83D\uDE0A" },
      { shortcut: "(thumbsup)", emoji: "\uD83D\uDC4D" },
    ],
  };

  function normalizeSettings(value) {
    if (!value || !Array.isArray(value.mappings)) {
      return structuredClone(defaults);
    }
    const seen = new Set();
    const mappings = value.mappings.filter((mapping) => {
      if (!mapping || typeof mapping.shortcut !== "string" ||
          typeof mapping.emoji !== "string" || !mapping.shortcut.trim() ||
          !mapping.emoji.trim() || /[\r\n]/u.test(mapping.shortcut) ||
          mapping.shortcut.length > 80 || mapping.emoji.length > 80 ||
          seen.has(mapping.shortcut)) {
        return false;
      }
      seen.add(mapping.shortcut);
      return true;
    }).map(({ shortcut, emoji }) => ({ shortcut, emoji }));
    return { enabled: value.enabled !== false, mappings };
  }

  function findReplacement(text, settings) {
    if (!settings.enabled) return null;
    const mappings = [...settings.mappings].sort((first, second) =>
      second.shortcut.length - first.shortcut.length);
    for (const mapping of mappings) {
      if (!text.endsWith(mapping.shortcut)) continue;
      const start = text.length - mapping.shortcut.length;
      if (/^[\p{L}\p{N}_]/u.test(mapping.shortcut) && start > 0 &&
          /[\p{L}\p{N}_]/u.test(text[start - 1])) continue;
      return { start, length: mapping.shortcut.length, emoji: mapping.emoji };
    }
    return null;
  }

  const api = { defaults, normalizeSettings, findReplacement };
  globalThis.MessengerEmojiRules = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();