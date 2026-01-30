import { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";

import { formatDate } from "@/lib/utils";
import { ProviderPickup } from "@/lib/store/delivery-store";

interface ProviderPickupsTableProps {
  pickups: ProviderPickup[];
  onRowClick: (enrolleeId: string) => void;
}

const COLUMNS = [
  { key: "EnrolleeId", label: "Enrollee ID" },
  { key: "EnrolleeName", label: "Enrollee Name" },
  { key: "scheme_type", label: "Scheme Type" },
  { key: "Pharmacyname", label: "Address" },
  { key: "TimeUsed", label: "Time Used" },
  { key: "inputteddate", label: "Date Submitted" },
];

const ROWS_PER_PAGE = 10;

export default function ProviderPickupsTable({
  pickups,
  onRowClick,
}: ProviderPickupsTableProps) {
  const [page, setPage] = useState(1);
  const [loadingRow, setLoadingRow] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      pickups.map((pickup, index) => ({
        key: `${pickup.EnrolleeId}-${index}`,
        EnrolleeId: pickup.EnrolleeId || "21000645/0",
        EnrolleeName: pickup.EnrolleeName || "",
        scheme_type: pickup.scheme_type || "",
        Pharmacyname: pickup.Pharmacyname || "",
        TimeUsed: pickup.TimeUsed || "",
        inputteddate: formatDate(pickup.inputteddate) || "",
        original: pickup,
      })),
    [pickups],
  );

  const pages = Math.ceil(rows.length / ROWS_PER_PAGE);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;

    return rows.slice(start, end);
  }, [page, rows]);

  const handleRowClick = (enrolleeId: string) => {
    setLoadingRow(enrolleeId);
    onRowClick(enrolleeId);
    // Loading state will be cleared by parent component
    setTimeout(() => setLoadingRow(null), 1000);
  };

  const renderCell = (item: any, columnKey: string) => {
    const isLoading = loadingRow === item.EnrolleeId;

    if (isLoading && columnKey === "EnrolleeName") {
      return (
        <div className="flex items-center gap-2">
          <Spinner color="warning" />
          <span className="text-sm font-semibold">{item.EnrolleeName}</span>
        </div>
      );
    }

    switch (columnKey) {
      case "EnrolleeId":
        return (
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {item.EnrolleeId}
          </span>
        );
      case "EnrolleeName":
        return (
          <div className="flex flex-col min-w-[150px]">
            <span className="text-sm font-semibold">{item.EnrolleeName}</span>
          </div>
        );
      case "scheme_type":
        return (
          <Chip color="warning" size="sm" variant="flat">
            {item.scheme_type}
          </Chip>
        );
      case "Pharmacyname":
        return (
          <div className="max-w-[200px]">
            <span
              className="text-sm text-gray-700 line-clamp-2"
              title={item.Pharmacyname}
            >
              {item.Pharmacyname}
            </span>
          </div>
        );
      case "TimeUsed":
        return (
          <span className="text-sm whitespace-nowrap">{item.TimeUsed}</span>
        );
      case "inputteddate":
        return (
          <span className="text-sm whitespace-nowrap">{item.inputteddate}</span>
        );
      default:
        return item[columnKey];
    }
  };

  if (pickups.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
        <p className="text-lg font-medium">No pending pickups</p>
        <p className="text-sm mt-2">
          There are no pending collections at this time
        </p>
      </div>
    );
  }

  return (
    <Table
      isStriped
      aria-label="Provider pickups table"
      bottomContent={
        pages > 1 ? (
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={pages}
              onChange={(page) => setPage(page)}
            />
          </div>
        ) : null
      }
      className="cursor-pointer"
      selectionMode="single"
      onRowAction={(key) => {
        const item = rows.find((r) => r.key === key);

        if (item && !loadingRow) {
          handleRowClick(item.EnrolleeId);
        }
      }}
    >
      <TableHeader columns={COLUMNS}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={paginatedRows}>
        {(item) => (
          <TableRow
            key={item.key}
            className={`hover:bg-gray-50 ${loadingRow === item.EnrolleeId ? "opacity-60" : ""}`}
          >
            {(columnKey) => (
              <TableCell>{renderCell(item, String(columnKey))}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
