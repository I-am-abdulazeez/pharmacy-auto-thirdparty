import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";

import TextShowcase from "@/components/text-showcase";

const portals = [
  {
    title: "Leadway Health",
    path: "/leadway-login",
  },
  {
    title: "Provider Log-in",
    path: "/provider-login",
  },
];

export default function IndexPage() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50">
      <div className="relative z-10 w-full max-w-md px-6 sm:px-0">
        <div className="mb-10 animate-fade-in text-center">
          <TextShowcase />
          <div className="mx-auto mt-3 h-0.5 w-16 bg-[#F15A24]" />
        </div>

        <div className="space-y-4">
          {portals.map((portal, index) => (
            <div
              key={index}
              className="animate-slide-up transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Button
                className="h-auto w-full justify-start rounded-3xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-[#c61531]"
                onPress={() => navigate(portal.path)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-lg font-semibold text-gray-800">
                    {portal.title}
                  </span>
                  <svg
                    className={`h-5 w-5 text-[#F15A24] transition-transform duration-300 ${
                      hoveredIndex === index ? "translate-x-1" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-6 animate-fade-in text-center"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-sm text-gray-500">
            Select the appropriate portal for your role
          </p>
          <div className="mt-3 flex justify-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c61531]" />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c61531]"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c61531]"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
