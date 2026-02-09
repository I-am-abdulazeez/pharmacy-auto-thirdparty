import { useCallback, useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Selection } from "@heroui/table";

import {
  getDeliveriesDetails,
  getProviderDeliveries,
} from "@/lib/services/delivery-service";
import { deliveryStore } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import {
  downloadProviderDeliveriesAsPDF,
  downloadTableAsPDF,
} from "@/lib/utils";
import PayAutoLineTable from "@/components/pay-autoline-table";
import PageHeader from "@/components/ui/page-header";
import { DownloadIcon } from "@/components/icons";
import ProviderPickupsTable from "@/components/pickup/provider-pickup-table";
import AssignRiderModal from "@/components/rider/assign-rider-modal";

export default function PendingDeliveriesPage() {
  const {
    providerDeliveries,
    providerDetails,
    isLoading,
    isLoadingDetails,
    error,
    detailsError,
  } = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);
  const [showAll, setShowAll] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [searchEnrolleeId, setSearchEnrolleeId] = useState("");

  const [selectedEnrolleeId, setSelectedEnrolleeId] = useState<string | null>(
    null,
  );
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pharmacyId = user?.provider_id?.toString() || "";

  // Fetch initial pickups list
  useEffect(() => {
    if (pharmacyId) {
      getProviderDeliveries(pharmacyId, showAll);
    }
  }, [showAll, pharmacyId]);

  // COMMENTED OUT: Row click functionality for showing details
  /*
  const handleRowClick = (enrolleeId: string) => {
    setSelectedEnrolleeId(enrolleeId);
    getDeliveriesDetails(pharmacyId, enrolleeId, showAll);
  };
  */

  const handleRefresh = useCallback(() => {
    if (selectedEnrolleeId) {
      // Force refresh by clearing the state first, then fetching again
      deliveryStore.set((state) => ({
        ...state,
        providerDetails: [],
        isLoadingDetails: true,
      }));

      // Use setTimeout to ensure state update happens before fetch
      setTimeout(() => {
        getDeliveriesDetails(pharmacyId, selectedEnrolleeId, showAll);
      }, 100);
    }
  }, [selectedEnrolleeId, pharmacyId, showAll]);

  const handleBackToList = () => {
    setSelectedEnrolleeId(null);
    setSelectedKeys(new Set()); // Clear selections
    deliveryStore.set((state) => ({
      ...state,
      providerDetails: [],
      detailsError: null,
    }));

    // Always fetch fresh data when going back to list
    if (pharmacyId) {
      getProviderDeliveries(pharmacyId, showAll);
    }
  };

  const handleDownloadPDF = () => {
    downloadTableAsPDF(providerDetails || [], showAll);
  };

  const handleSearch = () => {
    if (pharmacyId) {
      getProviderDeliveries(pharmacyId, false, searchEnrolleeId);
    }
  };

  const handleClearSearch = () => {
    setSearchEnrolleeId("");
    if (pharmacyId) {
      getProviderDeliveries(pharmacyId, false);
    }
  };

  const handleRetry = () => {
    if (selectedEnrolleeId) {
      getDeliveriesDetails(pharmacyId, selectedEnrolleeId, showAll);
    } else {
      getProviderDeliveries(pharmacyId, showAll);
    }
  };

  const handleAssignRider = () => {
    if ((selectedKeys as Set<String>).size === 0) {
      return;
    }
    setIsAssignModalOpen(true);
  };

  const handleAssignmentComplete = () => {
    // Refresh the deliveries list after successful assignment
    if (pharmacyId) {
      getProviderDeliveries(pharmacyId, showAll);
    }
    // Clear selections
    setSelectedKeys(new Set());
  };

  if (isLoading && !selectedEnrolleeId) {
    return (
      <>
        <PageHeader
          description="View and manage pharmacy pickup requests"
          title="Pending Collections"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Spinner color="primary" size="lg" />
            <p className="mt-4 text-gray-600">Loading deliveries...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !providerDeliveries.length && !selectedEnrolleeId) {
    return (
      <>
        <PageHeader
          description="View and manage pharmacy pickup requests"
          title="Pending Collections"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">⚠️ Error</div>
            <p className="text-gray-600">{error}</p>
            <Button className="mt-4" color="primary" onPress={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        description="View and manage pharmacy delivery requests"
        title="Pending Deliveries"
      />

      <div>
        {!selectedEnrolleeId ? (
          <>
            {/* Pickups List View */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Switch
                  isSelected={showAll}
                  size="sm"
                  onValueChange={setShowAll}
                >
                  <span className="text-sm font-medium text-gray-700">
                    Show Previous Pickups
                  </span>
                </Switch>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  className="max-w-xs"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-10",
                  }}
                  placeholder="Search by Enrollee ID..."
                  size="sm"
                  value={searchEnrolleeId}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  onValueChange={setSearchEnrolleeId}
                />
                <Button
                  color="primary"
                  isDisabled={!searchEnrolleeId.trim()}
                  size="sm"
                  onPress={handleSearch}
                >
                  Search
                </Button>
                {searchEnrolleeId && (
                  <Button
                    color="default"
                    size="sm"
                    variant="flat"
                    onPress={handleClearSearch}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Download PDF Button */}
              <div className="flex gap-3">
                <Button
                  color="default"
                  isDisabled={providerDeliveries.length === 0}
                  startContent={<DownloadIcon />}
                  variant="flat"
                  onPress={() =>
                    downloadProviderDeliveriesAsPDF(providerDeliveries)
                  }
                >
                  Download PDF
                </Button>

                {/* Assign Rider Button */}
                <Button
                  color="primary"
                  isDisabled={(selectedKeys as Set<String>).size === 0}
                  onPress={handleAssignRider}
                >
                  Assign Rider ({(selectedKeys as Set<String>).size})
                </Button>
              </div>
            </div>

            <ProviderPickupsTable
              currentPage={currentPage}
              enableSelection={true}
              pickups={providerDeliveries}
              // COMMENTED OUT: Row click handler
              // onRowClick={handleRowClick}
              // NEW: Enable selection for this page only
              selectedKeys={selectedKeys}
              onPageChange={setCurrentPage}
              onSelectionChange={setSelectedKeys}
            />

            {/* Assign Rider Modal */}
            <AssignRiderModal
              isOpen={isAssignModalOpen}
              pickups={providerDeliveries}
              selectedKeys={selectedKeys}
              onAssignmentComplete={handleAssignmentComplete}
              onClose={() => setIsAssignModalOpen(false)}
            />
          </>
        ) : isLoadingDetails ? (
          <>
            {/* Loading Details */}
            <div className="text-center py-10 flex flex-col items-center gap-2">
              <Spinner color="primary" size="lg" />
              <p className="text-gray-600">Loading pickup details...</p>
            </div>
          </>
        ) : (
          <>
            {/* Details View */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  color="default"
                  variant="flat"
                  onPress={handleBackToList}
                >
                  ← Back to List
                </Button>
                <h2 className="text-xl font-semibold">
                  Pickup Details: {selectedEnrolleeId}
                </h2>
              </div>

              <Button
                color="primary"
                isDisabled={(providerDetails || []).length === 0}
                startContent={<DownloadIcon />}
                variant="flat"
                onPress={handleDownloadPDF}
              >
                Download PDF
              </Button>
            </div>

            {detailsError ? (
              <div className="text-center py-10 text-red-500">
                {detailsError}
                <Button className="mt-4" color="primary" onPress={handleRetry}>
                  Retry
                </Button>
              </div>
            ) : (
              <PayAutoLineTable
                deliveries={providerDetails || []}
                isSelectable={false}
                selectedKeys={selectedKeys}
                onRefresh={handleRefresh}
                onSelectionChange={setSelectedKeys}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
