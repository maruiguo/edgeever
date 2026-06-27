import { LayoutList, File as FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export type MemoTemplate = {
  id: string;
  title: string;
  description: string;
  contentMarkdown: string;
  tags: string[];
};

export const MEMO_TEMPLATES: MemoTemplate[] = [
  {
    id: "quick-note",
    title: "速记",
    description: "适合临时记录想法、链接和灵感。",
    contentMarkdown: "## 速记\n\n- \n\n## 后续动作\n\n- [ ] ",
    tags: ["template", "quick-note"],
  },
  {
    id: "meeting",
    title: "会议记录",
    description: "议题、结论和待办放在同一页。",
    contentMarkdown: "## 会议记录\n\n时间：\n参与人：\n\n## 议题\n\n- \n\n## 结论\n\n- \n\n## 待办\n\n- [ ] ",
    tags: ["template", "meeting"],
  },
  {
    id: "checklist",
    title: "清单",
    description: "快速列出待办、采购、项目检查项。",
    contentMarkdown: "## 清单\n\n- [ ] \n- [ ] \n- [ ] ",
    tags: ["template", "checklist"],
  },
  {
    id: "reading",
    title: "读书笔记",
    description: "摘录、观点和下一步阅读整理。",
    contentMarkdown: "## 读书笔记\n\n书名：\n作者：\n\n## 摘录\n\n> \n\n## 我的观点\n\n\n## 延伸问题\n\n- ",
    tags: ["template", "reading"],
  },
  {
    id: "daily",
    title: "每日复盘",
    description: "记录今天完成了什么、卡在哪里。",
    contentMarkdown: "## 每日复盘\n\n## 今天完成\n\n- \n\n## 遇到的问题\n\n- \n\n## 明天优先级\n\n- [ ] ",
    tags: ["template", "daily"],
  },
];

export const TemplatesDialog = ({
  canCreateMemo,
  isCreating,
  onClose,
  onCreateMemo,
}: {
  canCreateMemo: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreateMemo: (template: MemoTemplate) => void;
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !isCreating) onClose(); }}>
      <DialogContent className="max-w-[620px] p-0 overflow-hidden border border-slate-200 bg-white shadow-lg rounded-lg">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <LayoutList className="h-4 w-4 text-emerald-700" />
              模板
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500">
              选择一个模板，直接创建新笔记。
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {MEMO_TEMPLATES.map((template) => (
              <button
                key={template.id}
                className="group flex min-h-28 flex-col rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                type="button"
                disabled={!canCreateMemo || isCreating}
                onClick={() => onCreateMemo(template)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-emerald-700 transition group-hover:border-slate-300">
                  <FileIcon className="h-4 w-4" />
                </span>
                <span className="mt-3 text-sm font-semibold text-slate-950">{template.title}</span>
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{template.description}</span>
              </button>
            ))}
          </div>
          {!canCreateMemo && (
            <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              当前无法创建笔记，请先选择可用笔记本。
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
