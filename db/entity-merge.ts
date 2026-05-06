import { prisma } from './prisma';
import type { Prisma } from '@/db/generated/prisma/client';

type Tx = Prisma.TransactionClient;

interface SnapshotEntry {
  id: string;
  text: string;
}

interface MergeKindConfig {
  /** AuditLog action name. */
  auditAction: 'TOPICS_MERGED' | 'SAGES_MERGED';
  /** AuditLog entityType. */
  entityType: 'Topic' | 'Sage';
  /** Field name in ArticleSnapshot JSON ("topicsSnapshot" / "sagesSnapshot"). */
  snapshotField: 'topicsSnapshot' | 'sagesSnapshot';
  /** TipTap node type for inline mentions ("topicMark" / "sageMark"). */
  markType: 'topicMark' | 'sageMark';
  /** Attr key holding the entity id on the mark node. */
  idAttr: 'topicId' | 'sageId';
  /** Attr key holding the display text on the mark node. */
  textAttr: 'topicText' | 'sageText';
  loadById: (tx: Tx, id: string) => Promise<{ id: string; text: string } | null>;
  deleteById: (tx: Tx, id: string) => Promise<unknown>;
}

const TOPIC_KIND: MergeKindConfig = {
  auditAction: 'TOPICS_MERGED',
  entityType: 'Topic',
  snapshotField: 'topicsSnapshot',
  markType: 'topicMark',
  idAttr: 'topicId',
  textAttr: 'topicText',
  loadById: (tx, id) => tx.topic.findUnique({ where: { id }, select: { id: true, text: true } }),
  deleteById: (tx, id) => tx.topic.delete({ where: { id } }),
};

const SAGE_KIND: MergeKindConfig = {
  auditAction: 'SAGES_MERGED',
  entityType: 'Sage',
  snapshotField: 'sagesSnapshot',
  markType: 'sageMark',
  idAttr: 'sageId',
  textAttr: 'sageText',
  loadById: (tx, id) => tx.sage.findUnique({ where: { id }, select: { id: true, text: true } }),
  deleteById: (tx, id) => tx.sage.delete({ where: { id } }),
};

export interface MergeEntityInput {
  victimId: string;
  winnerId: string;
  actingUserId: string;
}

export interface MergeEntityResult {
  victimId: string;
  victimText: string;
  winnerId: string;
  winnerText: string;
  affectedSnapshots: number;
  affectedRevisions: number;
}

export class EntityMergeNotFoundError extends Error {
  readonly code = 'ENTITY_NOT_FOUND' as const;
  constructor(message: string) {
    super(message);
  }
}

export class EntityMergeSameIdError extends Error {
  readonly code = 'SAME_ID' as const;
  constructor() {
    super('Cannot merge an entity into itself');
  }
}

function remapSnapshotArray(
  arr: unknown,
  victimId: string,
  winner: SnapshotEntry,
): { changed: boolean; value: SnapshotEntry[] } {
  if (!Array.isArray(arr)) return { changed: false, value: [] };
  let containsVictim = false;
  const seenIds = new Set<string>();
  const next: SnapshotEntry[] = [];
  for (const raw of arr) {
    if (raw && typeof raw === 'object' && 'id' in raw) {
      const item = raw as { id: unknown; text?: unknown };
      const id = typeof item.id === 'string' ? item.id : '';
      const text = typeof item.text === 'string' ? item.text : '';
      if (id === victimId) {
        containsVictim = true;
        if (!seenIds.has(winner.id)) {
          seenIds.add(winner.id);
          next.push({ id: winner.id, text: winner.text });
        }
      } else if (id === winner.id) {
        if (!seenIds.has(winner.id)) {
          seenIds.add(winner.id);
          next.push({ id: winner.id, text: winner.text });
        }
      } else if (id) {
        if (!seenIds.has(id)) {
          seenIds.add(id);
          next.push({ id, text });
        }
      }
    }
  }
  return { changed: containsVictim, value: next };
}

