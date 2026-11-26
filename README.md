# Messenger Emoji

[Français](README.fr.md) | [English](README.md)

A Chrome Manifest V3 extension that replaces shortcuts as you type, only on **https://www.messenger.com/**.

<img width="654" height="190" alt="emojipicker" src="https://github.com/user-attachments/assets/8a8ed720-dd12-4c4e-bde5-74321b2447ab" />

## Installation

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project's `extension` folder, not its parent folder.
5. Reload any open Messenger tab.
6. Pin the extension from the extensions menu to access its settings.

No build or dependencies are required.

## After an update or if replacement does not work

1. In `chrome://extensions`, click the **Reload** button for Messenger Emoji.
2. Reload the **https://www.messenger.com/** tab to replace the previously injected script.
3. Open the settings from the extension icon in Chrome, not from the HTML preview file.
4. Check that automatic replacement is enabled, then click **Enregistrer** (Save).
5. Type `:sob:` in a conversation. The shortcut should become an emoji without sending the message.

## Shortcuts and settings

By default: `:cwl:` for laughing with tears, `:sob:` for crying, `:heart:` for a heart, `:smile:` for a smile, and `:thumbsup:` for a thumbs-up.

The extension interface follows Chrome's display language: English and French are included, with English as the fallback for other languages. No language switch is needed.

Click the extension icon to add, edit, or delete **Texte / Emoji** (Text / Emoji) mappings, then click **Enregistrer** (Save). Emoji can be pasted or selected using the Windows emoji panel with **Win + .**. The switch disables replacement; save that change too. Settings apply to open Messenger tabs without reloading.

Use **Tout vider** to remove every mapping, including imported emojis. After confirmation, it keeps the replacement switch and local catalogue; save to apply the change. The separate reset button restores the default mappings.

Shortcuts are literal and case-sensitive. They are replaced as soon as their last character is typed. Prefer a format such as `:sob:` to avoid replacing the beginning of a longer word. Pasted content and search fields are not modified. The extension does not send messages.

In the message editor, typing `:` displays configured mappings that start with `:`; continue typing to filter suggestions by shortcut prefix. While the suggestion panel is open, pressing Enter inserts the first matching emoji instead of sending the message (`Shift+Enter` still inserts a line break), and clicking a suggestion also replaces the typed prefix with its emoji. Tab can be used to navigate suggestions before pressing Enter, and Escape closes the panel. Disabling replacement also disables suggestions.

The settings page can refresh the public Unicode Emoji catalogue and import all missing emojis at once. Imported shortcuts are suggested from each Unicode English name (for example, `:melting_face:`); edit them as needed, then save. An emoji already mapped is left untouched, and shortcut conflicts are reported rather than overwritten. The catalogue is refreshed automatically when settings open if its local cache is more than seven days old; **Actualiser le catalogue** forces a refresh. Search helps manage a large imported list. Suggestions in Messenger show up to 40 matches at a time; type more of the shortcut to narrow them down.

Legacy mappings enclosed in parentheses, including custom mappings, are converted to colons when settings are read. If both forms already exist, the colon mapping is kept. The conversion is saved when settings are saved; new custom shortcuts remain unrestricted.

## Privacy

Mappings and the cached catalogue remain in Chrome's local storage. The extension requests access to `unicode.org` only to download the public [Unicode Emoji test data](https://unicode.org/Public/emoji/latest/emoji-test.txt); no settings or personal mappings are sent. There is no project server or telemetry, and content scripts still run only on Messenger. Unicode data is subject to the [Unicode terms of use](https://www.unicode.org/terms_of_use.html). The script reads only the text before the cursor in the active editor while typing.

## Verification

Open `tests/browser.html` in a browser for the engine tests and a test editor. The **Tester les suggestions** (Test suggestions) button checks suggestion display, filtering, Enter and click insertion, and disabling. Engine and catalogue import tests can be run with Node.js 18 or later:

```sh
node --test tests/*.test.cjs
```

To check in Messenger: type `:` followed by `c`, press Enter (or select a suggestion with the mouse) and confirm the emoji is inserted without sending the message, then type `Hello :sob:`. Add a mapping, save it, test it without reloading, then disable replacement and save. Also check that the sent message contains the emoji and that Ctrl+Z still works. Messenger may change its editor, so checking with a signed-in account remains necessary after its updates.

`extension/options.html` can be opened directly to preview the interface. Outside the installed extension it uses English fallback text and separate storage; it does not configure the installed extension.

## Icons

Lucide icons under the ISC license, preserved in `extension/icons/LICENSE`.
