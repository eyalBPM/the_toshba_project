import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface TipTapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
}

function collectInlineIds(content: unknown, nodeType: string, idAttr: string): Set<string> {
  const ids = new Set<string>();
  function walk(node: TipTapNode | unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as TipTapNode;
    if (n.type === nodeType) {
      const val = n.attrs?.[idAttr];
      if (typeof val === 'string') ids.add(val);
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }
  walk(content);
  return ids;
}

export interface ReferenceSnapshotEntry {
  articleId: string;
  slug: string;
  title: string;
}

export interface SourceSnapshotEntry {
  id: string;
  label: string;
}

export function deriveAbstractTopics(
  topicsSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(topicsSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'topicMark', 'topicId');
  return (topicsSnapshot as SnapshotTag[]).filter((t) => t && t.id && !bodyIds.has(t.id));
}

export function deriveAbstractSages(
  sagesSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(sagesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'sageMark', 'sageId');
  return (sagesSnapshot as SnapshotTag[]).filter((s) => s && s.id && !bodyIds.has(s.id));
}

export function deriveAbstractSources(
  sourcesSnapshot: unknown,
  content: unknown,
): SnapshotTag[] {
  if (!Array.isArray(sourcesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'sourceCitation', 'sourceId');
  return (sourcesSnapshot as SourceSnapshotEntry[])
    .filter((s) => s && s.id && !bodyIds.has(s.id))
    .map((s) => ({ id: s.id, text: s.label }));
}

export function deriveAbstractReferences(
  referencesSnapshot: unknown,
  content: unknown,
): ReferenceSnapshotEntry[] {
  if (!Array.isArray(referencesSnapshot)) return [];
  const bodyIds = collectInlineIds(content, 'referenceMark', 'articleId');
  return (referencesSnapshot as ReferenceSnapshotEntry[]).filter(
    (r) => r && r.articleId && !bodyIds.has(r.articleId),
  );
}
