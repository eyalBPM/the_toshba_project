'use client';

import type { Editor } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

export const TableExtensions = [
  Table.configure({ resizable: true, allowTableNodeSelection: true }),
  TableRow,
  TableHeader,
  TableCell,
];

export function insertTable(editor: Editor) {
  editor
    .chain()
    .focus()
    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    .run();
}
