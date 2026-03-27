import { Extension } from '@tiptap/core';

/**
 * Registers Shift+2/3/4/5 keyboard shortcuts.
 * Each shortcut emits a custom editor event that React components listen to
 * via editor.on('openXxxPanel'), keeping extension logic decoupled from React state.
 */
export const KeyboardTriggersExtension = Extension.create({
  name: 'keyboardTriggers',

  addKeyboardShortcuts() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emit = (event: string) => (this.editor as any).emit(event, {});
    return {
      'Shift-2': () => { emit('openSourcesPanel'); return true; },
      'Shift-3': () => { emit('openTopicsPanel'); return true; },
      'Shift-4': () => { emit('openReferencesPanel'); return true; },
      'Shift-5': () => { emit('openSagesPanel'); return true; },
    };
  },
});
