import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "@heroui/button";
import { useChunkValue } from "stunk/react";

import {
  // PharmacyIcon,
  EnrolleeIcon,
  DeliveryIcon,
  PayAutoLineIcon,
  PendingIcon,
  AssignIcon,
} from "@/components/icons";
import { authStore } from "@/lib/store/app-store";
import { API_URL } from "@/lib/utils";

interface SideNavProps {
  currentPath: string;
  userType: "leadway" | "provider";
  onClose?: () => void;
}

interface NavLink {
  name: string;
  path: string;
  icon: (props: any) => JSX.Element;
  showCount: boolean;
  countKey?:
    | "enrolleecount"
    | "enrolleecountlagos"
    | "PendingCollections"
    | "PendingDeliveriesPage"
    | "ReassignOrClaim";
}

const leadwayLinks: NavLink[] = [
  // {
  //   name: "Pharmacy",
  //   path: "/leadway/pharmacy",
  //   icon: PharmacyIcon,
  //   showCount: false,
  // },
  {
    name: "Enrollees",
    path: "/leadway/enrollees",
    icon: EnrolleeIcon,
    showCount: false,
  },
  {
    name: "Medication Status",
    path: "/leadway/deliveries",
    icon: DeliveryIcon,
    showCount: false,
  },
];

const providerLinks: NavLink[] = [
  {
    name: "Pay AutoLine",
    path: "/provider/pay-autoline",
    icon: PayAutoLineIcon,
    showCount: false,
  },
  {
    name: "Pending Collections",
    path: "/provider/pending-collections",
    icon: PendingIcon,
    showCount: true,
    countKey: "PendingCollections",
  },
  {
    name: "Pending Deliveries",
    path: "/provider/pending-deliveries",
    icon: DeliveryIcon,
    showCount: true,
    countKey: "PendingDeliveriesPage",
  },
  {
    name: "Reassign or Claim",
    path: "/provider/reassign-or-claim",
    icon: AssignIcon,
    showCount: true,
    countKey: "ReassignOrClaim",
  },
];

export default function SideNav({
  currentPath,
  userType,
  onClose,
}: SideNavProps) {
  const navigate = useNavigate();
  const { user } = useChunkValue(authStore);

  // Provider counts
  const [providerCounts, setProviderCounts] = useState<{
    PendingCollections: number;
    PendingDeliveriesPage: number;
    ReassignOrClaim: number;
  } | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navLinks = userType === "leadway" ? leadwayLinks : providerLinks;

  const pharmacyId = user?.provider_id?.toString() || "";

  // Fetch provider delivery counts
  useEffect(() => {
    const fetchProviderCounts = async () => {
      if (userType === "provider" && pharmacyId) {
        try {
          const response = await fetch(
            `${API_URL}/Pharmacy/GetCountPending_Autopayment_provider?pharmacyid=${pharmacyId}`,
          );
          const data = await response.json();

          if (data.status === 200 && data.result && data.result.length > 0) {
            setProviderCounts(data.result[0]);
          }
        } catch (error) {
          throw new Error((error as Error).message);
        }
      }
    };

    fetchProviderCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchProviderCounts, 30000);

    return () => clearInterval(interval);
  }, [userType, pharmacyId]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Clear auth store
      authStore.set({
        user: null,
        isLoading: false,
        isLeadway: false,
        isProvider: false,
      });

      // Show success message
      toast.success("Logged out successfully");

      // Close mobile menu if open
      if (onClose) {
        onClose();
      }

      // Navigate to appropriate login page
      if (userType === "leadway") {
        navigate("/leadway-login");
      } else {
        navigate("/provider-login");
      }
    } catch (error) {
      toast.error(`Error logging out:  ${(error as Error).message}`);
      setIsLoggingOut(false);
    }
  };

  // Get count based on countKey
  const getCount = (countKey?: string): number | null => {
    switch (countKey) {
      case "PendingCollections":
        return providerCounts?.PendingCollections ?? null;
      case "PendingDeliveriesPage":
        return providerCounts?.PendingDeliveriesPage ?? null;
      case "ReassignOrClaim":
        return providerCounts?.ReassignOrClaim ?? null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex flex-col items-center w-full">
          <img
            alt="Logo"
            className="h-12 w-auto mb-2"
            src="/leadway-logo.png"
          />
          <span className="text-xs text-gray-500 font-medium">
            {userType === "leadway" ? "Leadway Portal" : "Provider Portal"}
          </span>
        </div>
        {onClose && (
          <Button
            isIconOnly
            className="sm:hidden bg-transparent hover:bg-gray-100"
            size="sm"
            onPress={onClose}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navLinks.map((link) => {
          const isActive = currentPath.startsWith(link.path);
          const Icon = link.icon;
          const count = getCount(link.countKey);

          const showBadge = link.showCount && count !== null && count > 0;

          return (
            <Link
              key={link.path}
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? "text-[#F15A24] bg-orange-50 border-l-4 border-[#F15A24] translate-x-1"
                  : "text-gray-700 hover:bg-gray-100 hover:translate-x-0.5"
              }`}
              to={link.path}
              onClick={onClose}
            >
              {/* Icon */}
              <Icon
                className={`w-5 h-5 transition-all duration-300 ${
                  isActive
                    ? "scale-110"
                    : "group-hover:scale-110 group-hover:text-[#F15A24]"
                }`}
              />

              {/* Label */}
              <span
                className={`font-medium transition-colors duration-300 text-sm ${
                  isActive ? "font-semibold" : "group-hover:text-[#F15A24]"
                }`}
              >
                {link.name}
                {showBadge && ` (${count})`}
              </span>

              {/* Active right accent */}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F15A24] animate-pulse" />
              )}

              {/* Hover effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-[#F15A24] opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Logout Button */}
        <Button
          className="w-full justify-start gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-300"
          color="danger"
          isLoading={isLoggingOut}
          startContent={
            !isLoggingOut ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            ) : null
          }
          variant="light"
          onPress={handleLogout}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>

        {/* Version Info */}
        <div className="px-4 py-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600">Version 1.0.0</p>
          <p className="text-xs text-gray-500 mt-1">
            {userType === "leadway" ? "Leadway Health" : "Provider Access"}
          </p>
        </div>
      </div>
    </div>
  );
}
