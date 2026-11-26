"use strict";

const fallbackMessages = {
  htmlLang: "en",
  statusUnsaved: "Unsaved changes",
  shortcutRequired: "Enter a shortcut.",
  shortcutDuplicate: "This shortcut already exists.",
  emojiRequired: "Enter an emoji.",
  catalogRefreshing: "Refreshing the Unicode catalogue...",
  catalogInfo: "Unicode catalogue $1: $2 emojis.",
  catalogUpdated: "Updated.",
  catalogRefreshErrorCached: "Could not update; the local copy ($1) was kept.",
  catalogRefreshErrorNoCache: "Catalogue unavailable. Check your connection and try again.",
  catalogRefreshLog: "Messenger Emoji: could not refresh the catalogue.",
  catalogImportSummary: "$1 added, $2 already present, $3 shortcut conflict(s).",
  catalogConflictSummary: " Conflicting shortcuts: $1",
  catalogMoreConflicts: ", and others.",
  catalogSaveAfterImport: " Save to keep the import.",
  previewMode: "Local preview",
  confirmReset: "Restore the default mappings?",
  confirmClearAll: "Delete all mappings, including imported emojis? Your replacement setting and Unicode catalogue will be kept.",
  saved: "Saved",
  previewSaved: "Local preview saved",
  saveError: "Could not save. Try again.",
  previewCatalogUnavailable: "The catalogue is available in the installed extension.",
  catalogRecentlyUpdated: "Recently updated.",
  settingsLoadError: "Could not load settings. Reopen the extension.",
};

function getMessage(key, substitutions) {
  const normalizedSubstitutions = Array.isArray(substitutions)
    ? substitutions.map(String)
    : substitutions === undefined ? undefined : String(substitutions);
  const localized = globalThis.chrome?.i18n?.getMessage(key, normalizedSubstitutions);
  if (localized) return localized;
  const values = normalizedSubstitutions === undefined ? [] :
    Array.isArray(normalizedSubstitutions) ? normalizedSubstitutions : [normalizedSubstitutions];
  return values.reduce((text, value, index) =>
    text.split(`$${index + 1}`).join(String(value)), fallbackMessages[key] || key);
}

function localizeDocument() {
  if (!globalThis.chrome?.i18n?.getMessage) {
    document.documentElement.lang = "en";
    return;
  }
  document.documentElement.lang = getMessage("htmlLang");
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getMessage(element.dataset.i18n);
  });
  ["title", "aria-label", "placeholder", "alt"].forEach((attribute) => {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
      element.setAttribute(attribute, getMessage(element.getAttribute(`data-i18n-${attribute}`)));
    });
  });
}

localizeDocument();

const { defaults, normalizeSettings } = globalThis.MessengerEmojiRules;
const { sourceUrl, parseEmojiTest, mergeMissingMappings, isValidCatalog } =
  globalThis.MessengerEmojiCatalog;
const form = document.querySelector("#settings-form");
const list = document.querySelector("#mappings");
const enabled = document.querySelector("#enabled");
const status = document.querySelector("#status");
const mappingSearch = document.querySelector("#mapping-search");
const catalogStatus = document.querySelector("#catalog-status");
const refreshCatalogButton = document.querySelector("#refresh-catalog");
const importCatalogButton = document.querySelector("#import-catalog");
const clearAllButton = document.querySelector("#clear-all");
const storage = globalThis.chrome?.storage?.local;
const catalogRefreshInterval = 7 * 24 * 60 * 60 * 1000;
let dirty = false;
let saving = false;
let catalog = null;
let refreshingCatalog = false;