interface ContentNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  [key: string]: unknown;
}

function rewriteContentMarks(
  node: unknown,
  cfg: MergeKindConfig,
  victimId: string,
  winner: SnapshotEntry,
): { changed: boolean; value: unknown } {
  if (!node || typeof node !== 'object') return { changed: false, value: node };
  const n = node as ContentNode;

  if (
    n.type === cfg.markType &&
    n.attrs &&
    n.attrs[cfg.idAttr] === victimId
  ) {
    return {
      changed: true,
      value: {
        ...n,
        attrs: {
          ...n.attrs,
          [cfg.idAttr]: winner.id,
          [cfg.textAttr]: winner.text,
        },
      },
    };
  }

  if (Array.isArray(n.content)) {
    let childChanged = false;
    const newContent = n.content.map((child) => {
      const res = rewriteContentMarks(child, cfg, victimId, winner);
      if (res.changed) childChanged = true;
      return res.value as ContentNode;
    });
    if (childChanged) {
      return { changed: true, value: { ...n, content: newContent } };
    }
  }

  return { changed: false, value: node };
}

async function mergeEntity(
  cfg: MergeKindConfig,
  input: MergeEntityInput,
): Promise<MergeEntityResult> {
  if (input.victimId === input.winnerId) {
    throw new EntityMergeSameIdError();
  }

  return prisma.$transaction(async (tx) => {
    const [winner, victim] = await Promise.all([
      cfg.loadById(tx, input.winnerId),
      cfg.loadById(tx, input.victimId),
    ]);
    if (!winner) throw new EntityMergeNotFoundError(`Winner ${cfg.entityType} not found`);
    if (!victim) throw new EntityMergeNotFoundError(`Victim ${cfg.entityType} not found`);

    // NOTE: in-memory scan over all snapshots/revisions inside the transaction.
    // Acceptable while content volume is small. Future optimization: filter by
    // JSONB containment (`@>`) via raw SQL once snapshot count grows.
    const snapshots = await tx.articleSnapshot.findMany({
      select: { id: true, [cfg.snapshotField]: true },
    });

    let affectedSnapshots = 0;
    for (const snap of snapshots) {
      const arr = (snap as Record<string, unknown>)[cfg.snapshotField];
      const { changed, value } = remapSnapshotArray(arr, input.victimId, winner);
      if (!changed) continue;
      await tx.articleSnapshot.update({
        where: { id: snap.id },
        data: { [cfg.snapshotField]: value },
      });
      affectedSnapshots += 1;
    }

    const revisions = await tx.articleRevision.findMany({
      select: { id: true, content: true },
    });

    let affectedRevisions = 0;
    for (const rev of revisions) {
      const { changed, value } = rewriteContentMarks(rev.content, cfg, input.victimId, winner);
      if (!changed) continue;
      await tx.articleRevision.update({
        where: { id: rev.id },
        data: { content: value as object },
      });
      affectedRevisions += 1;
    }

    await cfg.deleteById(tx, input.victimId);

    await tx.auditLog.create({
      data: {
        action: cfg.auditAction,
        entityType: cfg.entityType,
        entityId: winner.id,
        userId: input.actingUserId,
        metadata: {
          victimId: victim.id,
          victimText: victim.text,
          winnerId: winner.id,
          winnerText: winner.text,
          affectedSnapshots,
          affectedRevisions,
        },
      },
    });

    return {
      victimId: victim.id,
      victimText: victim.text,
      winnerId: winner.id,
      winnerText: winner.text,
      affectedSnapshots,
      affectedRevisions,
    };
  });
}

export function mergeTopicsTransaction(input: MergeEntityInput): Promise<MergeEntityResult> {
  return mergeEntity(TOPIC_KIND, input);
}

export function mergeSagesTransaction(input: MergeEntityInput): Promise<MergeEntityResult> {
  return mergeEntity(SAGE_KIND, input);
}
