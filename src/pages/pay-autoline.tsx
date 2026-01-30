import { useState, useCallback, useRef, useEffect } from "react";
import { useChunkValue } from "stunk/react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import toast from "react-hot-toast";

import PageHeader from "@/components/ui/page-header";
import { deliveryStore } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";
import { getDeliveries } from "@/lib/services/delivery-service";
import PayAutoLineTable from "@/components/pay-autoline-table";
import { payAutoLine } from "@/lib/services/payautoline-services";

export default function PayAutoLinePage() {
  const { deliveries, isLoading } = useChunkValue(deliveryStore);
  const { user } = useChunkValue(authStore);

  const [enrolleeId, setEnrolleeId] = useState("");
  const [codeToPharmacy, setCodeToPharmacy] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const lastSearchRef = useRef<string>("");
  const isFetchingRef = useRef<boolean>(false);

  const handleSearch = useCallback(async () => {
    const searchKey = `${enrolleeId}-${codeToPharmacy}`;

    if (lastSearchRef.current === searchKey || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    lastSearchRef.current = searchKey;

    try {
      const pharmacyId = user?.provider_id || "";

      await getDeliveries(
        enrolleeId,
        "",
        "",
        String(pharmacyId),
        codeToPharmacy,
        false,
      );

      if (deliveries.length > 0) {
        toast.success(`Found ${deliveries.length} delivery(s)`);
      }
    } catch (error) {
      toast.error(`Search failed: ${(error as Error).message}`);
    } finally {
      isFetchingRef.current = false;
    }
  }, [enrolleeId, codeToPharmacy, user?.provider_id]);

  // Refresh function to reload deliveries after deletion
  const handleRefresh = useCallback(() => {
    // Force refresh by clearing deliveries first, then refetching
    deliveryStore.set((state) => ({
      ...state,
      deliveries: [],
      isLoadingDetails: true,
    }));

    // Reset the ref to allow the same search to run again
    lastSearchRef.current = "";
    isFetchingRef.current = false;

    // Use setTimeout to ensure state update happens before fetch
    setTimeout(async () => {
      try {
        const pharmacyId = user?.provider_id || "";

        await getDeliveries(
          enrolleeId,
          "",
          "",
          String(pharmacyId),
          codeToPharmacy,
          false,
        );
      } catch (error) {
        toast.error(`Refresh failed: ${(error as Error).message}`);
      }
    }, 100);
  }, [enrolleeId, codeToPharmacy, user?.provider_id]);

  useEffect(() => {
    deliveryStore.set((state) => ({
      ...state,
      deliveries: [],
      error: null,
    }));

    return () => {
      lastSearchRef.current = "";
      isFetchingRef.current = false;
    };
  }, []);

  const handlePaySelected = async () => {
    if (selectedKeys.size === 0) {
      toast.error("Please select at least one delivery to pay");

      return;
    }

    // Get selected deliveries
    const selectedDeliveries = deliveries.filter((d) =>
      selectedKeys.has(String(d.EntryNo)),
    );

    // Validate costs - check if any delivery has cost = 0 or N/A
    const invalidCosts = selectedDeliveries.filter((d) => {
      const cost = d.cost || d.ProcedureLines?.[0]?.cost || "0";

      return cost === "0" || cost === "N/A" || cost === "";
    });

    if (invalidCosts.length > 0) {
      toast.error(
        "Some deliveries have no cost set. Please contact the provider to set the cost before proceeding.",
      );

      return;
    }

    // Calculate total cost
    const totalCost = selectedDeliveries.reduce((sum, delivery) => {
      const cost = parseFloat(
        delivery.cost || delivery.ProcedureLines?.[0]?.cost || "0",
      );

      return sum + cost;
    }, 0);

    // Get enrollee ID (should be same for all selected)
    const enrolleeIdFromDelivery = selectedDeliveries[0]?.EnrolleeId || "";

    if (!enrolleeIdFromDelivery) {
      toast.error("Unable to find enrollee ID for selected deliveries");

      return;
    }

    // Get pharmacy ID from logged in user
    const pharmacyId = user?.provider_id;

    if (!pharmacyId) {
      toast.error("Unable to find pharmacy ID. Please log in again.");

      return;
    }

    setIsPaymentLoading(true);
    try {
      const entryNumbers = Array.from(selectedKeys);

      await payAutoLine(
        entryNumbers,
        pharmacyId,
        totalCost,
        enrolleeIdFromDelivery,
      );

      toast.success(
        `Successfully marked ${selectedKeys.size} delivery(s) as paid. Total: ₦${totalCost.toFixed(2)}`,
      );
      setSelectedKeys(new Set());
      handleRefresh();
    } catch (error) {
      toast.error(`Payment failed: ${(error as Error).message}`);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleClear = () => {
    setEnrolleeId("");
    setCodeToPharmacy("");
    setSelectedKeys(new Set());
    deliveryStore.set((state) => ({
      ...state,
      deliveries: [],
    }));
    lastSearchRef.current = "";
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <PageHeader
        description="Manage and view pharmacy information for enrollees"
        title="Pay AutoLine"
      />
      <section className="px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Input
            label="Enrollee ID"
            placeholder="Enter Enrollee ID (e.g. 21000645/0)"
            radius="sm"
            value={enrolleeId}
            onChange={(e) => setEnrolleeId(e.target.value)}
            onKeyUp={handleKeyPress}
          />

          <Input
            label="Pickup Code"
            placeholder="Enter Pickup Code"
            radius="sm"
            value={codeToPharmacy}
            onChange={(e) => setCodeToPharmacy(e.target.value)}
            onKeyUp={handleKeyPress}
          />
        </div>

        <div className="flex gap-2 mb-5">
          <Button
            className="text-white"
            color="warning"
            isDisabled={isLoading || !codeToPharmacy}
            isLoading={isLoading}
            radius="sm"
            onPress={handleSearch}
          >
            View
          </Button>

          {(enrolleeId || codeToPharmacy) && (
            <Button
              color="default"
              radius="sm"
              variant="flat"
              onPress={handleClear}
            >
              Clear
            </Button>
          )}

          {selectedKeys.size > 0 && (
            <Button
              color="success"
              isDisabled={isPaymentLoading}
              isLoading={isPaymentLoading}
              radius="sm"
              onPress={handlePaySelected}
            >
              Mark as Paid ({selectedKeys.size})
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <Spinner color="warning" />
            <p>Searching deliveries...</p>
          </div>
        ) : (
          <PayAutoLineTable
            deliveries={deliveries}
            isSelectable={true}
            selectedKeys={selectedKeys}
            onRefresh={handleRefresh}
            onSelectionChange={setSelectedKeys}
          />
        )}
      </section>
    </>
  );
}
