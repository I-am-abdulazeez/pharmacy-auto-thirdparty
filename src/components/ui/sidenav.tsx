import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "@heroui/button";

import {
  // PharmacyIcon,
  EnrolleeIcon,
  DeliveryIcon,
  PayAutoLineIcon,
  PendingIcon,
} from "@/components/icons";
import { authStore } from "@/lib/store/app-store";

interface SideNavProps {
  currentPath: string;
  userType: "leadway" | "provider";
  onClose?: () => void;
}

const leadwayLinks = [
  // {
  //   name: "Pharmacy",
  //   path: "/leadway/pharmacy",
  //   icon: PharmacyIcon,
  // },
  {
    name: "Enrollees",
    path: "/leadway/enrollees",
    icon: EnrolleeIcon,
  },
  {
    name: "Deliveries",
    path: "/leadway/deliveries",
    icon: DeliveryIcon,
  },
];

const providerLinks = [
  {
    name: "Pay AutoLine",
    path: "/provider/pay-autoline",
    icon: PayAutoLineIcon,
  },
  {
    name: "Pending Collections",
    path: "/provider/pending-collections",
    icon: PendingIcon,
  },
];

export default function SideNav({
  currentPath,
  userType,
  onClose,
}: SideNavProps) {
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navLinks = userType === "leadway" ? leadwayLinks : providerLinks;

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
