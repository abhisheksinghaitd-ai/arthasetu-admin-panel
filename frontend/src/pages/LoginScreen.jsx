import { useState } from "react";
import { api, setAuthToken } from "../api.js";
import { RBAC_ROLES } from "../lib/rbac.js";

/* ---------------------------------------------------------------
   LoginScreen — props {onLogin}
   Ported from legacy LoginScreen (~line 494). This is the front
   door of the portal, redesigned to read as calm and authoritative
   rather than a startup sign-in page — but the demo-mode contract
   is preserved exactly: any email + any password works, a role is
   picked from the 6 RBAC roles, "remember me" and "forgot password"
   are present, and a backend-unreachable notice falls back to local
   demo data while still calling onLogin with the same shape App.jsx
   expects: {email, name, role[, adminRef, stateScope]}.
   --------------------------------------------------------------- */
export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(RBAC_ROLES[0]);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);

  async function submit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email/username and password.");
      return;
    }
    setLoading(true);
    setOfflineNotice(false);
    try {
      const data = await api.login(email, password, role);
      setAuthToken(data.access_token);
      onLogin({
        email: data.admin.email,
        name: data.admin.name,
        role: data.admin.role,
        adminRef: data.admin.admin_ref,
        stateScope: data.admin.state_scope,
        remember,
      });
    } catch (err) {
      // Backend not reachable / not deployed yet — fall back to local demo
      // mode so the UI keeps working during frontend-only development.
      setOfflineNotice(true);
      const namePart = email.split("@")[0].replace(/[._]+/g, " ").trim();
      const displayName = namePart
        ? namePart.split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
        : "Admin User";
      onLogin({ email, name: displayName, role, remember });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[var(--paper)]">
      {/* Informational panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-[var(--green-deep)] px-12 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #FFFFFF 0px, #FFFFFF 1px, transparent 1px, transparent 34px)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--brass)] bg-white/5 text-[18px] font-bold tracking-wide text-[var(--brass)]">
              AS
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-wide">ArthaSetu</div>
              <div className="text-[12px] text-white/65">Admin Console</div>
            </div>
          </div>

          <h1 className="mt-14 max-w-sm text-[26px] font-bold leading-snug">
            Scheme &amp; Channel Partner Administration Platform
          </h1>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70">
            A unified console for administering NSFDC loan schemes, channel partner onboarding and status,
            citizen applications, and the partner-routing model — with a complete, auditable trail of every
            administrative action.
          </p>
        </div>

        <div className="relative space-y-3 border-t border-white/15 pt-6 text-[12.5px] text-white/60">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-[var(--brass)]">•</span>
            Role-based access control across six administrative roles.
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-[var(--brass)]">•</span>
            Every block, suspension, and resolution is recorded to the audit log.
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-[var(--brass)]">•</span>
            Built for the Smart India Hackathon — demo environment.
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--brass)] bg-[var(--brass-soft)] text-[16px] font-bold text-[var(--brass)]">
              AS
            </div>
            <div>
              <div className="text-[15px] font-bold text-[var(--green-deep)]">ArthaSetu</div>
              <div className="text-[12px] text-[var(--slate)]">Admin Console</div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-8 shadow-[var(--shadow-premium)]">
            <h2 className="text-[19px] font-bold text-[var(--ink)]">
              {forgotOpen ? "Reset password" : "Sign in to the admin console"}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--slate)]">
              {forgotOpen
                ? "Password resets are handled by the Identity & Access team."
                : "Authorized personnel only. Access is logged and monitored."}
            </p>

            {forgotOpen ? (
              <div className="mt-6">
                <div className="rounded border border-[var(--sage-line)] bg-[var(--green-soft)] px-4 py-3.5 text-[13.5px] leading-relaxed text-[var(--sage)]">
                  Password reset requests are handled by the platform&rsquo;s Identity &amp; Access team.
                  Contact your Super Admin to receive a reset link.
                </div>
                <button
                  type="button"
                  className="mt-5 w-full rounded bg-[var(--green-mid)] py-2.5 text-[14px] font-semibold text-white hover:bg-[var(--green-deep)]"
                  onClick={() => setForgotOpen(false)}
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form className="mt-6" onSubmit={submit}>
                {error && (
                  <div className="mb-4 rounded border border-[#E3B7AC] bg-[var(--rust-soft)] px-3.5 py-2.5 text-[13px] text-[var(--rust)]">
                    {error}
                  </div>
                )}
                {offlineNotice && (
                  <div className="mb-4 rounded border border-[var(--sage-line)] bg-[var(--amber-soft)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--amber)]">
                    Backend not reachable — signed in with local demo data instead.
                  </div>
                )}

                <div className="mb-4">
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--sage)]">
                    Admin Email / Username
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@arthasetu.gov.in"
                    autoComplete="username"
                    className="w-full rounded border border-[var(--sage-line)] bg-[#FCFCFA] px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--sage)]">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded border border-[var(--sage-line)] bg-[#FCFCFA] px-3.5 py-2.5 pr-16 text-[14.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] font-bold tracking-wide text-[var(--green-mid)]"
                    >
                      {showPw ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--sage)]">Role (RBAC)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded border border-[var(--sage-line)] bg-white px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] focus:border-[var(--green-mid)] focus:outline-none"
                  >
                    {RBAC_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[13px] text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 accent-[var(--green-mid)]"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[var(--green-mid)] hover:underline"
                    onClick={() => setForgotOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded bg-[var(--green-mid)] py-2.75 text-[14.5px] font-semibold text-white hover:bg-[var(--green-deep)] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ paddingTop: "11px", paddingBottom: "11px" }}
                >
                  {loading ? "Signing in…" : "Log In"}
                </button>
              </form>
            )}
          </div>

          <p className="mt-5 text-center text-[12px] leading-relaxed text-[var(--slate)]">
            This is a demonstration environment built for the Smart India Hackathon. If the admin backend is
            unavailable, the console signs you in with local demo data so evaluation is not interrupted.
          </p>
        </div>
      </div>
    </div>
  );
}
