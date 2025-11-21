import type { Delivery } from "@/types";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Checkbox } from "@heroui/checkbox";
import { Key } from "@react-types/shared";
import toast from "react-hot-toast";

import { DeleteIcon, EditIcon } from "./icons";

import { deliveryActions } from "@/lib/store/delivery-store";
import { formatDate } from "@/lib/utils";
import { deleteDelivery } from "@/lib/services/delivery-service";
import { DELIVERY_COLUMNS } from "@/lib/constants";

interface DeliveryTableProps {
  deliveries: Delivery[];
  isLoading?: boolean;
  onSearch?: (filters: {
    enrollee: string;
    phone: string;
    email: string;
    pharmacy: string;
    code: string;
    showAll: boolean;
  }) => void;
  currentFilters?: {
    enrollee: string;
    phone: string;
    email: string;
    pharmacy: string;
    code: string;
    showAll: boolean;
  };
}

interface RowItem {
  key: string;
  enrolleeName: string;
  schemeType: string;
  enrolleeId: string;
  email: string;
  inputtedDate: string;
  payDate: string;
  codeExpiryDate: string;
  dosageDescription: string;
  comment: string;
  cost: string;
  codetopharmacy: string;
  diagnosisName: string;
  procedureName: string;
  deliveryStatus: string;
  actions: {
    isDelivered: boolean;
  };
  original: any;
}

