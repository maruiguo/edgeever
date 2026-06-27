import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Code2,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getActiveBlockValue } from "@/lib/app-helpers";

const EditorToolbarButton = ({
  active = false,
  children,
  disabled = false,
  onClick,
  title,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) => (
  <button
    className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-slate-700 transition disabled:pointer-events-none disabled:opacity-40",
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50"
    )}
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active || undefined}
    disabled={disabled}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <div className="h-6 w-px shrink-0 bg-slate-200" />;

export const EditorToolbar = ({ editor, readOnly }: { editor: Editor | null; readOnly: boolean }) => {
  const disabled = readOnly || !editor;
  const blockValue = getActiveBlockValue(editor);

  const canRun = (command: (editor: Editor) => boolean) => {
    if (!editor || readOnly) {
      return false;
    }
    return command(editor);
  };

  const run = (command: (editor: Editor) => void) => {
    if (!editor || readOnly) {
      return;
    }
    command(editor);
  };

  const setBlock = (value: string) => {
    run((current) => {
      const chain = current.chain().focus();

      if (value === "paragraph") {
        chain.setParagraph().run();
        return;
      }

      if (value === "heading-1") {
        chain.setHeading({ level: 1 }).run();
        return;
      }

      if (value === "heading-2") {
        chain.setHeading({ level: 2 }).run();
        return;
      }

      if (value === "heading-3") {
        chain.setHeading({ level: 3 }).run();
      }
    });
  };

  return (
    <div className="relative border-t border-slate-200 bg-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-white to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-white to-transparent sm:hidden" />
      <div
        className="flex min-h-12 items-center gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
        role="toolbar"
        aria-label="编辑器工具栏"
      >
        <Select
          value={blockValue}
          disabled={disabled}
          onValueChange={(value) => setBlock(value)}
        >
          <SelectTrigger className="h-8 w-28 text-xs text-slate-800 border-slate-200 bg-white">
            <SelectValue placeholder="正文" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200 rounded-md py-1 shadow-md">
            <SelectItem value="paragraph">正文</SelectItem>
            <SelectItem value="heading-1">标题 1</SelectItem>
            <SelectItem value="heading-2">标题 2</SelectItem>
            <SelectItem value="heading-3">标题 3</SelectItem>
          </SelectContent>
        </Select>

        <ToolbarDivider />
        <EditorToolbarButton
          title="撤销"
          disabled={!canRun((current) => current.can().chain().focus().undo().run())}
          onClick={() => run((current) => current.chain().focus().undo().run())}
        >
          <Undo2 className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="重做"
          disabled={!canRun((current) => current.can().chain().focus().redo().run())}
          onClick={() => run((current) => current.chain().focus().redo().run())}
        >
          <Redo2 className="h-4 w-4" />
        </EditorToolbarButton>

        <ToolbarDivider />
        <EditorToolbarButton
          title="加粗"
          active={Boolean(editor?.isActive("bold"))}
          disabled={!canRun((current) => current.can().chain().focus().toggleBold().run())}
          onClick={() => run((current) => current.chain().focus().toggleBold().run())}
        >
          <Bold className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="斜体"
          active={Boolean(editor?.isActive("italic"))}
          disabled={!canRun((current) => current.can().chain().focus().toggleItalic().run())}
          onClick={() => run((current) => current.chain().focus().toggleItalic().run())}
        >
          <Italic className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="删除线"
          active={Boolean(editor?.isActive("strike"))}
          disabled={!canRun((current) => current.can().chain().focus().toggleStrike().run())}
          onClick={() => run((current) => current.chain().focus().toggleStrike().run())}
        >
          <Strikethrough className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="行内代码"
          active={Boolean(editor?.isActive("code"))}
          disabled={!canRun((current) => current.can().chain().focus().toggleCode().run())}
          onClick={() => run((current) => current.chain().focus().toggleCode().run())}
        >
          <Code2 className="h-4 w-4" />
        </EditorToolbarButton>

        <ToolbarDivider />
        <EditorToolbarButton
          title="无序列表"
          active={Boolean(editor?.isActive("bulletList"))}
          disabled={disabled}
          onClick={() => run((current) => current.chain().focus().toggleBulletList().run())}
        >
          <List className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="有序列表"
          active={Boolean(editor?.isActive("orderedList"))}
          disabled={disabled}
          onClick={() => run((current) => current.chain().focus().toggleOrderedList().run())}
        >
          <ListOrdered className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="引用"
          active={Boolean(editor?.isActive("blockquote"))}
          disabled={disabled}
          onClick={() => run((current) => current.chain().focus().toggleBlockquote().run())}
        >
          <Quote className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="代码块"
          active={Boolean(editor?.isActive("codeBlock"))}
          disabled={disabled}
          onClick={() => run((current) => current.chain().focus().toggleCodeBlock().run())}
        >
          <SquareCode className="h-4 w-4" />
        </EditorToolbarButton>
        <EditorToolbarButton
          title="分割线"
          disabled={disabled}
          onClick={() => run((current) => current.chain().focus().setHorizontalRule().run())}
        >
          <Minus className="h-4 w-4" />
        </EditorToolbarButton>
      </div>
    </div>
  );
};
