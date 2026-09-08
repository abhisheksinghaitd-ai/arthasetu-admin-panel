import { useState } from "react";
import { ROLES } from "../lib/rbac.js";
import PageHeader from "../components/PageHeader.jsx";
import Chip from "../components/Chip.jsx";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "security", label: "Security" },
];

function DetailGrid({ items }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-[11.5px] font-semibold tracking-wide text-[var(--slate)]">{k}</div>
          <div className="mt-1 text-[14.5px] text-[var(--ink)]">{v}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   SettingsPage — props {user}
   Ported from legacy SettingsPage (~line 2121): a profile tab, a
   role/permission-matrix tab, and a security tab.
   --------------------------------------------------------------- */
export default function SettingsPage({ user }) {
  const [tab, setTab] = useState("profile");

  return (
    <div>
      <PageHeader
        title="Admin Settings"
        breadcrumb={["Admin Settings"]}
        description="Manage your admin profile, role permissions, and platform preferences."
      />

      <div className="mb-5 flex flex-wrap gap-1 border-b border-[var(--sage-line)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "border-b-2 px-4 py-2.5 text-[13.5px] font-semibold transition-colors " +
              (tab === t.key
                ? "border-[var(--green-mid)] text-[var(--green-deep)]"
                : "border-transparent text-[var(--slate)] hover:text-[var(--ink)]")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <DetailGrid
            items={[
              ["NAME", user?.name || <span className="italic text-[var(--amber)]">Not Available</span>],
              ["EMAIL", user?.email || <span className="italic text-[var(--amber)]">Not Available</span>],
              ["ROLE", <Chip tone="brass">{user?.role}</Chip>],
              ["SESSION", "Active — expires after 30 min idle"],
            ]}
          />
        </div>
      )}

      {tab === "roles" && (
        <div className="overflow-hidden rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className="whitespace-nowrap border-b border-[var(--sage-line)] bg-[#FAFAF7] px-4 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]">
                    ROLE
                  </th>
                  <th className="border-b border-[var(--sage-line)] bg-[#FAFAF7] px-4 py-3 text-left text-[12px] font-semibold tracking-wide text-[var(--slate)]">
                    PERMISSIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ROLES).map(([role, def]) => (
                  <tr key={role} className="border-b border-[#EFF1EE] align-top">
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[var(--ink)]">{role}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {def.perms.map((p) => (
                          <Chip key={p} tone="slate">
                            {p}
                          </Chip>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--sage-line)] px-4 py-3 text-[12px] text-[var(--slate)]">
            Note: this permission matrix is the platform&rsquo;s internal role/permission simulation and is
            keyed separately from the six RBAC display roles offered at login.
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="rounded-lg border border-[var(--sage-line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <DetailGrid
            items={[
              ["AUTHENTICATION", "Session-based (JWT)"],
              ["PASSWORD HASHING", "bcrypt (server-side)"],
              ["SESSION EXPIRY", "30 minutes idle timeout"],
              ["2FA", <Chip tone="slate">NOT CONFIGURED</Chip>],
            ]}
          />
        </div>
      )}
    </div>
  );
}
