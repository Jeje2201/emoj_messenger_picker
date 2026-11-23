(function () {
  "use strict";

  const { normalizeSettings, findReplacement, findSuggestions } = globalThis.MessengerEmojiRules;
  let settings = { enabled: false, mappings: [] };
  let replacing = false;
  let composing = false;
  let settingsRevision = 0;
  let replacementTimer = null;
  let pendingTarget = null;
  let pendingReplacement = false;
  let suggestionEditor = null;
  let suggestionCaret = null;
  let dismissed = false;
  const panel = document.createElement("div");
  panel.className = "messenger-emoji-suggestions";
  panel.setAttribute("aria-label", "Suggestions d'emoji");
  panel.hidden = true;
  document.documentElement.append(panel);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.settings) return;
    settingsRevision += 1;
    settings = normalizeSettings(changes.settings.newValue);
    updateSuggestions();
  });
  const initialRevision = settingsRevision;
  chrome.storage.local.get("settings").then((stored) => {
    if (settingsRevision === initialRevision) {
      settings = normalizeSettings(stored.settings);
      updateSuggestions();
    }
  }).catch(() => {});

  function editorFor(target) {
    if (!(target instanceof Element)) return null;
    const editor = target.closest('[contenteditable="true"]');
    if (!editor || editor.getAttribute("role") !== "textbox" ||
        !(editor.getAttribute("aria-multiline") === "true" ||
          editor.getAttribute("data-lexical-editor") === "true")) return null;
    return editor;
  }

  function contextAtCaret(editor) {
    if (!editor || !editor.isConnected) return null;
    const selection = document.getSelection();
    if (!selection || selection.rangeCount !== 1 || !selection.isCollapsed) return null;
    const caret = selection.getRangeAt(0);
    if (!editor.contains(caret.endContainer)) return null;

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
    return { editor, selection, caret, prefix, text: fragment.textContent };
  }

  function insertAtCaret(context, length, emoji) {
    const { editor, selection, caret, prefix } = context;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (prefix.intersectsNode(walker.currentNode)) nodes.push(walker.currentNode);
    }
    let remaining = length;
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
      if (!document.execCommand("insertText", false, emoji)) {
        selection.removeAllRanges();
        selection.addRange(caret);
        console.error("Messenger Emoji : insertion impossible.");
      }
    } finally {
      replacing = false;
    }
  }

  function hideSuggestions() {
    panel.hidden = true;
    suggestionEditor = null;
    suggestionCaret = null;
  }

  function positionSuggestions() {
    if (!suggestionEditor || panel.hidden) return;
    if (!suggestionEditor.isConnected) {
      hideSuggestions();
      return;
    }
    const rect = suggestionEditor.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) {
      hideSuggestions();
      return;
    }
    const width = Math.min(420, Math.max(0, innerWidth - 16));
    panel.style.width = `${width}px`;
    panel.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`;
    const above = rect.top - panel.offsetHeight - 8;
    const top = above >= 8 ? above : Math.min(Math.max(8, rect.bottom + 8), Math.max(8, innerHeight - panel.offsetHeight - 8));
    panel.style.top = `${top}px`;
  }

  function updateSuggestions() {
    const editor = editorFor(document.activeElement);
    const context = contextAtCaret(editor);
    const suggestions = context && !composing && !dismissed ? findSuggestions(context.text, settings) : null;
    if (!suggestions) {
      hideSuggestions();
      return;
    }
    suggestionEditor = editor;
    suggestionCaret = context.caret.cloneRange();
    const buttons = suggestions.mappings.map((mapping) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "messenger-emoji-suggestion";
      const emoji = document.createElement("span");
      emoji.className = "messenger-emoji-suggestion-icon";
      emoji.textContent = mapping.emoji;
      const shortcut = document.createElement("span");
      shortcut.textContent = mapping.shortcut;
      button.append(emoji, shortcut);
      button.addEventListener("pointerdown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        if (panel.contains(document.activeElement) && suggestionCaret && editor.isConnected) {
          const caret = suggestionCaret.cloneRange();
          editor.focus({ preventScroll: true });
          const selection = document.getSelection();
          selection.removeAllRanges();
          selection.addRange(caret);
        }
        const current = contextAtCaret(editor);
        const currentSuggestions = current && findSuggestions(current.text, settings);
        if (!currentSuggestions || !currentSuggestions.mappings.some((item) =>
          item.shortcut === mapping.shortcut && item.emoji === mapping.emoji)) {
          hideSuggestions();
          return;
        }
        hideSuggestions();
        insertAtCaret(current, currentSuggestions.length, mapping.emoji);
      });
      return button;
    });
    panel.replaceChildren(...buttons);
    panel.hidden = false;
    positionSuggestions();
  }

  function flushReplacement() {
    clearTimeout(replacementTimer);
    replacementTimer = null;
    const target = pendingTarget;
    const shouldReplace = pendingReplacement;
    pendingTarget = null;
    pendingReplacement = false;
    if (target && shouldReplace && !replacing && settings.enabled) {
      const context = contextAtCaret(editorFor(target));
      const match = context && findReplacement(context.text, settings);
      if (match) insertAtCaret(context, match.length, match.emoji);
    }
    updateSuggestions();
  }

  function scheduleReplacement(target, shouldReplace) {
    clearTimeout(replacementTimer);
    pendingTarget = target;
    pendingReplacement = shouldReplace;
    replacementTimer = setTimeout(flushReplacement, 0);
  }

  document.addEventListener("beforeinput", (event) => {
    if (!replacing && !event.isComposing && event.inputType === "insertText") {
      flushReplacement();
    }
  }, true);
  document.addEventListener("keydown", (event) => {
    if (!replacing && !event.isComposing && event.key === "Enter" && !panel.contains(event.target)) {
      flushReplacement();
    }
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      event.stopPropagation();
      if (panel.contains(document.activeElement) && suggestionEditor) {
        suggestionEditor.focus({ preventScroll: true });
      }
      dismissed = true;
      hideSuggestions();
    }
    if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.altKey &&
        !event.metaKey && !panel.hidden && document.activeElement === suggestionEditor) {
      event.preventDefault();
      panel.querySelector("button").focus();
    }
  }, true);
  document.addEventListener("input", (event) => {
    if (replacing || event.isComposing) return;
    dismissed = false;
    scheduleReplacement(event.target, ["insertText", "insertCompositionText"].includes(event.inputType));
  }, true);
  document.addEventListener("compositionstart", () => {
    composing = true;
    hideSuggestions();
  }, true);
  document.addEventListener("compositionend", (event) => {
    composing = false;
    dismissed = false;
    if (!replacing) scheduleReplacement(event.target, true);
  }, true);
  document.addEventListener("selectionchange", () => {
    if (!replacing && !replacementTimer && !panel.contains(document.activeElement)) updateSuggestions();
  });
  document.addEventListener("focusin", (event) => {
    if (!panel.contains(event.target)) updateSuggestions();
  }, true);
  window.addEventListener("scroll", positionSuggestions, true);
  window.addEventListener("resize", positionSuggestions);
})();
