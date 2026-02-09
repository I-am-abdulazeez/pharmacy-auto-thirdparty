import { useCallback, useEffect, useState } from "react";
import { useChunkValue } from "stunk/react";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Selection } from "@heroui/table";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

import {
  getReassignDetails,
  getReassignDeliveries,
} from "@/lib/services/delivery-service";
import { fetchRiders } from "@/lib/services/rider-service";
import { deliveryStore } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import PayAutoLineTable from "@/components/pay-autoline-table";
import PageHeader from "@/components/ui/page-header";
import { DownloadIcon } from "@/components/icons";
import ProviderPickupsTable from "@/components/pickup/provider-pickup-table";
import AssignRiderModal from "@/components/rider/assign-rider-modal";
import {
  downloadReassignDeliveriesAsExcel,
  downloadTableAsExcel,
} from "@/lib/utils/excel-exports";

const COLUMNS = [
  { key: "EnrolleeId", label: "Enrollee ID" },
  { key: "EnrolleeName", label: "Enrollee Name" },
  { key: "scheme_type", label: "Scheme Type" },
  { key: "Pharmacyname", label: "Address" },
  { key: "TimeUsed", label: "Time Used" },
  { key: "assignedrider", label: "Assigned Rider" },
  { key: "inputteddate", label: "Date Submitted" },
];

