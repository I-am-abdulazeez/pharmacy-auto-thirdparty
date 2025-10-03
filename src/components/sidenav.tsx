import { Link } from "react-router-dom";
import { Button } from "@heroui/button";

import { PharmacyIcon, EnrolleeIcon, DeliveryIcon } from "@/components/icons";

interface SideNavProps {
  currentPath: string;
  onClose?: () => void;
}

const navLinks = [
  {
    name: "Pharmacy",
    path: "/pharmacy",
    icon: PharmacyIcon,
  },
  {
    name: "Enrollees",
    path: "/enrollees",
    icon: EnrolleeIcon,
  },
  {
    name: "Deliveries",
    path: "/deliveries",
    icon: DeliveryIcon,
  },
];

export default function SideNav({ currentPath, onClose }: SideNavProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <img
          alt="Logo"
          className="mx-auto h-12 w-auto"
          src="/leadway-logo.png"
        />
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
                className={`font-medium transition-colors duration-300 ${
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
      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
