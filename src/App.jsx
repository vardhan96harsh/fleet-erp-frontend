import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";
import DriversPage from "./pages/DriversPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import AssignmentsPage from "./pages/AssignmentsPage.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import ImportExportPage from "./pages/ImportExportPage.jsx";
import RecycleBinPage from "./pages/RecycleBinPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

const AppContent = () => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const [currentRoute, setCurrentRoute] = useState("dashboard");
  const [targetVehicleId, setTargetVehicleId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-ink text-white">
        <div className="w-8 h-8 rounded-full border-2 border-amber-soft border-t-transparent animate-spin mb-3" />
        <div className="font-mono text-[12.5px] text-slate-soft">
          Starting Fleet Ledger ERP...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navigateTo = (route) => {
    if (route === "users" && !isAdmin) {
      setCurrentRoute("dashboard");
      return;
    }
    setCurrentRoute(route);
  };

  const handleOpenVehicleFromDashboard = (vehicleId) => {
    setTargetVehicleId(vehicleId);
    setCurrentRoute("vehicles");
  };

  const ROUTE_CONFIG = {
    dashboard: {
      title: "Operational Dashboard",
      subtitle: `Fleet health, document renewals & stock alerts`,
      component: (
        <DashboardPage
          onNavigate={navigateTo}
          onOpenVehicle={handleOpenVehicleFromDashboard}
        />
      ),
    },
    vehicles: {
      title: "Commercial Fleet Vehicles",
      subtitle: "Manage fleet inventory, document compliance, and service logs",
      component: (
        <VehiclesPage
          preOpenId={targetVehicleId}
        />
      ),
    },
    drivers: {
      title: "Commercial Drivers & Roster",
      subtitle: "Driver personnel records, licence validity & vehicle assignment",
      component: <DriversPage />,
    },
    inventory: {
      title: "Warehouse & Spare Inventory",
      subtitle: "Track parts and consumables across Vidisha and Manawar warehouses",
      component: <InventoryPage />,
    },
    assignments: {
      title: "Vehicle Item & Equipment Assignments",
      subtitle: "Assign tripals, jacks, ropes, and spare parts to fleet vehicles with auto-inventory sync",
      component: <AssignmentsPage />,
    },
    attendance: {
      title: "Driver Daily & Monthly Attendance",
      subtitle: "Fast daily check-ins, roster marking, and monthly attendance sheets",
      component: <AttendancePage />,
    },
    "import-export": {
      title: "Data Import & Export Center",
      subtitle: "Bulk template downloads, staged Excel imports, and full backups",
      component: <ImportExportPage />,
    },
    "recycle-bin": {
      title: "Recycle Bin & History",
      subtitle: "Restore soft-deleted fleet, driver, and inventory records",
      component: <RecycleBinPage />,
    },
    users: {
      title: "Sub Admin Staff Accounts",
      subtitle: "Super Admin portal to manage staff credentials and access",
      component: <UsersPage />,
    },
  };

  const active = ROUTE_CONFIG[currentRoute] || ROUTE_CONFIG.dashboard;

  return (
    <AppShell
      currentRoute={currentRoute}
      onNavigate={navigateTo}
      title={active.title}
      subtitle={active.subtitle}
    >
      {active.component}
    </AppShell>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
