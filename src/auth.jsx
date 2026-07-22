import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase.js'

// ── Colors (shared with dashboard) ────────────────────────────
const C = {
  bg: "#0f0f0f", surface: "#1a1a1a", border: "#2a2a2a",
  text: "#e8e4de", textMuted: "#8a8580", textDim: "#5a5550",
  accent: "#e8a849", accentSoft: "rgba(232,168,73,0.12)",
  green: "#5cb87a", red: "#d46b6b",
};
const fonts = { serif: "'Fraunces', serif", sans: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

// ── Auth Context ──────────────────────────────────────────────
export const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: fonts.sans, color: C.textMuted, fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Login Page ────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: fonts.sans,
    }}>
      {/* Background gradient */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 400, background: `radial-gradient(ellipse at 50% 0%, ${C.accentSoft} 0%, transparent 60%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 400, padding: "0 20px" }}>
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: fonts.serif, fontSize: 42, fontWeight: 300, color: C.text, margin: 0, fontStyle: "italic" }}>Hamza</h1>
          <p style={{ fontFamily: fonts.sans, fontSize: 13, color: C.textDim, marginTop: 8 }}>Time Will Tell</p>
        </div>

        {/* Login card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32,
        }}>
          <h2 style={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: 500, color: C.text, margin: "0 0 24px", textAlign: "center" }}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          {error && (
            <div style={{ background: `${C.red}18`, border: `1px solid ${C.red}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontFamily: fonts.sans, fontSize: 13, color: C.red }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ background: `${C.green}18`, border: `1px solid ${C.green}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontFamily: fonts.sans, fontSize: 13, color: C.green }}>
              {message}
            </div>
          )}

          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontFamily: fonts.sans, fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.text, fontFamily: fonts.sans, fontSize: 14, padding: "12px 14px",
                  outline: "none", boxSizing: "border-box", transition: "border-color .2s",
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: fonts.sans, fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.text, fontFamily: fonts.sans, fontSize: 14, padding: "12px 14px",
                  outline: "none", boxSizing: "border-box", transition: "border-color .2s",
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
                onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", background: C.accent, border: "none", borderRadius: 10,
                color: C.bg, fontFamily: fonts.sans, fontSize: 14, fontWeight: 600,
                padding: "12px 0", cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1, transition: "opacity .2s",
              }}
            >
              {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              style={{
                background: "none", border: "none", color: C.accent, fontFamily: fonts.sans,
                fontSize: 13, cursor: "pointer", textDecoration: "underline",
              }}
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Supabase-backed useStore hook ─────────────────────────────
// This replaces the old window.storage hook.
// Data is saved to Supabase in real-time and syncs across devices.

const _cache = {}; // In-memory cache to reduce DB reads

export function useStore(key, init) {
  const [val, setVal] = useState(init);
  const [ready, setReady] = useState(false);
  const saveTimeout = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setReady(true); return; }

        // Check cache first
        const cacheKey = `${user.id}:${key}`;
        if (_cache[cacheKey] !== undefined) {
          if (!cancelled) setVal(_cache[cacheKey]);
          if (!cancelled) setReady(true);
          return;
        }

        const { data, error } = await supabase
          .from('user_data')
          .select('value')
          .eq('user_id', user.id)
          .eq('key', key)
          .single();

        if (!cancelled && data && data.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          setVal(parsed);
          _cache[cacheKey] = parsed;
        }
      } catch {
        // Key doesn't exist yet, use initial value
      }
      if (!cancelled) setReady(true);
    };

    load();
    return () => { cancelled = true; };
  }, [key]);

  // Save to Supabase with debounce (300ms)
  useEffect(() => {
    if (!ready) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const cacheKey = `${user.id}:${key}`;
        _cache[cacheKey] = val;

        await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            key: key,
            value: JSON.stringify(val),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,key' });
      } catch (e) {
        console.error('Save error:', e);
      }
    }, 300);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [key, val, ready]);

  return [val, setVal];
}
