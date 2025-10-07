import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Pagination } from "@heroui/pagination";
import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { useChunkValue } from "stunk/react";

import { ErrorText } from "./ui/error-text";

import { appChunk } from "@/lib/store/app-store";
import {
  EnrolleeResponse,
  getEnrolleeByMultipleFields,
} from "@/lib/services/enrollee-service";
import { ENROLLEE_COLUMNS } from "@/lib/constants";

export default function EnrolleeDataTable() {
  const { searchCriteria } = useChunkValue(appChunk);
  const [allData, setAllData] = useState<EnrolleeResponse | null>(null);
  const [displayData, setDisplayData] = useState<EnrolleeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const fetchAllData = async (isButtonClick = false) => {
    const hasSearchCriteria =
      searchCriteria &&
      Object.values(searchCriteria).some((value) => value?.trim());

    if (!hasSearchCriteria && isButtonClick) {
      setError("Please enter at least one search criteria");

      return;
    }

    if (!hasSearchCriteria) {
      setAllData(null);
      setDisplayData(null);

      return;
    }

    setLoading(true);
    setError("");
    setCurrentPage(1);

    try {
      const data = await getEnrolleeByMultipleFields(searchCriteria);

      if (!data || !data.result || data.result.length === 0) {
        setError("No enrollee found");
        setAllData(null);
        setDisplayData(null);
        setLoading(false);

        return;
      }

      setAllData(data);
      updateDisplayData(data, 1, searchQuery);
    } catch (error) {
      const err = error as Error;
      const errorMessage = `Failed to fetch enrollee data. Please try again. ${err.message}`;

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayData = (
    data: EnrolleeResponse,
    page: number,
    query: string = ""
  ) => {
    let filteredResults = [...data.result];

    if (query.trim()) {
      const searchLower = query.toLowerCase();

      filteredResults = filteredResults.filter(
        (item) =>
          item.Member_FirstName?.toLowerCase().includes(searchLower) ||
          item.Member_Surname?.toLowerCase().includes(searchLower) ||
          item.Member_MobileNo?.toLowerCase().includes(searchLower) ||
          item.Member_Email?.toLowerCase().includes(searchLower)
      );
    }

    const totalItems = filteredResults.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    setTotalPages(totalPages);

    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredResults.length);

    const currentPageData = {
      ...data,
      result: filteredResults.slice(startIndex, endIndex),
      currentPage: page,
      totalRecord: filteredResults.length,
    };

    setDisplayData(currentPageData);
  };

  const handleSearch = () => {
    fetchAllData(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    setSearchQuery(query);
    if (allData) {
      setCurrentPage(1);
      updateDisplayData(allData, 1, query);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (allData) {
      updateDisplayData(allData, page, searchQuery);
    }
  };

  // const handleClearSearch = () => {
  //   setAllData(null);
  //   setDisplayData(null);
  //   setError("");
  //   setSearchQuery("");
  //   setCurrentPage(1);
  //   setTotalPages(1);

  //   clearSearchCriteria();
  // };

  const serialOffset = (currentPage - 1) * pageSize;

  const tableItems = useMemo(() => {
    if (loading) return [];

    return (displayData?.result || []).map((item, index) => ({
      ...item,
      serial: serialOffset + index + 1,
    }));
  }, [displayData?.result, loading, currentPage, pageSize]);

  const hasSearchCriteria =
    searchCriteria &&
    Object.values(searchCriteria).some((value) => value?.trim());

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Button
          className="text-white font-semibold w-full sm:w-auto"
          color="warning"
          isDisabled={loading || !hasSearchCriteria}
          radius="sm"
          onPress={handleSearch}
        >
          {loading ? "Searching..." : "Search Enrollee"}
        </Button>

        {/* {(hasSearchCriteria || displayData) && (
          <Button
            radius="sm"
            onPress={handleClearSearch}
            isDisabled={loading}
            color="default"
          >
            Clear Search
          </Button>
        )} */}
      </div>

      {error && <ErrorText text={error} />}

      {loading && (
        <div className="text-center mt-5">
          <Spinner color="warning" />
        </div>
      )}

      {displayData && displayData.status === 200 && (
        <div className="mt-2 bg-white rounded-lg">
          <div className="overflow-x-auto">
            <Table
              isStriped
              aria-label="Enrollee Data Table"
              bottomContent={
                totalPages > 1 && (
                  <div className="flex w-full justify-center mt-4">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="warning"
                      page={currentPage}
                      total={totalPages}
                      onChange={handlePageChange}
                    />
                  </div>
                )
              }
              shadow="none"
              topContent={
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">
                      Enrollees ({allData?.result.length} found)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Click on any row to create deliveries
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                    <Input
                      aria-label="Filter enrollees"
                      className="w-full sm:w-64"
                      placeholder="Filter results..."
                      radius="sm"
                      size="lg"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
              }
            >
              <TableHeader columns={ENROLLEE_COLUMNS}>
                {(column) => (
                  <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={"No Enrollee Results Found"}
                items={tableItems}
                loadingContent={<Spinner color="warning" />}
                loadingState={loading ? "loading" : "idle"}
              >
                {(item) => (
                  <TableRow
                    key={`${item.Member_MemberUniqueID}`}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    {(columnKey) => (
                      <TableCell>
                        <Link
                          className="block w-full h-full text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                          to="/deliveries"
                        >
                          {getKeyValue(item, columnKey)}
                        </Link>
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!hasSearchCriteria && !loading && (
        <div className="text-center mt-8 p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {` Enter search criteria above and click "Search Enrollee" to find
            enrollees`}
          </p>
        </div>
      )}
    </>
  );
}
