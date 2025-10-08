import type { Procedure } from "@/types";

import { useState, useMemo } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { toast } from "react-hot-toast";

import { SearchIcon } from "../icons";

import { deliveryFormState } from "@/lib/store/delivery-store";
import {
  clearProceduresCache,
  getProcedures,
} from "@/lib/services/procedure-service";

interface ProcedureSearchProps {
  onSelect: (procedure: Procedure | null) => void;
  isDisabled?: boolean;
}

export function useProcedureSearch({ fetchDelay = 0 } = {}) {
  const [displayedItems, setDisplayedItems] = useState<Procedure[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const limit = 20;

  const pharmacyId = deliveryFormState.get().pharmacyId;

  useMemo(() => `${pharmacyId}-${searchTerm}`, [pharmacyId, searchTerm]);

  const searchProcedures = async (pageNum = 0, term = searchTerm) => {
    if (!hasMore && pageNum !== 0) return;
    if (!pharmacyId) {
      setDisplayedItems([]);
      setHasMore(false);
      toast.error("Please select a pharmacy first");

      return;
    }

    if (!term.trim()) {
      toast.error("Please enter a search term");

      return;
    }

    try {
      setIsLoading(true);
      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      // Pass search term to the API
      const { procedures, hasMore: moreAvailable } = await getProcedures(
        pageNum,
        limit,
        term
      );

      if (pageNum === 0) {
        setDisplayedItems(procedures);
        setHasSearched(true);
      } else {
        setDisplayedItems((prev) => [...prev, ...procedures]);
      }

      setHasMore(moreAvailable);

      if (procedures.length === 0 && pageNum === 0) {
        toast.success(`No procedures found for "${term}"`);
      }
    } catch (error) {
      toast.error(`Failed to search procedures: ${error}`);
      setDisplayedItems([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onLoadMore = () => {
    if (isLoading || !hasMore || !searchTerm.trim()) return;
    const nextPage = page + 1;

    setPage(nextPage);
    searchProcedures(nextPage);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setDisplayedItems([]);
    setHasMore(true);
    setPage(0);
    setHasSearched(false);
    // Clear cache when searching with different terms
    clearProceduresCache();

    if (term.trim()) {
      searchProcedures(0, term);
    }
  };

  return {
    items: displayedItems,
    hasMore,
    isLoading,
    onLoadMore,
    searchTerm,
    setSearchTerm,
    handleSearch,
    hasSearched,
    reload: () => {
      if (searchTerm.trim()) {
        clearProceduresCache();
        setPage(0);
        searchProcedures(0);
      }
    },
  };
}

export default function ProcedureSearch({
  onSelect,
  isDisabled,
}: ProcedureSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState<Set<string>>(
    new Set()
  );

  const { items, hasMore, isLoading, onLoadMore, handleSearch, hasSearched } =
    useProcedureSearch({
      fetchDelay: 300,
    });

  const [, scrollerRef] = useInfiniteScroll({
    hasMore,
    isEnabled: items.length > 0,
    shouldUseLoader: false,
    onLoadMore,
  });

  const handleSearchClick = () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a search term");

      return;
    }
    handleSearch(inputValue);
    setSelectedProcedure(new Set()); // Clear selection when searching
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const handleSelectionChange = (selection: SharedSelection) => {
    setSelectedProcedure(selection as Set<string>);
    const selectedKey = Array.from(selection as Set<string>)[0];

    if (selectedKey) {
      const selected = items.find(
        (item) => `${item.ProcedureId}-${item.ProcedureName}` === selectedKey
      );

      onSelect(selected || null);
    } else {
      onSelect(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          className="flex-1"
          isDisabled={isDisabled}
          label="Search Procedures"
          placeholder="Enter procedure name to search..."
          startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyUp={handleKeyPress}
        />
        <Button
          className="px-6"
          color="primary"
          isDisabled={isDisabled || !inputValue.trim()}
          isLoading={isLoading}
          onPress={handleSearchClick}
        >
          Search
        </Button>
      </div>

      {/* Results Select */}
      {hasSearched && (
        <div className="space-y-3">
          {items.length > 0 ? (
            <>
              <Select
                isDisabled={isDisabled}
                label="Select Procedure"
                placeholder="Choose from search results..."
                scrollRef={scrollerRef}
                selectedKeys={selectedProcedure}
                onSelectionChange={handleSelectionChange}
              >
                {items.map((item: Procedure) => (
                  <SelectItem key={`${item.ProcedureId}-${item.ProcedureName}`}>
                    {item.ProcedureName}
                  </SelectItem>
                ))}
              </Select>

              {/* Loading more indicator */}
              {isLoading && items.length > 0 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Loading more results...
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{`No procedures found for "${inputValue}"`}</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Initial state message */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{`Enter a search term and click "Search" to find procedures`}</p>
        </div>
      )}
    </div>
  );
}
