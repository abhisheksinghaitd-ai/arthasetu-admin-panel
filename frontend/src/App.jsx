import { useState } from "react";
import { setAuthToken } from "./api.js";
import { PARTNERS, AUDIT_LOG_SEED, NOTIFICATIONS } from "./lib/demoData.js";

import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";

import LoginScreen from "./pages/LoginScreen.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SchemesPage from "./pages/SchemesPage.jsx";
import SchemeImportPage from "./pages/SchemeImportPage.jsx";
import SchemeMappingPage from "./pages/SchemeMappingPage.jsx";
import PartnersPage from "./pages/PartnersPage.jsx";
import PartnerStatusPage from "./pages/PartnerStatusPage.jsx";
import PartnerLocationsPage from "./pages/PartnerLocationsPage.jsx";
import RouterOverviewPage from "./pages/RouterOverviewPage.jsx";
import RouterMLDataPage from "./pages/RouterMLDataPage.jsx";
import RouterRankingPage from "./pages/RouterRankingPage.jsx";
import RouterModelPage from "./pages/RouterModelPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import CsvImportPage from "./pages/CsvImportPage.jsx";
import ApiManagementPage from "./pages/ApiManagementPage.jsx";
import DataQualityPage from "./pages/DataQualityPage.jsx";
import DataSourcesPage from "./pages/DataSourcesPage.jsx";
import AuditLogsPage from "./pages/AuditLogsPage.jsx";
import GrievancesPage from "./pages/GrievancesPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const AUTH_FLAG_KEY = "arthasetu_logged_in";
const AUTH_USER_KEY = "arthasetu_user";

function loadStoredUser() {
  try {
    if (localStorage.getItem(AUTH_FLAG_KEY) !== "true") return null;
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------
   ArthaSetu Admin Console — slim app shell.
   Router case strings and per-page prop signatures are ported
   verbatim from src/_legacy_reference_DO_NOT_EDIT.jsx (ArthaSetuDashboardInner).
   Login state persists across page refresh via localStorage (a
   simple logged-in bool + the user object) unless "Remember me"
   was unchecked at sign-in.
   --------------------------------------------------------------- */
export default function App() {
  const [user, setUser] = useState(() => loadStoredUser());
  const [page, setPage] = useState("dashboard");
  const [partners, setPartners] = useState(PARTNERS);
  const [auditLog, setAuditLog] = useState(AUDIT_LOG_SEED);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function handleLogin(loggedInUser) {
    const { remember, ...userToStore } = loggedInUser;
    if (remember !== false) {
      localStorage.setItem(AUTH_FLAG_KEY, "true");
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userToStore));
    }
    setUser(userToStore);
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuthToken(null);
    setUser(null);
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  let body;
  switch (page) {
    case "dashboard":
      body = <DashboardPage user={user} auditLog={auditLog} setPage={setPage} />;
      break;
    case "schemes-all":
      body = <SchemesPage user={user} setPage={setPage} />;
      break;
    case "schemes-active":
      body = <SchemesPage filterActive={true} user={user} setPage={setPage} />;
      break;
    case "schemes-inactive":
      body = <SchemesPage filterActive={false} user={user} setPage={setPage} />;
      break;
    case "schemes-import":
      body = <SchemeImportPage user={user} />;
      break;
    case "partners-all":
      body = <PartnersPage partners={partners} setPartners={setPartners} user={user} />;
      break;
    case "partners-status":
      body = (
        <PartnerStatusPage
          partners={partners}
          setPartners={setPartners}
          user={user}
          setAuditLog={setAuditLog}
        />
      );
      break;
    case "partners-locations":
      body = <PartnerLocationsPage partners={partners} user={user} />;
      break;
    case "partners-mapping":
      body = <SchemeMappingPage partners={partners} />;
      break;
    case "router-overview":
      body = <RouterOverviewPage partners={partners} />;
      break;
    case "router-mldata":
      body = <RouterMLDataPage partners={partners} />;
      break;
    case "router-ranking":
      body = <RouterRankingPage partners={partners} />;
      break;
    case "router-model":
      body = <RouterModelPage />;
      break;
    case "users-list":
      body = <UsersPage />;
      break;
    case "users-applications":
      body = <ApplicationsPage />;
      break;
    case "data-csv":
      body = <CsvImportPage user={user} />;
      break;
    case "data-api":
      body = <ApiManagementPage user={user} />;
      break;
    case "data-quality":
      body = <DataQualityPage partners={partners} />;
      break;
    case "data-sources":
      body = <DataSourcesPage />;
      break;
    case "audit":
      body = <AuditLogsPage log={auditLog} />;
      break;
    case "grievances":
      body = <GrievancesPage user={user} setAuditLog={setAuditLog} />;
      break;
    case "settings":
      body = <SettingsPage user={user} />;
      break;
    default:
      body = <DashboardPage user={user} auditLog={auditLog} setPage={setPage} />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[var(--paper)]">
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        collapsed={sidebarCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          page={page}
          onLogout={handleLogout}
          notifCount={NOTIFICATIONS.length}
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <div className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {body}
          <div className="mt-10 border-t border-[var(--sage-line)] pt-4 text-[11.5px] leading-relaxed text-[var(--slate)]">
            ArthaSetu Admin Console · Data sourced from NSFDC Scheme Master (CSV) and Partner Router Master Dataset
            (XLSX), as of 31 July 2026 · Fields absent from source are shown as Not Available / Pending
            Verification, never fabricated.
          </div>
        </div>
      </div>
    </div>
  );
}
