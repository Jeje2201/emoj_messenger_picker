# Messenger Emoji

[Français](README.fr.md) | [English](README.md)

A Chrome Manifest V3 extension that replaces shortcuts as you type, only on **https://www.messenger.com/**.

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

Click the extension icon to add, edit, or delete **Texte / Emoji** (Text / Emoji) mappings, then click **Enregistrer** (Save). Emoji can be pasted or selected using the Windows emoji panel with **Win + .**. The switch disables replacement; save that change too. Settings apply to open Messenger tabs without reloading.

Shortcuts are literal and case-sensitive. They are replaced as soon as their last character is typed. Prefer a format such as `:sob:` to avoid replacing the beginning of a longer word. Pasted content and search fields are not modified. The extension does not send messages.

In the message editor, typing `:` displays configured mappings that start with `:`; continue typing to filter suggestions by shortcut prefix. Click a suggestion to replace the typed prefix with its emoji. Tab can also be used to navigate suggestions, Enter to select one, and Escape to close the panel. Disabling replacement also disables suggestions.

Legacy mappings enclosed in parentheses, including custom mappings, are converted to colons when settings are read. If both forms already exist, the colon mapping is kept. The conversion is saved when settings are saved; new custom shortcuts remain unrestricted.

## Privacy

The only additional permission is `storage`. Mappings remain in Chrome's local storage. There is no server, telemetry, or access to other sites. The script reads only the text before the cursor in the active editor while typing.

## Verification

Open `tests/browser.html` in a browser for the engine tests and a test editor. The **Tester les suggestions** (Test suggestions) button checks suggestion display, filtering, insertion, and disabling. Engine tests can also be run with Node.js 18 or later:

```sh
node --test tests/rules.test.cjs
```

To check in Messenger: type `:` followed by `c`, select a suggestion with the mouse, then type `Hello :sob:`. Add a mapping, save it, test it without reloading, then disable replacement and save. Also check that the sent message contains the emoji and that Ctrl+Z still works. Messenger may change its editor, so checking with a signed-in account remains necessary after its updates.

`extension/options.html` can be opened directly to preview the interface. This preview uses separate storage and does not configure the installed extension.

## Icons

Lucide icons under the ISC license, preserved in `extension/icons/LICENSE`.
