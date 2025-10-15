import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "@heroui/spinner";

import { InactivityModal } from "../ui/inactivity-modal";

import DefaultLayout from "@/layouts/default";
import { logout } from "@/lib/store/app-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useInactivityModal } from "@/lib/hooks/use-inactive-modal";

export default function ProtectedLeadwayRoute() {
  const { isAuthenticated, isLoading, isLeadway } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const { showWarning, countdown, handleStayActive } = useInactivityModal({
    warningTimeout: 5 * 60 * 1000,
    logoutTimeout: 30 * 1000,
    onLogout: handleLogout,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !isLeadway) {
    return <Navigate replace to="/" />;
  }

  return (
    <DefaultLayout userType="leadway">
      <Outlet />
      <InactivityModal
        countdown={countdown}
        isOpen={showWarning}
        onLogout={handleLogout}
        onStayActive={handleStayActive}
      />
    </DefaultLayout>
  );
}
