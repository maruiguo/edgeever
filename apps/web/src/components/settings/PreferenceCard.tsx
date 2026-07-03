import { Image } from "lucide-react";
import type { ShortcutSettings } from "@/lib/app-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ShortcutSettingsItem } from "./ShortcutSettingsItem";

interface PreferenceCardProps {
  imageCompressionEnabled: boolean;
  onImageCompressionChange: (enabled: boolean) => void;
  shortcutSettings: ShortcutSettings;
  onShortcutSettingsChange: (settings: ShortcutSettings) => void;
}

export const PreferenceCard = ({
  imageCompressionEnabled,
  onImageCompressionChange,
  shortcutSettings,
  onShortcutSettingsChange,
}: PreferenceCardProps) => (
  <Card className="w-full min-w-0 overflow-hidden shadow-none">
    <CardHeader className="p-4">
      <CardTitle className="flex items-center gap-2 text-sm">
        <Image className="h-4 w-4 text-emerald-700" />
        偏好设置
      </CardTitle>
    </CardHeader>
    <CardContent className="grid gap-3 p-4 pt-0">
      <div className="flex min-h-14 flex-col items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">压缩笔记内图片</div>
          <div className="mt-0.5 text-xs leading-4 text-slate-500">上传大图时在本地压缩，节省资源占用。</div>
        </div>
        <div className="flex w-full shrink-0 justify-start sm:w-32">
          <Switch
            checked={imageCompressionEnabled}
            onCheckedChange={onImageCompressionChange}
            aria-label="是否压缩笔记内图片"
          />
        </div>
      </div>
      <ShortcutSettingsItem
        shortcutSettings={shortcutSettings}
        onShortcutSettingsChange={onShortcutSettingsChange}
      />
    </CardContent>
  </Card>
);
