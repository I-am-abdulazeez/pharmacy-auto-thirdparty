import type { Diagnosis } from "@/types";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { toast } from "react-hot-toast";

import { SearchIcon } from "../icons";

import { searchDiagnoses } from "@/lib/services/diagonosis-service";

interface DiagnosisAutocompleteProps {
  onSelect: (diagnosis: Diagnosis | null) => void;
  isDisabled?: boolean;
}

export default function DiagnosisAutocomplete({
  onSelect,
  isDisabled,
}: DiagnosisAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Set<string>>(
    new Set()
  );

  const handleSearchClick = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a search term");

      return;
    }

    setIsLoading(true);
    setHasSearched(false);

    try {
      const results = await searchDiagnoses(inputValue);

      setItems(results);
      setHasSearched(true);

      // Auto-open select if results found
      if (results.length > 0) {
        setTimeout(() => setIsOpen(true), 100);
      }
    } catch (error) {
      toast.error(`Failed to search diagnoses: ${(error as Error).message}`);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    setSelectedDiagnosis(selection as Set<string>);

    const selectedKey = Array.from(selection as Set<string>)[0];

    if (selectedKey) {
      const selected = items.find(
        (item) => `${item.DiagnosisId}-${item.DiagnosisName}` === selectedKey
      );

      if (selected) {
        onSelect(selected);
        // Reset after selection
        setInputValue("");
        setItems([]);
        setHasSearched(false);
        setSelectedDiagnosis(new Set());
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          className="flex-1"
          isDisabled={isDisabled}
          placeholder="Search for a diagnosis..."
          startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyUp={handleKeyPress}
        />
        <Button
          color="primary"
          isDisabled={isDisabled}
          isLoading={isLoading}
          onPress={handleSearchClick}
        >
          Search
        </Button>
      </div>

      {/* Results Select */}
      {hasSearched && items.length > 0 ? (
        <Select
          isDisabled={isDisabled}
          isOpen={isOpen}
          label="Select Diagnosis"
          placeholder="Choose from search results..."
          selectedKeys={selectedDiagnosis}
          onOpenChange={setIsOpen}
          onSelectionChange={handleSelectionChange}
        >
          {items.map((item: Diagnosis) => (
            <SelectItem key={`${item.DiagnosisId}-${item.DiagnosisName}`}>
              {item.DiagnosisName}
            </SelectItem>
          ))}
        </Select>
      ) : hasSearched && items.length === 0 && !isLoading ? (
        <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">{`No diagnoses found for "${inputValue}"`}</p>
          <p className="text-sm text-gray-400 mt-1">
            Try a different search term
          </p>
        </div>
      ) : !hasSearched && !isLoading ? (
        <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
          <SearchIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">
            {`Enter a search term and click "Search" to find diagnoses`}
          </p>
        </div>
      ) : null}

      {isLoading && (
        <div className="text-center py-2 text-sm text-gray-500">
          Searching...
        </div>
      )}
    </div>
  );
}
