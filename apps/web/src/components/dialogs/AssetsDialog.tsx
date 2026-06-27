import { useQuery } from "@tanstack/react-query";
import { Archive, HardDrive, ImageIcon, File as FileIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${exponent === 0 ? value.toFixed(0) : value.toFixed(value >= 10 ? 1 : 2)} ${units[exponent]}`;
};

export const AssetsDialog = ({ onClose }: { onClose: () => void }) => {
  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: () => api.listResources(),
  });
  const resources = resourcesQuery.data?.resources ?? [];
  const summary = resourcesQuery.data?.summary ?? {
    totalCount: 0,
    totalBytes: 0,
    imageCount: 0,
    attachmentCount: 0,
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[760px] p-0 overflow-hidden border border-slate-200 bg-white shadow-lg rounded-lg">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Archive className="h-4 w-4 text-emerald-700" />
              附件
            </DialogTitle>
            <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5" />
                {formatBytes(summary.totalBytes)}
              </span>
              <span>{summary.totalCount} files</span>
              <span>{summary.imageCount} images</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {resourcesQuery.isLoading ? (
            <div className="px-2 py-8 text-center text-sm text-slate-500">加载中</div>
          ) : resources.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              暂无附件
            </div>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  className="flex min-h-16 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-emerald-700">
                    {resource.kind === "image" ? <ImageIcon className="h-5 w-5" /> : <FileIcon className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-950">
                      {resource.filename || resource.id}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {formatBytes(resource.byteSize)} · {resource.mimeType ?? resource.kind} ·{" "}
                      {formatDateTime(resource.createdAt)}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-400">
                      {resource.memoDeleted
                        ? "已删除笔记"
                        : resource.memoTitle || resource.memoExcerpt || resource.memoId}
                    </span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
