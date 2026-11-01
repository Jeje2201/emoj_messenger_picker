(function () {
  "use strict";

  const { normalizeSettings, findReplacement } = globalThis.MessengerEmojiRules;
  let settings = { enabled: false, mappings: [] };
  let replacing = false;
  let settingsRevision = 0;
  let replacementTimer = null;
  let pendingTarget = null;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.settings) return;
    settingsRevision += 1;
    settings = normalizeSettings(changes.settings.newValue);
  });
  const initialRevision = settingsRevision;
  chrome.storage.local.get("settings").then((stored) => {
    if (settingsRevision === initialRevision) {
      settings = normalizeSettings(stored.settings);
    }
  }).catch(() => {});

  function replaceAtCaret(target) {
    if (replacing || !settings.enabled || !(target instanceof Element)) return;
    const editor = target.closest('[contenteditable="true"]');
    if (!editor || editor.getAttribute("role") !== "textbox" ||
        !(editor.getAttribute("aria-multiline") === "true" ||
          editor.getAttribute("data-lexical-editor") === "true")) return;

    const selection = document.getSelection();
    if (!selection || selection.rangeCount !== 1 || !selection.isCollapsed) return;
    const caret = selection.getRangeAt(0);
    if (!editor.contains(caret.endContainer)) return;

    const prefix = document.createRange();
    prefix.selectNodeContents(editor);
    prefix.setEnd(caret.endContainer, caret.endOffset);
    const fragment = prefix.cloneContents();
    fragment.querySelectorAll("br").forEach((lineBreak) => {
      lineBreak.replaceWith(document.createTextNode("\n"));
    });
    fragment.querySelectorAll("div, p, li").forEach((block) => {
      block.prepend(document.createTextNode("\n"));
    });
    const match = findReplacement(fragment.textContent, settings);
    if (!match) return;

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (prefix.intersectsNode(walker.currentNode)) nodes.push(walker.currentNode);
    }
    let remaining = match.length;
    const replacementRange = caret.cloneRange();
    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const node = nodes[index];
      const endOffset = node === caret.endContainer ? caret.endOffset : node.length;
      if (remaining <= endOffset) {
        replacementRange.setStart(node, endOffset - remaining);
        remaining = 0;
        break;
      }
      remaining -= endOffset;
    }
    if (remaining !== 0) return;

    replacing = true;
    try {
      selection.removeAllRanges();
      selection.addRange(replacementRange);
      if (!document.execCommand("insertText", false, match.emoji)) {
        selection.removeAllRanges();
        selection.addRange(caret);
      }
    } finally {
      replacing = false;
    }
  }

  function flushReplacement() {
    clearTimeout(replacementTimer);
    replacementTimer = null;
    const target = pendingTarget;
    pendingTarget = null;
    if (target) replaceAtCaret(target);
  }

  function scheduleReplacement(target) {
    clearTimeout(replacementTimer);
    pendingTarget = target;
    replacementTimer = setTimeout(flushReplacement, 0);
  }

  document.addEventListener("beforeinput", (event) => {
    if (!replacing && !event.isComposing && event.inputType === "insertText") {
      flushReplacement();
    }
  }, true);
  document.addEventListener("keydown", (event) => {
    if (!replacing && !event.isComposing && event.key === "Enter") {
      flushReplacement();
    }
  }, true);
  document.addEventListener("input", (event) => {
    if (replacing || event.isComposing || !["insertText", "insertCompositionText"].includes(event.inputType)) return;
    scheduleReplacement(event.target);
  }, true);
  document.addEventListener("compositionend", (event) => {
    if (!replacing) scheduleReplacement(event.target);
  }, true);
})();