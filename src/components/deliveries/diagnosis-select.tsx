import type { Diagnosis } from "@/types";

import { useState, useEffect } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";

import {
  getAllDiagnoses,
  isDiagnosesDataLoaded,
} from "@/lib/services/diagonosis-service";

interface DiagnosisAutocompleteProps {
  onSelect: (diagnosis: Diagnosis | null) => void;
  isDisabled?: boolean;
}

export function useDiagnosisList() {
  const [allItems, setAllItems] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllDiagnoses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let attempts = 0;

      while (!isDiagnosesDataLoaded() && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (isDiagnosesDataLoaded()) {
        const diagnoses = getAllDiagnoses();

        setAllItems(diagnoses);
      } else {
        setError("Failed to load diagnoses data - timeout after waiting");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load diagnoses";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    loadAllDiagnoses();
  };

  useEffect(() => {
    loadAllDiagnoses();
  }, []);

  return {
    items: allItems,
    isLoading,
    error,
    retry,
  };
}

export default function DiagnosisAutocomplete({
  onSelect,
  isDisabled,
}: DiagnosisAutocompleteProps) {
  const { items, isLoading, error, retry } = useDiagnosisList();

  return (
    <div className="w-full">
      {error && (
        <div className="flex justify-between mt-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button size="sm" onPress={retry}>
            Retry
          </Button>
        </div>
      )}
      <Autocomplete
        isVirtualized
        className="w-full"
        defaultItems={items}
        isDisabled={isDisabled || !!error}
        isLoading={isLoading}
        label="Select Diagnosis"
        placeholder="Search for a diagnosis"
        variant="bordered"
        onSelectionChange={(key) => {
          const selected = items.find(
            (item) => `${item.DiagnosisId}-${item.DiagnosisName}` === key
          );

          onSelect(selected || null);
        }}
      >
        {(item: Diagnosis) => (
          <AutocompleteItem key={`${item.DiagnosisId}-${item.DiagnosisName}`}>
            {item.DiagnosisName}
          </AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  );
}
