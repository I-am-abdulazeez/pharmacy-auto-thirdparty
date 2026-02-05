import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Spinner } from "@heroui/spinner";
import toast from "react-hot-toast";

import {
  fetchWellaHealthPharmacies,
  WellaHealthPharmacy,
} from "@/lib/services/wella-health-service";

interface WellaPharmacyAutocompleteProps {
  onSelect: (pharmacy: WellaHealthPharmacy | null) => void;
  selectedPharmacy?: WellaHealthPharmacy | null;
  isDisabled?: boolean;
}

export default function WellaPharmacyAutocomplete({
  onSelect,
  selectedPharmacy,
  isDisabled = false,
}: WellaPharmacyAutocompleteProps) {
  const [pharmacies, setPharmacies] = useState<WellaHealthPharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProgress, setLoadingProgress] = useState("");

  useEffect(() => {
    loadAllPharmacies();
  }, []);

  const loadAllPharmacies = async () => {
    setIsLoading(true);
    setError("");
    setLoadingProgress("Loading pharmacies...");

    try {
      // First, fetch page 1 to get total page count
      const firstPage = await fetchWellaHealthPharmacies(1, 100);
      const { pageCount } = firstPage;

      let allPharmacies: WellaHealthPharmacy[] = [...firstPage.data];

      // If there are more pages, fetch them all
      if (pageCount > 1) {
        setLoadingProgress(`Loading page 1 of ${pageCount}...`);

        // Create array of page numbers to fetch (2, 3, 4, ...)
        const pagePromises = [];

        for (let page = 2; page <= pageCount; page++) {
          pagePromises.push(
            fetchWellaHealthPharmacies(page, 100).then((response) => {
              setLoadingProgress(`Loading page ${page} of ${pageCount}...`);

              return response.data;
            }),
          );
        }

        // Fetch all pages in parallel
        const additionalPages = await Promise.all(pagePromises);

        // Combine all pharmacy data
        additionalPages.forEach((pageData) => {
          allPharmacies = [...allPharmacies, ...pageData];
        });
      }

      setPharmacies(allPharmacies);
      setLoadingProgress("");
      toast.success(`Loaded ${allPharmacies.length} Wella Health pharmacies`);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to load Wella Health pharmacies";

      setError(errorMsg);
      setLoadingProgress("");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPharmacies = searchQuery
    ? pharmacies.filter(
        (pharmacy) =>
          (pharmacy.pharmacyName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (pharmacy.state || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (pharmacy.area || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (pharmacy.lga || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (pharmacy.pharmacyCode || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : pharmacies;

  const defaultKey = selectedPharmacy
    ? `${selectedPharmacy.pharmacyCode}-${selectedPharmacy.pharmacyName}`
    : undefined;

  return (
    <div className="w-full">
      {error && (
        <div className="flex justify-between mb-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button size="sm" onPress={loadAllPharmacies}>
            Retry
          </Button>
        </div>
      )}

      {isLoading && loadingProgress && (
        <div className="flex items-center gap-2 mb-2 text-sm text-blue-600">
          <Spinner color="primary" size="sm" />
          <span>{loadingProgress}</span>
        </div>
      )}

      <Autocomplete
        className="w-full"
        defaultItems={pharmacies}
        defaultSelectedKey={defaultKey}
        isDisabled={isDisabled || isLoading}
        isLoading={isLoading}
        items={filteredPharmacies}
        label="Select Wella Health Pharmacy"
        placeholder={
          isLoading
            ? "Loading all pharmacies..."
            : "Search by name, state, area, LGA, or code"
        }
        variant="bordered"
        onInputChange={(value) => {
          setSearchQuery(value);
        }}
        onSelectionChange={(key) => {
          const selected = pharmacies.find(
            (pharmacy) =>
              `${pharmacy.pharmacyCode}-${pharmacy.pharmacyName}` === key,
          );

          onSelect(selected || null);
        }}
      >
        {(pharmacy: WellaHealthPharmacy) => (
          <AutocompleteItem
            key={`${pharmacy.pharmacyCode}-${pharmacy.pharmacyName}`}
            textValue={pharmacy.pharmacyName}
          >
            <div className="flex flex-col">
              <span className="font-medium">
                {pharmacy.pharmacyName} - {pharmacy.pharmacyCode}
              </span>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>

      {!isLoading && filteredPharmacies.length === 0 && searchQuery && (
        <div className="text-center py-2 text-sm text-gray-500">
          No pharmacies found for &quot;{searchQuery}&quot;
        </div>
      )}

      {!isLoading && pharmacies.length > 0 && !searchQuery && (
        <p className="text-gray-500 text-xs mt-1">
          {pharmacies.length} Wella Health pharmacies loaded • Search across all
          pages
        </p>
      )}

      {!isLoading && filteredPharmacies.length > 0 && searchQuery && (
        <p className="text-blue-600 text-xs mt-1">
          Found {filteredPharmacies.length} matching pharmacies
        </p>
      )}
    </div>
  );
}
