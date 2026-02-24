# Tabs To-Do (Chrome extension)

This small extension saves all tabs in the current window as to-do items. You can mark a task as "Complete" which will attempt to close the associated tab. Completed tasks can be removed. Also, this list can be arranged by priority; items are draggable and keep their place even after every edit. This can be done in multiple windows, and the list will interact with all windows and save all the needed tabs.

How to load locally for testing:

1. Open Chrome and go to `chrome://extensions`.
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select the `todo-tabs-extension` folder inside your workspace.
4. Click the extension action (top-right) to open the popup. Use "Save Current Window Tabs" to capture tasks.

Files:
- [todo-tabs-extension/manifest.json](manifest.json)
- [todo-tabs-extension/popup.html](popup.html)
- [todo-tabs-extension/popup.js](popup.js)
- [todo-tabs-extension/styles.css](styles.css)

Notes:
- The extension uses `chrome.storage.local` to persist tasks.
- Permissions: `tabs` and `storage` are required to read/close tabs and persist tasks.
