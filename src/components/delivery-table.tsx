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
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Key } from "@react-types/shared";
import toast from "react-hot-toast";

import { DeleteIcon, EditIcon } from "./icons";

import { DELIVERY_COLUMNS } from "@/lib/constants";
import { deliveryActions } from "@/lib/store/delivery-store";
import { formatDate, transformApiResponse } from "@/lib/utils";
import { deleteDelivery } from "@/lib/services/delivery-service";

interface DeliveryTableProps {
  deliveries: Delivery[];
  isLoading?: boolean;
  onSearch?: (
    searchTerm: string,
    searchType?: "enrollee" | "pharmacy" | "address"
  ) => void;
  onReassignToRider?: (selectedDeliveries: any[]) => void;
  currentSearchTerm?: string;
  currentSearchType?: "enrollee" | "pharmacy" | "address";
}

interface RowItem {
  key: string;
  enrollee: {
    name: string;
    id: string;
    scheme: string;
  };
  startDate: string;
  deliveryaddress: string;
  nextDelivery: string;
  frequency: string;
  status: string;
  diagnosisname: string;
  procedurename: string;
  pharmacyname: string;
  recipientcode?: string;
  actions: {
    isDelivered: boolean;
  };
  original: any;
  cost: string;
  toBeDeliveredBy?: string;
}

