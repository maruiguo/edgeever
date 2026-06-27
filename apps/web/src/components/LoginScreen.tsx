import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginScreenProps {
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (payload: { username: string; password: string }) => void;
}

export const LoginScreen = ({ error, isSubmitting, onSubmit }: LoginScreenProps) => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      return;
    }

    onSubmit({ username: username.trim(), password });
  };

  return (
    <main className="flex h-[100dvh] items-center justify-center bg-emerald-50 px-4 py-8 text-slate-950">
      <section className="w-full max-w-[380px] rounded-md border border-emerald-100 bg-white p-5 shadow-panel">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-100 text-emerald-900">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight tracking-normal">登录 EdgeEver</h1>
            <p className="mt-1 text-sm text-slate-500">自托管笔记工作区</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">账号</span>
            <input
              autoComplete="username"
              className="h-10 w-full rounded-md border border-emerald-100 bg-emerald-50/50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">密码</span>
            <input
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-emerald-100 bg-emerald-50/50 px-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <div className="rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          <Button className="w-full justify-center" size="md" type="submit" variant="solid" disabled={isSubmitting}>
            <LockKeyhole className="h-4 w-4" />
            {isSubmitting ? "登录中" : "登录"}
          </Button>
        </form>
      </section>
    </main>
  );
};