function showStatus(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

function updateCount() {
  document.querySelector("#mapping-count").textContent = list.children.length;
  document.querySelector("#empty").hidden = list.children.length !== 0;
  clearAllButton.disabled = list.children.length === 0 || saving;
}

function filterMappings() {
  const query = mappingSearch.value.trim().toLocaleLowerCase();
  let visibleCount = 0;
  for (const row of list.children) {
    const shortcut = row.querySelector(".shortcut-input").value;
    const emoji = row.querySelector(".emoji-input").value;
    row.hidden = query !== "" &&
      !`${shortcut} ${emoji}`.toLocaleLowerCase().includes(query);
    if (!row.hidden) visibleCount += 1;
  }
  document.querySelector("#search-empty").hidden =
    list.children.length === 0 || visibleCount !== 0;
}

function markDirty() {
  dirty = true;
  showStatus(getMessage("statusUnsaved"));
}

function createRow(mapping = { shortcut: "", emoji: "" }) {
  const row = document.querySelector("#mapping-template").content.firstElementChild.cloneNode(true);
  row.querySelector(".shortcut-input").value = mapping.shortcut;
  row.querySelector(".emoji-input").value = mapping.emoji;
  row.querySelector(".delete-button").addEventListener("click", () => {
    const next = row.nextElementSibling || row.previousElementSibling;
    row.remove();
    updateCount();
    markDirty();
    (next?.querySelector(".shortcut-input") || document.querySelector("#add")).focus();
  });
  return row;
}

function appendRows(mappings) {
  const fragment = document.createDocumentFragment();
  mappings.forEach((mapping) => fragment.append(createRow(mapping)));
  list.append(fragment);
  updateCount();
  filterMappings();
}

function addRow(mapping = { shortcut: "", emoji: "" }, focus = false) {
  const row = createRow(mapping);
  list.append(row);
  updateCount();
  filterMappings();
  if (focus) row.querySelector(".shortcut-input").focus();
}

function render(settings) {
  enabled.checked = settings.enabled;
  list.replaceChildren();
  appendRows(settings.mappings);
}

function setCatalogStatus(message, error = false) {
  catalogStatus.textContent = message;
  catalogStatus.dataset.error = String(error);
}

function setCatalogControls() {
  refreshCatalogButton.disabled = !storage || refreshingCatalog || saving;
  importCatalogButton.disabled = !catalog || refreshingCatalog || saving;
}

function describeCatalog() {
  return getMessage("catalogInfo", [catalog.version, catalog.entries.length]);
}

async function refreshCatalog() {
  if (!storage || refreshingCatalog) return;
  refreshingCatalog = true;
  setCatalogControls();
  setCatalogStatus(getMessage("catalogRefreshing"));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(sourceUrl, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`R\u00E9ponse HTTP ${response.status}`);
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error("Le fichier du catalogue est trop volumineux.");
    const parsed = parseEmojiTest(text);
    if (parsed.entries.length < 100) throw new Error("Le catalogue Unicode semble incomplet.");
    const updatedCatalog = { ...parsed, fetchedAt: Date.now() };
    await storage.set({ emojiCatalog: updatedCatalog });
    catalog = updatedCatalog;
    setCatalogStatus(`${describeCatalog()} ${getMessage("catalogUpdated")}`);
  } catch (error) {
    const message = catalog
      ? getMessage("catalogRefreshErrorCached", catalog.version)
      : getMessage("catalogRefreshErrorNoCache");
    setCatalogStatus(message, true);
    console.error(getMessage("catalogRefreshLog"), error);
  } finally {
    clearTimeout(timeout);
    refreshingCatalog = false;
    setCatalogControls();
  }
}

function importMissingEmojis() {
  if (!catalog || saving) return;
  const existingMappings = readMappings();
  if (!existingMappings) return;
  const result = mergeMissingMappings(existingMappings, catalog.entries);
  const addedMappings = result.mappings.slice(existingMappings.length);
  if (addedMappings.length) {
    appendRows(addedMappings);
    markDirty();
  }
  const conflictDetails = result.conflictDetails.map(({ shortcut, emoji, name }) =>
    shortcut ? `${shortcut} (${emoji})` : name || emoji)
    .filter(Boolean);
  const conflictSummary = conflictDetails.length
    ? getMessage("catalogConflictSummary", conflictDetails.join(", ")) +
      (result.conflicts > conflictDetails.length ? getMessage("catalogMoreConflicts") : "")
    : "";
  setCatalogStatus(getMessage("catalogImportSummary", [
    result.added, result.alreadyPresent, result.conflicts,
  ]) + conflictSummary + (result.added ? getMessage("catalogSaveAfterImport") : ""));
}