export default function DeliveryTable({
  deliveries,
  isLoading = false,
  onSearch,
  currentSearchTerm = "",
  currentSearchType = "enrollee",
}: DeliveryTableProps) {
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    delivery: any | null;
  }>({ isOpen: false, delivery: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const [searchTerm, setSearchTerm] = useState(currentSearchTerm);
  const [searchType, setSearchType] = useState<
    "enrollee" | "pharmacy" | "address"
  >(currentSearchType);

  useEffect(() => {
    setSearchTerm(currentSearchTerm);
    setSearchType(currentSearchType as "enrollee" | "pharmacy" | "address");
  }, [currentSearchTerm, currentSearchType]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as "enrollee" | "pharmacy" | "address");
    setSearchTerm("");
    setCurrentPage(1);
    if (onSearch) {
      onSearch("", value as "enrollee" | "pharmacy" | "address");
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (onSearch) {
      onSearch(searchTerm, searchType);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    if (onSearch) {
      onSearch("", searchType);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const rows = useMemo(
    () =>
      deliveries.map((delivery, index) => {
        const transformedDelivery = transformApiResponse(delivery);
        const uniqueKey = `${transformedDelivery.EntryNo || index}-${Date.now()}-${Math.random()}`;

        return {
          key: uniqueKey,
          enrollee: {
            name: transformedDelivery.EnrolleeName || "Unknown",
            id: transformedDelivery.EnrolleeId || "",
            scheme: transformedDelivery.SchemeName || "",
          },
          startDate: formatDate(transformedDelivery.DelStartDate),
          nextDelivery: formatDate(transformedDelivery.NextDeliveryDate),
          deliveryaddress: transformedDelivery.deliveryaddress || "",
          frequency: transformedDelivery.DeliveryFrequency || "",
          recipentcode: transformedDelivery.recipientcode || "",
          status: transformedDelivery.Status || "Pending",
          diagnosisname:
            transformedDelivery.DiagnosisLines[0]?.DiagnosisName || "",
          procedurename:
            transformedDelivery.ProcedureLines[0]?.ProcedureName || "",
          memberstatus: transformedDelivery.memberstatus || "",
          actions: {
            isDelivered: transformedDelivery.IsDelivered ?? false,
          },
          pharmacyname: transformedDelivery.PharmacyName || "",
          cost: transformedDelivery.cost || "",
          toBeDeliveredBy:
            delivery.Tobedeliverdby || transformedDelivery.Tobedeliverdby || "",
          original: transformedDelivery,
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

  const columnsWithActions = useMemo(
    () => [
      ...DELIVERY_COLUMNS,
      { key: "cost", label: "Cost" },
      { key: "toBeDeliveredBy", label: "To be delivered by" },
      {
        key: "actions",
        label: "Actions",
      },
    ],
    []
  );

  const renderCell = (item: RowItem, columnKey: Key): React.ReactNode => {
    switch (columnKey) {
      case "enrollee":
        return (
          <div className="flex flex-col">
            <div className="text-md font-medium">{item.enrollee.name}</div>
          </div>
        );
      case "deliveryaddress":
        return <span className="text-sm">{item.deliveryaddress || "N/A"}</span>;
      case "status":
        const getStatusColor = (status: string) => {
          switch (status?.toLowerCase()) {
            case "delivered":
              return "success";
            case "packed":
              return "primary";
            case "pending":
            case "approved":
              return "warning";
            case "cancelled":
            case "failed":
              return "danger";
            default:
              return "default";
          }
        };

        return <Badge color={getStatusColor(item.status)}>{item.status}</Badge>;
      case "isDelivered":
        return (
          <Badge color={item.actions.isDelivered ? "success" : "warning"}>
            {item.actions.isDelivered ? "Yes" : "No"}
          </Badge>
        );
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              isIconOnly
              aria-label={`Edit delivery for ${item.enrollee.name}`}
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
              aria-label={`Delete delivery for ${item.enrollee.name}`}
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
      case "diagnosisname":
        return <span>{item.diagnosisname}</span>;
      case "procedurename":
        return <span>{item.procedurename}</span>;
      case "pharmacyname":
        return <span className="text-gray-500">{item.pharmacyname}</span>;
      case "cost":
        return <span className="text-gray-500">{item.cost}</span>;
      case "toBeDeliveredBy": // ADD THIS WHOLE CASE
        return (
          <span className="text-sm">
            {item.toBeDeliveredBy || (
              <span className="text-gray-400 italic">Not assigned</span>
            )}
          </span>
        );
      default:
        return getKeyValue(item, columnKey);
    }
  };

  const getSearchPlaceholder = (searchType: string): string => {
    switch (searchType) {
      case "enrollee":
        return "Search by Enrollee ID or Name";
      case "pharmacy":
        return "Search by Pharmacy Name";
      case "address":
        return "Search by Region";
      default:
        return "Search...";
    }
  };

  const showNoResults =
    !isLoading &&
    filteredRows.length === 0 &&
    (searchTerm || deliveries.length > 0);
  const showInitialMessage =
    !isLoading && deliveries.length === 0 && !searchTerm;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex w-full sm:w-auto items-center flex-1 gap-2">
            <Select
              aria-label="search-type"
              className="w-48"
              placeholder="Search by"
              radius="sm"
              selectedKeys={[searchType]}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;

                handleSearchTypeChange(key);
              }}
            >
              <SelectItem key="enrollee">Enrollee (ID/Name)</SelectItem>
              <SelectItem key="pharmacy">Pharmacy</SelectItem>
              <SelectItem key="address">Region</SelectItem>
            </Select>
            <Input
              className="flex-1"
              placeholder={getSearchPlaceholder(searchType)}
              radius="sm"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyUp={handleKeyPress}
            />

            <Button
              color="primary"
              isDisabled={isLoading}
              radius="sm"
              onPress={handleSearch}
            >
              {isLoading ? <Spinner color="white" size="sm" /> : "Search"}
            </Button>
            {searchTerm && (
              <Button
                color="default"
                isDisabled={isLoading}
                radius="sm"
                onPress={handleClearSearch}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {searchTerm && (
              <span>
                {`Searching for "${searchTerm}" in `}
                {searchType === "enrollee"
                  ? "Enrollee ID/Name"
                  : searchType === "pharmacy"
                    ? "Pharmacy Name"
                    : "Delivery Address"}
                {filteredRows.length > 0 &&
                  ` - Found ${filteredRows.length} result(s)`}
              </span>
            )}
          </div>
        </div>
      </div>

      {showInitialMessage && (
        <div className="text-center p-8 text-gray-500">
          No deliveries found. Search by Enrollee ID, Pharmacy Name, or Delivery
          Address to get started.
        </div>
      )}

      {showNoResults && (
        <div className="text-center p-8 text-gray-500">
          <p>No deliveries found matching your search criteria.</p>
          <p className="text-sm mt-2">
            Try adjusting your search term or search by a different field.
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
                  {searchTerm && <span> (search results)</span>}
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
                  {location.pathname === "/create-delivery" ? (
                    <>
                      <h3 className="text-lg font-semibold">Deliveries</h3>
                      <p className="text-sm text-gray-600">
                        Manage and track delivery status
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Total: {filteredRows.length} deliveries
                      {searchTerm && <span> (search results)</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          }
        >
          <TableHeader columns={columnsWithActions}>
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
                {deleteConfirmation.delivery?.enrollee.name || "this enrollee"}?
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
