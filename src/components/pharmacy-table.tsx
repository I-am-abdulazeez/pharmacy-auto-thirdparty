import { useMemo, useState } from "react";
import { useChunkValue, useAsyncChunk } from "stunk/react";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { ErrorText } from "./ui/error-text";

import { ProviderData } from "@/lib/services/get-providers";
import { appChunk } from "@/lib/store/app-store";
import { providersChunk } from "@/lib/store/provider-store";
import { PROVIDERS_COLUMNS } from "@/lib/constants";

type Provider = ProviderData["result"][number];

export default function PharmacyDataTable() {
  const state = useChunkValue(appChunk);

  const initialStateId = state.stateId
    ? state.stateId === "72"
      ? "73"
      : state.stateId === "73"
        ? "72"
        : state.stateId
    : undefined;

  const { data, loading, error, setParams } = useAsyncChunk(providersChunk, {
    initialParams: {
      stateId: initialStateId,
      enrolleeId: state.searchCriteria.enrolleeId || undefined,
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [validationError, setValidationError] = useState("");

  const handleSearch = () => {
    const stateId = state.stateId;
    const enrolleeId = state.searchCriteria.enrolleeId;

    if (!enrolleeId && !stateId) {
      setValidationError("Please enter an Enrollee ID or select a state");

      return;
    }

    setValidationError("");
    const switchStateId =
      stateId === "72" ? "73" : stateId === "73" ? "72" : stateId;

    setParams({
      enrolleeId: enrolleeId || undefined,
      stateId: switchStateId,
    });
    setCurrentPage(1);
    setSearchQuery("");
  };

  // Filter for local search
  const filteredData = useMemo(() => {
    if (!data?.result) return [];

    if (!searchQuery.trim()) return data.result;

    const searchLower = searchQuery.toLowerCase();

    return data.result.filter((item: Provider) =>
      item.provider?.toLowerCase().includes(searchLower)
    );
  }, [data?.result, searchQuery]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const tableItems = useMemo(() => {
    return paginatedData.map((item: Provider, index: number) => ({
      ...item,
      serial: (currentPage - 1) * pageSize + index + 1,
    }));
  }, [paginatedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <>
      <div className="flex items-center justify-between">
        <Button
          className="mb-4 w-full font-semibold text-white sm:w-auto"
          color="warning"
          isDisabled={loading}
          radius="sm"
          onPress={handleSearch}
        >
          {loading ? "Loading..." : "Search Pharmacy"}
        </Button>
      </div>

      {validationError && <ErrorText text={validationError} />}
      {error && <ErrorText text={error.message} />}

      {loading && (
        <div className="mt-5 text-center">
          <Spinner color="warning" />
        </div>
      )}

      {data && data.status === 200 && (
        <div className="mt-2 rounded-lg bg-white">
          <div className="overflow-x-auto">
            <Table
              isStriped
              aria-label="Enrollee Providers Table"
              bottomContent={
                filteredData.length > pageSize && (
                  <div className="mt-4 flex w-full justify-center">
                    <Pagination
                      showControls
                      color="secondary"
                      page={currentPage}
                      total={totalPages}
                      onChange={handlePageChange}
                    />
                  </div>
                )
              }
              shadow="none"
              topContent={
                <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <h3 className="text-lg font-semibold">Pharmacies</h3>
                  <Input
                    className="w-full sm:w-64"
                    placeholder="Search providers..."
                    radius="sm"
                    size="lg"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              }
            >
              <TableHeader columns={PROVIDERS_COLUMNS}>
                {(column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent="No Provider Results Found"
                items={tableItems}
                loadingContent={<Spinner color="warning" />}
                loadingState={loading ? "loading" : "idle"}
              >
                {(item: Provider & { serial: number }) => (
                  <TableRow key={`${item.provider}-${item.email}`}>
                    {(columnKey) => (
                      <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {paginatedData.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
              {filteredData.length} providers
            </div>
          )}
        </div>
      )}
    </>
  );
}
