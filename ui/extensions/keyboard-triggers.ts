import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

/**
 * Registers Shift+2/3/4/5 keyboard shortcuts.
 * Uses event.code (physical key) so it works regardless of keyboard layout
 * (English / Hebrew) and bypasses prosemirror-keymap's name-matching, which
 * can't match "Shift-2" because the produced key is "@" not "2".
 */
const CODE_TO_EVENT: Record<string, string> = {
  Digit2: 'openSourcesPanel',
  Digit3: 'openTopicsPanel',
  Digit4: 'openReferencesPanel',
  Digit5: 'openSagesPanel',
};

export const KeyboardTriggersExtension = Extension.create({
  name: 'keyboardTriggers',

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        props: {
          handleKeyDown(_view, event) {
            if (!event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
              return false;
            }
            const eventName = CODE_TO_EVENT[event.code];
            if (!eventName) return false;
            event.preventDefault();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editor as any).emit(eventName, {});
            return true;
          },
        },
      }),
    ];
  },
});
