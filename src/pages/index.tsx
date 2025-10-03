import { useNavigate } from "react-router-dom";

import PortalCard from "@/components/portal-card";
import TextShowcase from "@/components/text-showcase";

const portals = [
  {
    title: "Leadway Health",
    // description: "Register and manage your vendor applications",
    path: "/leadway-login",
  },
  {
    title: "Provider Log-in",
    // description: "Administrative access for system management",
    path: "/provider-login",
  },
];

export default function IndexPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="px-6 sm:px-0 w-full max-w-md">
        <TextShowcase />

        <div className="space-y-4">
          {portals.map((portal, index) => (
            <PortalCard
              key={index}
              title={portal.title}
              onClick={() => navigate(portal.path)}
            />
          ))}
        </div>

        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            Select the appropriate portal for your role
          </p>
        </div>
      </div>
    </div>
  );
}
