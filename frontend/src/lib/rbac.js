/* ============================================================
   RBAC — roles and permission matrix (frontend simulation).

   NOTE: the legacy monolith keyed this permission map by five
   internal role names ("Data Admin", "Scheme Admin", "Partner
   Admin", "ML/Admin Analyst", "Read Only Admin") that did NOT
   match any of the six role labels actually offered on the login
   screen (RBAC_ROLES below) — only "Super Admin" lined up. Since
   can(user, perm) looks up ROLES[user.role], every RBAC-gated
   button in the app was silently hidden for 5 of the 6 selectable
   roles, regardless of what that role is meant to be allowed to
   do. Fixed by keying ROLES directly by the RBAC_ROLES labels,
   with permissions matching the project's own RBAC spec (PDF §3).
   ============================================================ */

export const ROLES = {
  "Super Admin": {perms: ["view_all","edit_schemes","edit_partners","manage_users","manage_api","manage_admins","delete","audit"]},
  "Scheme Manager": {perms: ["view_all","edit_schemes","audit"]},
  "Partner Relationship Manager": {perms: ["view_all","edit_partners","audit"]},
  "Compliance / Auditor": {perms: ["view_all","audit"]},
  "State/Regional Officer": {perms: ["view_all"]},
  "Support Staff": {perms: ["view_all"]},
};

export function can(user, perm) {
  if (!user) return false;
  return ROLES[user.role]?.perms.includes(perm);
}

// The 6 RBAC role labels offered on the login screen / role selector.
export const RBAC_ROLES = [
  "Super Admin",
  "Scheme Manager",
  "Partner Relationship Manager",
  "Compliance / Auditor",
  "State/Regional Officer",
  "Support Staff",
];