export default function DeliveryTable({
  deliveries,
  isLoading = false,
  onSearch,
  currentFilters = {
    enrollee: "",
    phone: "",
    email: "",
    pharmacy: "",
    code: "",
    showAll: false,
  },
}: DeliveryTableProps) {
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    delivery: any | null;
  }>({ isOpen: false, delivery: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const [filters, setFilters] = useState(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleDeleteClick = (delivery: any) => {
    setDeleteConfirmation({ isOpen: true, delivery });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.delivery) {
      try {
        await deleteDelivery(deleteConfirmation.delivery, setIsDeleting);
        toast.success("Delivery deleted successfully");
      } catch (error) {
        toast.error(`Failed to delete delivery: ${(error as Error).message}`);
      } finally {
        setDeleteConfirmation({ isOpen: false, delivery: null });
      }
    }
  };

  const handleEdit = async (delivery: any) => {
    try {
      setIsEditing((prev) => ({ ...prev, [delivery.key]: true }));
      deliveryActions.openModal();
      deliveryActions.setFormData(delivery.original);
    } catch (error) {
      toast.error(
        `Failed to load delivery for editing: ${(error as Error).message}`
      );
    } finally {
      setIsEditing((prev) => ({ ...prev, [delivery.key]: false }));
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (onSearch) {
      // If any filter has a value, set showAll to false
      const hasActiveFilters =
        filters.enrollee ||
        filters.phone ||
        filters.email ||
        filters.pharmacy ||
        filters.code;

      onSearch({
        ...filters,
        showAll: hasActiveFilters ? false : filters.showAll,
      });
    }
  };

  const handleClearAll = () => {
    const clearedFilters = {
      enrollee: "",
      phone: "",
      email: "",
      pharmacy: "",
      code: "",
      showAll: filters.showAll,
    };

    setFilters(clearedFilters);
    setCurrentPage(1);
    if (onSearch) {
      onSearch(clearedFilters);
    }
  };

  const handleShowAllChange = (checked: boolean) => {
    const newFilters = { ...filters, showAll: checked };

    setFilters(newFilters);
    setCurrentPage(1);
    if (onSearch) {
      onSearch(newFilters);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const hasActiveFilters =
    filters.enrollee ||
    filters.phone ||
    filters.email ||
    filters.pharmacy ||
    filters.code;

  const rows = useMemo(
    () =>
      deliveries.map((delivery, index) => {
        const uniqueKey = `${delivery.EntryNo || index}-${Date.now()}-${Math.random()}`;

        return {
          key: uniqueKey,
          enrolleeName: delivery.EnrolleeName || "N/A",
          schemeType: delivery.scheme_type || "N/A",
          enrolleeId: delivery.EnrolleeId || "N/A",
          email: delivery.email || delivery.EnrolleeEmail || "N/A",
          inputtedDate: formatDate(delivery.inputteddate) || "N/A",
          payDate: delivery.paydate ? formatDate(delivery.paydate) : "Not Paid",
          codetopharmacy: delivery.codetopharmacy || "",
          codeExpiryDate: formatDate(delivery.codeexpirydate) || "N/A",
          dosageDescription: delivery.DosageDescription || "N/A",
          comment: delivery.Comment || "N/A",
          cost: delivery.cost || "N/A",
          diagnosisName: delivery.DiagnosisLines?.[0]?.DiagnosisName || "N/A",
          procedureName: delivery.ProcedureLines?.[0]?.ProcedureName || "N/A",
          deliveryStatus: delivery.IsDelivered ? "Picked up" : "Pending",
          actions: {
            isDelivered: delivery.IsDelivered ?? false,
          },
          original: delivery,
        };
      }),
    [deliveries]
  );

  const filteredRows = rows;
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredRows.length);

    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, pageSize]);

  const renderCell = (item: RowItem, columnKey: Key): React.ReactNode => {
    switch (columnKey) {
      case "enrolleeName":
        return (
          <div className="flex flex-col">
            <div className="text-md font-medium">{item.enrolleeName}</div>
          </div>
        );
      case "schemeType":
        return (
          <span className="text-sm font-semibold text-blue-600">
            {item.schemeType}
          </span>
        );
      case "enrolleeId":
        return <span className="text-sm text-gray-700">{item.enrolleeId}</span>;
      case "email":
        return <span className="text-sm text-gray-700">{item.email}</span>;
      case "inputtedDate":
        return <span className="text-sm">{item.inputtedDate}</span>;
      case "payDate":
        return (
          <span
            className={`text-sm ${item.payDate === "Not Paid" ? "text-orange-500 italic" : ""}`}
          >
            {item.payDate}
          </span>
        );
      case "codeExpiryDate":
        return <span className="text-sm">{item.codeExpiryDate}</span>;
      case "codetopharmacy":
        return <span className="text-sm">{item.codetopharmacy}</span>;
      case "diagnosisName":
        return <span className="text-sm">{item.diagnosisName}</span>;
      case "procedureName":
        return <span className="text-sm">{item.procedureName}</span>;
      case "dosageDescription":
        return (
          <span className="text-sm text-gray-600">
            {item.dosageDescription}
          </span>
        );
      case "comment":
        return <span className="text-sm text-gray-600">{item.comment}</span>;
      case "cost":
        return (
          <span className="text-sm font-medium">{item.cost || "N/A"}</span>
        );
      case "deliveryStatus":
        return (
          <Badge
            color={item.deliveryStatus === "Picked up" ? "success" : "warning"}
          >
            {item.deliveryStatus}
          </Badge>
        );
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              isIconOnly
              aria-label={`Edit delivery for ${item.enrolleeName}`}
              color="default"
              isDisabled={item.actions.isDelivered || isEditing[item.key]}
              isLoading={isEditing[item.key]}
              size="sm"
              variant="flat"
              onPress={() => handleEdit(item)}
            >
              {isEditing[item.key] ? null : <EditIcon size={14} />}
            </Button>
            <Button
              isIconOnly
              aria-label={`Delete delivery for ${item.enrolleeName}`}
              color="danger"
              isDisabled={isDeleting[item.key]}
              size="sm"
              variant="flat"
              onPress={() => handleDeleteClick(item)}
            >
              {isDeleting[item.key] ? (
                <span className="text-sm">...</span>
              ) : (
                <DeleteIcon size={14} />
              )}
            </Button>
          </div>
        );
      default:
        return getKeyValue(item, columnKey);
    }
  };

  const showNoResults =
    !isLoading &&
    filteredRows.length === 0 &&
    (hasActiveFilters || deliveries.length > 0);
  const showInitialMessage =
    !isLoading && deliveries.length === 0 && !hasActiveFilters;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Input
            label="Enrollee ID/Name"
            placeholder="Search enrollee..."
            radius="sm"
            value={filters.enrollee}
            onChange={(e) => handleFilterChange("enrollee", e.target.value)}
          />

          <Input
            label="Phone Number"
            placeholder="Search phone..."
            radius="sm"
            value={filters.phone}
            onChange={(e) => handleFilterChange("phone", e.target.value)}
          />

          <Input
            label="Email"
            placeholder="Search email..."
            radius="sm"
            type="email"
            value={filters.email}
            onChange={(e) => handleFilterChange("email", e.target.value)}
          />

          <Input
            label="Pharmacy ID"
            placeholder="Search pharmacy..."
            radius="sm"
            value={filters.pharmacy}
            onChange={(e) => handleFilterChange("pharmacy", e.target.value)}
          />

          <Input
            label="Pickup Code"
            placeholder="Search code..."
            radius="sm"
            value={filters.code}
            onChange={(e) => handleFilterChange("code", e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Checkbox
              isSelected={filters.showAll}
              onValueChange={handleShowAllChange}
            >
              <span className="text-sm font-medium">Show All Deliveries</span>
            </Checkbox>
            {filters.showAll && (
              <span className="text-xs text-gray-500 italic">
                Displaying all deliveries regardless of search criteria
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              color="primary"
              isDisabled={isLoading}
              radius="sm"
              onPress={handleSearch}
            >
              {isLoading ? <Spinner color="white" size="sm" /> : "Search"}
            </Button>
            {hasActiveFilters && (
              <Button
                color="default"
                isDisabled={isLoading}
                radius="sm"
                variant="flat"
                onPress={handleClearAll}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && !filters.showAll && (
          <div className="text-sm text-gray-600">
            <span>Searching with active filters</span>
            {filteredRows.length > 0 &&
              ` - Found ${filteredRows.length} result(s)`}
          </div>
        )}
      </div>

      {showInitialMessage && (
        <div className="text-center p-8 text-gray-500">
          No deliveries found. Use the search filters to find deliveries by
          Enrollee ID, Phone, Email, Pharmacy ID, or Pickup Code.
        </div>
      )}

      {showNoResults && (
        <div className="text-center p-8 text-gray-500">
          <p>No deliveries found matching your search criteria.</p>
          <p className="text-sm mt-2">
            Try adjusting your search filters or clear all to start over.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-8">
          <Spinner color="primary" />
          <p className="mt-2 text-gray-600">Loading deliveries...</p>
        </div>
      ) : filteredRows.length > 0 ? (
        <Table
          isStriped
          aria-label="Deliveries Table"
          bottomContent={
            totalPages > 1 && (
              <div className="flex w-full justify-between items-center">
                <p className="text-small text-gray-500">
                  Total: {filteredRows.length} deliveries
                  {hasActiveFilters && <span> (search results)</span>}
                </p>
                <Pagination
                  isCompact
                  showControls
                  page={currentPage}
                  total={totalPages}
                  onChange={handlePageChange}
                />
                <div className="text-small text-default-400">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )
          }
          className="min-w-full"
          color="primary"
          topContent={
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">Deliveries</h3>
                  <p className="text-sm text-gray-600">
                    Manage and track delivery status
                  </p>
                  <p className="text-xs text-gray-500">
                    Total: {filteredRows.length} deliveries
                    {hasActiveFilters && <span> (search results)</span>}
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <TableHeader columns={DELIVERY_COLUMNS}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={paginatedRows}>
            {(item) => (
              <TableRow key={item.key}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : null}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
      >
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            <p className="text-gray-700">
              Are you sure you want to delete this delivery for{" "}
              <span className="font-semibold">
                {deleteConfirmation.delivery?.enrolleeName || "this enrollee"}?
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-2 justify-end">
              <Button
                color="default"
                variant="light"
                onPress={() =>
                  setDeleteConfirmation({ isOpen: false, delivery: null })
                }
              >
                Cancel
              </Button>
              <Button
                color="danger"
                isLoading={
                  deleteConfirmation.delivery &&
                  isDeleting[deleteConfirmation.delivery.key]
                }
                onPress={handleDeleteConfirm}
              >
                {deleteConfirmation.delivery &&
                isDeleting[deleteConfirmation.delivery.key]
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
