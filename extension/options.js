"use strict";

const { defaults, normalizeSettings } = globalThis.MessengerEmojiRules;
const form = document.querySelector("#settings-form");
const list = document.querySelector("#mappings");
const enabled = document.querySelector("#enabled");
const status = document.querySelector("#status");
const storage = globalThis.chrome?.storage?.local;
let dirty = false;
let saving = false;

function showStatus(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

function updateCount() {
  document.querySelector("#mapping-count").textContent = list.children.length;
  document.querySelector("#empty").hidden = list.children.length !== 0;
}

function markDirty() {
  dirty = true;
  showStatus("Modifications non enregistr\u00E9es");
}

function addRow(mapping = { shortcut: "", emoji: "" }, focus = false) {
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
  list.append(row);
  updateCount();
  if (focus) row.querySelector(".shortcut-input").focus();
}

function render(settings) {
  enabled.checked = settings.enabled;
  list.replaceChildren();
  settings.mappings.forEach((mapping) => addRow(mapping));
  updateCount();
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
    const shortcutError = !shortcut.trim() ? "Saisissez un raccourci." :
      seen.has(shortcut) ? "Ce raccourci existe d\u00E9j\u00E0." : "";
    const emojiError = !emoji.trim() ? "Saisissez un emoji." : "";
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
  if (event.target instanceof HTMLInputElement) {
    event.target.setCustomValidity("");
    event.target.removeAttribute("aria-invalid");
  }
  markDirty();
});
document.querySelector("#add").addEventListener("click", () => {
  addRow(undefined, true);
  markDirty();
});
document.querySelector("#reset").addEventListener("click", () => {
  if (!confirm("R\u00E9tablir les associations par d\u00E9faut ?")) return;
  render({ ...defaults, enabled: enabled.checked });
  markDirty();
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;
  const mappings = readMappings();
  if (!mappings) return;
  const settings = { enabled: enabled.checked, mappings };
  saving = true;
  const controls = [...form.querySelectorAll("button, input")];
  controls.forEach((control) => { control.disabled = true; });
  try {
    if (storage) await storage.set({ settings });
    else localStorage.setItem("messenger-emoji-preview", JSON.stringify(settings));
    dirty = false;
    showStatus(storage ? "Enregistr\u00E9" : "Aper\u00E7u local enregistr\u00E9");
  } catch {
    showStatus("Enregistrement impossible. R\u00E9essayez.", true);
  } finally {
    saving = false;
    controls.forEach((control) => { control.disabled = false; });
  }
});
globalThis.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

async function initialize() {
  try {
    const stored = storage ? await storage.get("settings") : {
      settings: JSON.parse(localStorage.getItem("messenger-emoji-preview") || "null"),
    };
    render(normalizeSettings(stored.settings));
    form.querySelectorAll("button, input").forEach((control) => { control.disabled = false; });
    showStatus(storage ? "" : "Aper\u00E7u local");
  } catch {
    showStatus("Chargement impossible. Rouvrez l'extension.", true);
  }
}
initialize();