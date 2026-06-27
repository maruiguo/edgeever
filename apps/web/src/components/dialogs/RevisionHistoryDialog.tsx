import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { History, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import { getMemoTitle } from "@/lib/app-helpers";
import { AppConfirmDialog } from "./ConfirmDialogs";
import type { MemoDetail } from "@edgeever/shared";

const summarizeMarkdownDiff = (left: string, right: string) => {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const maxLines = Math.max(leftLines.length, rightLines.length);
  let changed = 0;

  for (let index = 0; index < maxLines; index += 1) {
    if ((leftLines[index] ?? "") !== (rightLines[index] ?? "")) {
      changed += 1;
    }
  }

  return { changed };
};

const formatRevisionActor = (actor: string) => {
  if (actor.startsWith("user:")) {
    return "user";
  }

  if (actor.startsWith("agent:")) {
    return "agent";
  }

  return actor || "system";
};

export const RevisionPreview = ({ title, markdown }: { title: string; markdown: string }) => (
  <div className="min-h-[260px] border-b border-slate-200 p-4 sm:border-b-0 sm:border-r">
    <div className="mb-3 text-xs font-semibold uppercase text-slate-500">{title}</div>
    <pre className="max-h-[54dvh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
      {markdown || "空笔记"}
    </pre>
  </div>
);

export const RevisionHistoryDialog = ({
  memo,
  currentMarkdown,
  onClose,
  onRestored,
}: {
  memo: MemoDetail;
  currentMarkdown: string;
  onClose: () => void;
  onRestored: (memo: MemoDetail) => Promise<void>;
}) => {
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [restoreRevisionConfirmationId, setRestoreRevisionConfirmationId] = useState<string | null>(null);

  const revisionsQuery = useQuery({
    queryKey: ["memo-revisions", memo.id],
    queryFn: () => api.listMemoRevisions(memo.id),
  });

  const revisions = revisionsQuery.data?.revisions ?? [];
  const selectedRevision =
    revisions.find((revision) => revision.id === selectedRevisionId) ?? revisions[0] ?? null;

  const diffSummary = useMemo(
    () => summarizeMarkdownDiff(selectedRevision?.contentMarkdown ?? "", currentMarkdown),
    [currentMarkdown, selectedRevision?.contentMarkdown]
  );

  const restoreMutation = useMutation({
    mutationFn: (revisionId: string) => api.restoreMemoRevision(memo.id, revisionId),
    onSuccess: async (data) => {
      setRestoreRevisionConfirmationId(null);
      await onRestored(data.memo);
    },
  });

  useEffect(() => {
    if (!selectedRevisionId && revisions.length > 0) {
      setSelectedRevisionId(revisions[0].id);
    }
  }, [revisions, selectedRevisionId]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !restoreRevisionConfirmationId) onClose(); }}>
      <DialogContent className="max-w-[980px] p-0 overflow-hidden border border-slate-200 bg-white shadow-lg rounded-lg">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <History className="h-4 w-4 text-emerald-700" />
              版本历史
            </DialogTitle>
            <DialogDescription className="mt-1 truncate text-xs text-slate-500">
              {getMemoTitle(memo.title)}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[280px_minmax(0,1fr)] sm:grid-rows-1">
          <aside className="min-h-0 border-b border-slate-200 p-3 sm:border-b-0 sm:border-r max-h-[220px] sm:max-h-[60vh] overflow-y-auto">
            {revisionsQuery.isLoading ? (
              <div className="px-2 py-8 text-center text-sm text-slate-500">加载中</div>
            ) : revisions.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                暂无历史版本
              </div>
            ) : (
              <div className="space-y-2">
                {revisions.map((revision) => (
                  <button
                    key={revision.id}
                    className={cn(
                      "block w-full rounded-md border px-3 py-2 text-left transition",
                      selectedRevision?.id === revision.id
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                    onClick={() => setSelectedRevisionId(revision.id)}
                  >
                    <span className="block text-sm font-semibold text-slate-950">
                      Revision {revision.revision}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {formatDateTime(revision.createdAt)}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-400">
                      {formatRevisionActor(revision.createdBy)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 bg-slate-50/50">
              <div className="text-xs font-medium text-slate-500">
                {selectedRevision ? `${diffSummary.changed} changed lines` : "No revision selected"}
              </div>
              <Button
                size="sm"
                variant="solid"
                disabled={!selectedRevision || memo.isDeleted || restoreMutation.isPending}
                onClick={() => {
                  if (selectedRevision) {
                    setRestoreRevisionConfirmationId(selectedRevision.id);
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" />
                恢复该版本
              </Button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto sm:grid-cols-2 max-h-[50vh]">
              <RevisionPreview title="历史版本" markdown={selectedRevision?.contentMarkdown ?? ""} />
              <RevisionPreview title="当前内容" markdown={currentMarkdown} />
            </div>
          </div>
        </div>
      </DialogContent>

      {restoreRevisionConfirmationId && (
        <AppConfirmDialog
          title="恢复到这个历史版本"
          description="当前内容会被这个历史版本替换，恢复后仍会产生新的历史记录。"
          confirmLabel="恢复"
          isWorking={restoreMutation.isPending}
          tone="primary"
          onCancel={() => setRestoreRevisionConfirmationId(null)}
          onConfirm={() => restoreMutation.mutate(restoreRevisionConfirmationId)}
        />
      )}
    </Dialog>
  );
};
