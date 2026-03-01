"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const Dashboard = dynamic(() => import("./Dashboard"), { ssr: false });

const PASSWORD = "maveric2026";
const STORAGE_KEY = "mc-auth";

function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  if (authed) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 w-80">
        <div className="text-center mb-6">
          <span className="text-4xl">🛰️</span>
          <h1 className="text-lg font-bold mt-2">Mission Control</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Enter password to continue</p>
        </div>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
        />
        {error && <p className="text-xs text-[var(--accent-red)] mt-2">Wrong password</p>}
        <button
          type="submit"
          className="w-full mt-4 px-3 py-2 bg-[var(--accent-blue)] rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Enter
        </button>
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
