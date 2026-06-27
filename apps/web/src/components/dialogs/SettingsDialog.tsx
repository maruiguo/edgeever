import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import { AppConfirmDialog } from "./ConfirmDialogs";
import type { ApiToken } from "@edgeever/shared";

const DEFAULT_TOKEN_SCOPES = ["read:notebooks", "read:memos", "read:tags"];

export const SettingsDialog = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("MCP Agent");
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(() => new Set(DEFAULT_TOKEN_SCOPES));
  const [createdToken, setCreatedToken] = useState<{ token: string; apiToken: ApiToken } | null>(null);
  const [tokenRevokeConfirmation, setTokenRevokeConfirmation] = useState<ApiToken | null>(null);

  const tokensQuery = useQuery({
    queryKey: ["api-tokens"],
    queryFn: () => api.listApiTokens(),
  });

  const availableScopes = tokensQuery.data?.availableScopes ?? [
    "read:notebooks",
    "write:notebooks",
    "read:memos",
    "write:memos",
    "read:resources",
    "write:resources",
    "read:tags",
    "write:tags",
  ];

  const createMutation = useMutation({
    mutationFn: api.createApiToken,
    onSuccess: async (data) => {
      setCreatedToken(data);
      setName("");
      setSelectedScopes(new Set(DEFAULT_TOKEN_SCOPES));
      await queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: api.revokeApiToken,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
  });

  const tokens = tokensQuery.data?.apiTokens ?? [];

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) => {
      const next = new Set(current);
      if (next.has(scope)) {
        next.delete(scope);
      } else {
        next.add(scope);
      }
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const scopes = Array.from(selectedScopes);

    if (!name.trim() || scopes.length === 0) {
      return;
    }

    createMutation.mutate({ name: name.trim(), scopes });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !tokenRevokeConfirmation) onClose(); }}>
      <DialogContent className="max-w-[820px] p-0 overflow-hidden border border-slate-200 bg-white shadow-lg rounded-lg">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <KeyRound className="h-4 w-4 text-emerald-700" />
              设置
            </DialogTitle>
            <DialogDescription className="mt-1 truncate text-xs text-slate-500">
              API Token / MCP
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {createdToken && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-950">
                <ShieldCheck className="h-4 w-4" />
                Token 已生成
              </div>
              <div className="flex gap-2">
                <input
                  className="h-9 min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-3 font-mono text-xs text-slate-900 outline-none"
                  readOnly
                  value={createdToken.token}
                />
                <Button
                  size="sm"
                  variant="solid"
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(createdToken.token)}
                >
                  复制
                </Button>
              </div>
              <div className="mt-2 text-xs text-emerald-800">明文 Token 只显示这一次。</div>
            </div>
          )}

          <form className="mb-5 rounded-md border border-slate-200 bg-slate-50 p-3" onSubmit={handleSubmit}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-300"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Token 名称"
              />
              <Button size="md" variant="solid" type="submit" disabled={createMutation.isPending}>
                <KeyRound className="h-4 w-4" />
                生成 Token
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableScopes.map((scope) => (
                <label
                  key={scope}
                  className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedScopes.has(scope)}
                    onChange={() => toggleScope(scope)}
                    className="h-4 w-4 shrink-0 rounded border-emerald-300 text-emerald-600"
                  />
                  <span className="min-w-0 truncate font-mono text-xs">{scope}</span>
                </label>
              ))}
            </div>
          </form>

          <div className="space-y-2">
            {tokensQuery.isLoading ? (
              <div className="px-2 py-8 text-center text-sm text-slate-500">加载中</div>
            ) : tokens.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                暂无 API Token
              </div>
            ) : (
              tokens.map((token) => (
                <div
                  key={token.id}
                  className={cn(
                    "flex min-h-16 items-center gap-3 rounded-md border px-3 py-2",
                    token.isRevoked ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 bg-white"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-950">{token.name}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {token.scopes.join(", ") || "no scopes"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {token.lastUsedAt ? `Last used ${formatDateTime(token.lastUsedAt)}` : "Never used"}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={token.isRevoked || revokeMutation.isPending}
                    onClick={() => setTokenRevokeConfirmation(token)}
                  >
                    撤销
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>

      {tokenRevokeConfirmation && (
        <AppConfirmDialog
          title={`撤销 Token「${tokenRevokeConfirmation.name}」`}
          description="撤销后，正在使用这个 Token 的 MCP 或 Agent 客户端将无法继续访问。"
          confirmLabel="撤销"
          isWorking={revokeMutation.isPending}
          tone="danger"
          onCancel={() => setTokenRevokeConfirmation(null)}
          onConfirm={() => {
            revokeMutation.mutate(tokenRevokeConfirmation.id, {
              onSuccess: () => setTokenRevokeConfirmation(null),
            });
          }}
        />
      )}
    </Dialog>
  );
};