function readMappings() {
  const seen = new Set();
  const mappings = [];
  let firstInvalid = null;
  for (const row of list.children) {
    const shortcutInput = row.querySelector(".shortcut-input");
    const emojiInput = row.querySelector(".emoji-input");
    const shortcut = shortcutInput.value;
    const emoji = emojiInput.value;
    const shortcutError = !shortcut.trim() ? getMessage("shortcutRequired") :
      seen.has(shortcut) ? getMessage("shortcutDuplicate") : "";
    const emojiError = !emoji.trim() ? getMessage("emojiRequired") : "";
    shortcutInput.setCustomValidity(shortcutError);
    emojiInput.setCustomValidity(emojiError);
    shortcutInput.setAttribute("aria-invalid", String(Boolean(shortcutError)));
    emojiInput.setAttribute("aria-invalid", String(Boolean(emojiError)));
    firstInvalid ||= shortcutError ? shortcutInput : emojiError ? emojiInput : null;
    seen.add(shortcut);
    mappings.push({ shortcut, emoji });
  }
  if (firstInvalid) {
    firstInvalid.reportValidity();
    showStatus(firstInvalid.validationMessage, true);
    return null;
  }
  return mappings;
}

form.addEventListener("input", (event) => {
  if (event.target === mappingSearch) {
    filterMappings();
    return;
  }
  if (event.target instanceof HTMLInputElement) {
    event.target.setCustomValidity("");
    event.target.removeAttribute("aria-invalid");
    filterMappings();
  }
  markDirty();
});
refreshCatalogButton.addEventListener("click", refreshCatalog);
importCatalogButton.addEventListener("click", importMissingEmojis);
document.querySelector("#add").addEventListener("click", () => {
  mappingSearch.value = "";
  addRow(undefined, true);
  markDirty();
});
document.querySelector("#reset").addEventListener("click", () => {
  if (!confirm(getMessage("confirmReset"))) return;
  render({ ...defaults, enabled: enabled.checked });
  markDirty();
});
clearAllButton.addEventListener("click", () => {
  if (!confirm(getMessage("confirmClearAll"))) return;
  mappingSearch.value = "";
  render({ enabled: enabled.checked, mappings: [] });
  markDirty();
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;
  const mappings = readMappings();
  if (!mappings) return;
  const settings = { formatVersion: 2, enabled: enabled.checked, mappings };
  saving = true;
  const controls = [...form.querySelectorAll("button, input")];
  controls.forEach((control) => { control.disabled = true; });
  try {
    if (storage) await storage.set({ settings });
    else localStorage.setItem("messenger-emoji-preview", JSON.stringify(settings));
    dirty = false;
    showStatus(getMessage(storage ? "saved" : "previewSaved"));
  } catch {
    showStatus(getMessage("saveError"), true);
  } finally {
    saving = false;
    controls.forEach((control) => { control.disabled = false; });
    updateCount();
    setCatalogControls();
  }
});
globalThis.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

async function initialize() {
  try {
    const stored = storage ? await storage.get(["settings", "emojiCatalog"]) : {
      settings: JSON.parse(localStorage.getItem("messenger-emoji-preview") || "null"),
    };
    catalog = storage && isValidCatalog(stored.emojiCatalog) ? stored.emojiCatalog : null;
    render(normalizeSettings(stored.settings));
    form.querySelectorAll("button, input").forEach((control) => { control.disabled = false; });
    updateCount();
    setCatalogControls();
    showStatus(storage ? "" : getMessage("previewMode"));
    if (!storage) {
      setCatalogStatus(getMessage("previewCatalogUnavailable"));
    } else if (!catalog || Date.now() - catalog.fetchedAt > catalogRefreshInterval) {
      void refreshCatalog();
    } else {
      setCatalogStatus(`${describeCatalog()} ${getMessage("catalogRecentlyUpdated")}`);
    }
  } catch {
    showStatus(getMessage("settingsLoadError"), true);
  }
}
initialize();