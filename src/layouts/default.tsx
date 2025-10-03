import { Button } from "@heroui/button";
import { useState } from "react";
import { useLocation } from "react-router-dom";

import { ToggleIcon } from "@/components/icons";
import SideNav from "@/components/sidenav";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden sm:block sm:w-[261px] h-screen border-r border-gray-200 bg-white">
        <SideNav currentPath={location.pathname} />
      </div>

      <main className="flex flex-col flex-1 overflow-auto relative bg-gray-50">
        <div className="sm:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#F15A24]">Dashboard</h1>
          <Button
            isIconOnly
            className="bg-transparent hover:bg-gray-100"
            onPress={() => setIsMobileMenuOpen(true)}
          >
            <ToggleIcon className="text-gray-700" />
          </Button>
        </div>
        <div className="p-4 sm:p-8 min-h-0 flex-1">{children}</div>
      </main>

      {isMobileMenuOpen && (
        <button
          aria-label="Close menu"
          className="sm:hidden fixed inset-0 bg-black/70 z-50 transition-opacity cursor-default"
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsMobileMenuOpen(false);
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`sm:hidden fixed top-0 left-0 h-screen w-[261px] bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SideNav
          currentPath={location.pathname}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>
    </div>
  );
}
