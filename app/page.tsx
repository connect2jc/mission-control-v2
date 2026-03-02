"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const Dashboard = dynamic(() => import("./Dashboard"), { ssr: false });

const TOKEN_KEY = "mc-session-token";

function AuthGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const validatePassword = useMutation(api.auth.validatePassword);
  const sessionCheck = useQuery(
    api.auth.checkSession,
    token ? { token } : "skip"
  );

  // Load saved token on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (saved) {
      setToken(saved);
    } else {
      setChecking(false);
    }
  }, []);

  // Once sessionCheck resolves, update checking state
  useEffect(() => {
    if (token && sessionCheck !== undefined) {
      setChecking(false);
    }
  }, [token, sessionCheck]);

  const isAuthed = token !== null && sessionCheck?.valid === true;

  // Clear invalid tokens
  useEffect(() => {
    if (token && sessionCheck && !sessionCheck.valid) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [token, sessionCheck]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-secondary)] text-sm">Loading...</div>
      </div>
    );
  }

  if (isAuthed) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const result = await validatePassword({ password: input });
      if (result.success && result.token) {
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
      } else {
        setError(true);
        setInput("");
      }
    } catch {
      setError(true);
      setInput("");
    } finally {
      setLoading(false);
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
          disabled={loading}
          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors disabled:opacity-50"
        />
        {error && <p className="text-xs text-[var(--accent-red)] mt-2">Wrong password</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 px-3 py-2 bg-[var(--accent-blue)] rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Checking..." : "Enter"}
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
