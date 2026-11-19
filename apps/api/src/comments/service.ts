import type {
  CommentRepository,
  ReportState,
  Transactor,
} from './repository.js';

export const HIDE_AT_REPORTS = 3;

// naive: read, add one, write, without a transaction or lock (the lost-update
// race, kept for the demo). locked: the same steps in one transaction that
// locks the row first.
export type ReportMode = 'naive' | 'locked';

export interface ReportResult {
  reportCount: number;
  hidden: boolean;
}

export interface CommentService {
  // undefined: there is no such comment.
  report: (commentId: string) => Promise<ReportResult | undefined>;
}

interface CommentServiceDependencies {
  comments: CommentRepository;
  transaction: Transactor;
  reportMode: ReportMode;
}

export function createCommentService({
  comments,
  transaction,
  reportMode,
}: CommentServiceDependencies): CommentService {
  // Read-modify-write in TypeScript. Only safe if nobody else can change the
  // row between the read and the write, i.e. with `lock` inside a transaction.
  async function addReport(
    repository: CommentRepository,
    commentId: string,
    lock: boolean
  ): Promise<ReportResult | undefined> {
    const current = await repository.findReportState(commentId, { lock });
    if (current === undefined) return undefined;

    const reportCount = current.reportCount + 1;
    const next: ReportState = {
      reportCount,
      hiddenAt:
        current.hiddenAt ??
        (reportCount >= HIDE_AT_REPORTS ? new Date().toISOString() : null),
    };
    await repository.saveReportState(commentId, next);
    return { reportCount, hidden: next.hiddenAt !== null };
  }

  return {
    report: async (commentId) =>
      reportMode === 'naive'
        ? await addReport(comments, commentId, false)
        : // The service decides that reading and writing form one unit; the
          // repository only knows how to read with a lock and how to write.
          await transaction(
            async (tx) => await addReport(tx.comments, commentId, true)
          ),
  };
}
