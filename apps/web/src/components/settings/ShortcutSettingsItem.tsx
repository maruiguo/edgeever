import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import type { ShortcutAction, ShortcutBinding, ShortcutSettings } from "@/lib/app-helpers";
import {
  DEFAULT_SHORTCUT_SETTINGS,
  formatShortcutBinding,
  shortcutBindingFromKeyboardEvent,
  shortcutBindingsEqual,
  SHORTCUT_ACTION_OPTIONS,
} from "@/lib/app-helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ShortcutSettingsItemProps {
  shortcutSettings: ShortcutSettings;
  onShortcutSettingsChange: (settings: ShortcutSettings) => void;
}

const getConflictAction = (
  action: ShortcutAction,
  binding: ShortcutBinding,
  settings: ShortcutSettings
) => SHORTCUT_ACTION_OPTIONS.find((item) => item.value !== action && shortcutBindingsEqual(settings[item.value], binding));

export const ShortcutSettingsItem = ({ shortcutSettings, onShortcutSettingsChange }: ShortcutSettingsItemProps) => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);
  const [captureMessage, setCaptureMessage] = useState("");
  const captureButtonRef = useRef<HTMLButtonElement | null>(null);

  const shortcutSummary = useMemo(
    () =>
      SHORTCUT_ACTION_OPTIONS.map((item) => formatShortcutBinding(shortcutSettings[item.value]))
        .slice(0, 3)
        .join(" / "),
    [shortcutSettings]
  );

  useEffect(() => {
    if (!recordingAction) {
      return;
    }

    captureButtonRef.current?.focus();
  }, [recordingAction]);

  useEffect(() => {
    if (!recordingAction) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setRecordingAction(null);
        setCaptureMessage("");
        return;
      }

      const nextBinding = shortcutBindingFromKeyboardEvent(event);
      if (!nextBinding) {
        setCaptureMessage("请按下包含 Ctrl、⌘ 或 Alt 的组合键。");
        return;
      }

      const conflictAction = getConflictAction(recordingAction, nextBinding, shortcutSettings);
      if (conflictAction) {
        setCaptureMessage(`这个组合键已用于「${conflictAction.label}」。`);
        return;
      }

      onShortcutSettingsChange({
        ...shortcutSettings,
        [recordingAction]: nextBinding,
      });
      setRecordingAction(null);
      setCaptureMessage("");
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [onShortcutSettingsChange, recordingAction, shortcutSettings]);

  const handleResetShortcuts = () => {
    onShortcutSettingsChange(DEFAULT_SHORTCUT_SETTINGS);
    setRecordingAction(null);
    setCaptureMessage("");
  };

  return (
    <>
      <div className="flex min-h-14 flex-col items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Keyboard className="h-4 w-4 text-emerald-700" />
            绑定快捷键
          </div>
          <div className="mt-0.5 truncate text-xs leading-4 text-slate-500">{shortcutSummary}</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-full bg-white px-3 text-xs sm:w-auto"
          type="button"
          onClick={() => setShortcutsOpen(true)}
        >
          管理
        </Button>
      </div>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-h-[min(640px,calc(100vh-2rem))] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-emerald-700" />
              绑定快捷键
            </DialogTitle>
            <DialogDescription>为常用笔记动作设置组合键。按 Esc 可取消当前录制。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {SHORTCUT_ACTION_OPTIONS.map((item) => {
              const recording = recordingAction === item.value;

              return (
                <div
                  key={item.value}
                  className="flex min-w-0 flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                    <div className="mt-0.5 text-xs leading-4 text-slate-500">{item.description}</div>
                  </div>
                  <Button
                    ref={recording ? captureButtonRef : null}
                    type="button"
                    variant={recording ? "solid" : "outline"}
                    className={cn("h-9 min-w-32 px-3 font-mono text-xs", !recording && "bg-white")}
                    onClick={() => {
                      setRecordingAction(item.value);
                      setCaptureMessage("");
                    }}
                  >
                    {recording ? "输入组合键" : formatShortcutBinding(shortcutSettings[item.value])}
                  </Button>
                </div>
              );
            })}
          </div>

          {captureMessage ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              {captureMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleResetShortcuts}>
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