export default function ReassignOrClaimPage() {
  const {
    reassignDeliveries,
    reassignDetails,
    isLoading,
    isLoadingDetails,
    error,
    detailsError,
  } = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);
  const [searchEnrolleeId, setSearchEnrolleeId] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [selectedEnrolleeId, setSelectedEnrolleeId] = useState<string | null>(
    null,
  );
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Rider filtering state
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);

  const pharmacyId = user?.provider_id?.toString() || "";

  // Fetch riders on mount
  useEffect(() => {
    const loadRiders = async () => {
      setIsLoadingRiders(true);
      try {
        const ridersData = await fetchRiders();
        const activeRiders = ridersData.filter(
          (r: any) => r.status === "Active",
        );

        setRiders(activeRiders);
      } catch (error) {
        throw new Error((error as Error).message);
      } finally {
        setIsLoadingRiders(false);
      }
    };

    loadRiders();
  }, []);

  // Fetch initial deliveries list
  useEffect(() => {
    if (pharmacyId) {
      getReassignDeliveries(pharmacyId, false);
    }
  }, [pharmacyId]);

  const handleSearch = () => {
    if (pharmacyId) {
      getReassignDeliveries(pharmacyId, false, searchEnrolleeId);
    }
  };

  const handleClearSearch = () => {
    setSearchEnrolleeId("");
    setSelectedRider(""); // Also clear rider filter
    if (pharmacyId) {
      getReassignDeliveries(pharmacyId, false);
    }
  };

  const handleRiderFilter = (riderName: string) => {
    setSelectedRider(riderName);
    // Clear search when filtering by rider
    setSearchEnrolleeId("");
  };

  const handleClearRiderFilter = () => {
    setSelectedRider("");
    if (pharmacyId) {
      getReassignDeliveries(pharmacyId, false, searchEnrolleeId);
    }
  };

  const handleRowClick = (enrolleeId: string) => {
    setSelectedEnrolleeId(enrolleeId);
    getReassignDetails(pharmacyId, enrolleeId, false);
  };

  const handleRefresh = useCallback(() => {
    if (selectedEnrolleeId) {
      // Force refresh by clearing the state first, then fetching again
      deliveryStore.set((state) => ({
        ...state,
        reassignDetails: [],
        isLoadingDetails: true,
      }));

      // Use setTimeout to ensure state update happens before fetch
      setTimeout(() => {
        getReassignDetails(pharmacyId, selectedEnrolleeId, false);
      }, 100);
    }
  }, [selectedEnrolleeId, pharmacyId]);

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
      getReassignDeliveries(pharmacyId, false, searchEnrolleeId);
    }
  };

  const handleDownloadExcel = () => {
    downloadTableAsExcel(reassignDetails || [], false);
  };

  const handleRetry = () => {
    if (selectedEnrolleeId) {
      getReassignDetails(pharmacyId, selectedEnrolleeId, false);
    } else {
      getReassignDeliveries(pharmacyId, false, searchEnrolleeId);
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
      getReassignDeliveries(pharmacyId, false, searchEnrolleeId);
    }
    // Clear selections
    setSelectedKeys(new Set());
  };

  // Filter deliveries based on selected rider
  const filteredDeliveries = selectedRider
    ? reassignDeliveries.filter(
        (delivery) =>
          delivery.assignedrider &&
          delivery.assignedrider
            .toLowerCase()
            .includes(selectedRider.toLowerCase()),
      )
    : reassignDeliveries;

  if (isLoading && !selectedEnrolleeId) {
    return (
      <>
        <PageHeader
          description="View and manage pharmacy pickup requests"
          title="Reassign or Claim"
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

  if (error && !reassignDeliveries.length && !selectedEnrolleeId) {
    return (
      <>
        <PageHeader
          description="View and manage pharmacy delivery requests"
          title="Reassign or Claim"
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
        title="Reassign or Claim"
      />

      <div>
        {!selectedEnrolleeId ? (
          <>
            {/* Search and Actions */}
            <div className="flex flex-col gap-4 mb-6">
              {/* First Row: Search and Rider Filter */}
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

                {/* Rider Filter with Autocomplete */}
                <div className="flex items-center gap-2 ml-4">
                  <Autocomplete
                    classNames={{
                      base: "min-w-[200px]",
                    }}
                    inputProps={{
                      classNames: {
                        inputWrapper: "h-10",
                      },
                    }}
                    isLoading={isLoadingRiders}
                    placeholder="Filter by Rider"
                    selectedKey={selectedRider || null}
                    size="sm"
                    onSelectionChange={(key) => {
                      const riderName = key?.toString() || "";

                      handleRiderFilter(riderName);
                    }}
                  >
                    {riders.map((rider) => {
                      const riderName = `${rider.first_name} ${rider.last_name}`;

                      return (
                        <AutocompleteItem key={riderName} textValue={riderName}>
                          {riderName}
                        </AutocompleteItem>
                      );
                    })}
                  </Autocomplete>
                  {selectedRider && (
                    <Button
                      color="default"
                      size="sm"
                      variant="flat"
                      onPress={handleClearRiderFilter}
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </div>

              {/* Second Row: Info and Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filteredDeliveries.length} of{" "}
                  {reassignDeliveries.length} deliveries
                  {selectedRider && (
                    <span className="ml-2 text-primary font-medium">
                      (Filtered by: {selectedRider})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PDF Button */}
                  <Button
                    color="default"
                    isDisabled={filteredDeliveries.length === 0}
                    startContent={<DownloadIcon />}
                    variant="flat"
                    onPress={() =>
                      downloadReassignDeliveriesAsExcel(filteredDeliveries)
                    }
                  >
                    Download Excel
                  </Button>

                  {/* Reassign Rider Button */}
                  <Button
                    color="primary"
                    isDisabled={(selectedKeys as Set<String>).size === 0}
                    onPress={handleAssignRider}
                  >
                    Reassign Rider ({(selectedKeys as Set<String>).size})
                  </Button>
                </div>
              </div>
            </div>

            <ProviderPickupsTable
              columns={COLUMNS}
              currentPage={currentPage}
              enableSelection={true}
              pickups={filteredDeliveries}
              selectedKeys={selectedKeys}
              onPageChange={setCurrentPage}
              onRowClick={handleRowClick}
              onSelectionChange={setSelectedKeys}
            />

            {/* Assign Rider Modal */}
            <AssignRiderModal
              isOpen={isAssignModalOpen}
              pickups={filteredDeliveries}
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
                isDisabled={(reassignDetails || []).length === 0}
                startContent={<DownloadIcon />}
                variant="flat"
                onPress={handleDownloadExcel}
              >
                Download Excel
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
                deliveries={reassignDetails || []}
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
