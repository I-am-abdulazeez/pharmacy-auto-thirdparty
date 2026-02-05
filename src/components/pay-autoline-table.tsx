import { useMemo, useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Selection,
} from "@heroui/table";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import toast from "react-hot-toast";

import {
  editDelivery,
  createAcuteDelivery,
} from "@/lib/services/delivery-service";
import { AUTOLINE_COLUMNS } from "@/lib/constants";
import { API_URL, formatDate } from "@/lib/utils";
import { deliveryActions } from "@/lib/store/delivery-store";
import { EditIcon, DeleteIcon, EyeIcon, Check } from "@/components/icons";

interface Delivery {
  EntryNo?: number;
  EnrolleeName?: string;
  EnrolleeId?: string;
  EnrolleeEmail?: string;
  EnrolleeAge?: number;
  SchemeId?: string;
  SchemeName?: string;
  ProcedureLines?: Array<{
    ProcedureName?: string;
    ProcedureId?: string;
    ProcedureQuantity?: number;
    cost?: string;
    DosageDescription?: string;
  }>;
  DiagnosisLines?: Array<{
    DiagnosisName?: string;
    DiagnosisId?: string;
  }>;
  phonenumber?: string;
  deliveryaddress?: string;
  cost?: string;
  scheme_type?: string;
  ispaid?: number | null;
  isClaimed?: number | null;
  paydate?: string | null;
  codeexpirydate?: string;
  inputteddate?: string;
  DeliveryFrequency?: string;
  DelStartDate?: string | null;
  NextDeliveryDate?: string | null;
  FrequencyDuration?: string;
  EndDate?: string | null;
  AdditionalInformation?: string;
  DosageDescription?: string;
  Comment?: string;
  pharmacyid?: string;
  PharmacyName?: string;
  email?: string;
  memberaddress?: string;
  assignedRider?: string | null;
  IsDelivered?: boolean;
}

interface PayAutoLineTableProps {
  deliveries: Delivery[];
  selectedKeys: Selection;
  onSelectionChange: (keys: Selection) => void;
  isSelectable?: boolean;
  onRefresh?: () => void;
  enablePharmacyBenefitSelection?: boolean;
  user?: any;
  onPaySelected?: (
    selectedDeliveries: Delivery[],
    totalCost: number,
  ) => Promise<void>;
  // New props for PendingCollections page features
  enableEditActions?: boolean;
  enableViewDetails?: boolean;
  enableCostEdit?: boolean;
}

const ROWS_PER_PAGE = 10;

export default function PayAutoLineTable({
  deliveries,
  selectedKeys,
  onSelectionChange,
  isSelectable = true,
  onRefresh,
  enablePharmacyBenefitSelection = false,
  user,
  enableEditActions = false,
  enableViewDetails = false,
  enableCostEdit = false,
}: PayAutoLineTableProps) {
  const [updatingQuantities, setUpdatingQuantities] = useState<
    Record<string, boolean>
  >({});
  const [deletingRows, setDeletingRows] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [localQuantities, setLocalQuantities] = useState<
    Record<string, number>
  >({});
  const [page, setPage] = useState(1);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(
    null,
  );

  // View details modal state
  const [viewDetailsModal, setViewDetailsModal] = useState<{
    isOpen: boolean;
    delivery: Delivery | null;
  }>({ isOpen: false, delivery: null });

  // Cost edit modal state
  const [costEditModal, setCostEditModal] = useState<{
    isOpen: boolean;
    delivery: Delivery | null;
    newCost: string;
  }>({ isOpen: false, delivery: null, newCost: "" });
  const [isUpdatingCost, setIsUpdatingCost] = useState(false);

  // Check if pharmacy benefit selection should be enabled
  const isPharmacyBenefitUser =
    enablePharmacyBenefitSelection &&
    user?.surname === "PHARMACY BENEFIT PROGRAMME";

  // Determine if table should show selection
  // Selection should be enabled when:
  // 1. isSelectable is true (for quantity adjustment and general selection)
  // 2. isPharmacyBenefitUser is true (for marking as paid)
  const shouldShowSelection = isSelectable || isPharmacyBenefitUser;

  // Determine which columns to show based on enabled features
  const columns = useMemo(() => {
    const baseColumns = [...AUTOLINE_COLUMNS];

    // Always add actions column
    baseColumns.push({ key: "actions", label: "Actions" });

    return baseColumns;
  }, []);

  const rows = useMemo(
    () =>
      deliveries.map((delivery) => {
        // Determine delivery status
        let deliveryStatus = "Pending";

        const isPaid = delivery.ispaid === 1;
        const isClaimed = delivery.isClaimed === 1;
        const hasAssignedRider =
          delivery.assignedRider !== null &&
          delivery.assignedRider !== undefined;
        const isPharmacyBenefit =
          delivery.PharmacyName?.toLowerCase().includes("pharmacy benefit");

        if (!isPaid && !isClaimed) {
          deliveryStatus = "Pending";
        } else if (isPaid && !isClaimed && !hasAssignedRider) {
          deliveryStatus = "Packed";
        } else if (isPaid && !isClaimed && hasAssignedRider) {
          deliveryStatus = "Assigned to Rider";
        } else if (isPaid && isClaimed && !isPharmacyBenefit) {
          deliveryStatus = "Picked up";
        } else if (isPaid && isClaimed && isPharmacyBenefit) {
          deliveryStatus = "Delivered";
        }

        return {
          key: String(delivery.EntryNo || 0),
          original: delivery,
          EnrolleeName: delivery.EnrolleeName || "N/A",
          procedurename: delivery.ProcedureLines?.[0]?.ProcedureName || "N/A",
          procedurequantity:
            localQuantities[String(delivery.EntryNo)] ??
            delivery.ProcedureLines?.[0]?.ProcedureQuantity ??
            1,
          phonenumber: delivery.phonenumber || "N/A",
          cost: delivery.cost || delivery.ProcedureLines?.[0]?.cost || "N/A",
          scheme_type: delivery.scheme_type || "N/A",
          ispaid: delivery.ispaid ?? null,
          paydate: delivery.paydate || null,
          deliveryStatus,
          actions: {
            isDelivered: delivery.IsDelivered ?? false,
          },
        };
      }),
    [deliveries, localQuantities],
  );

  const pages = Math.ceil(rows.length / ROWS_PER_PAGE);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;

    return rows.slice(start, end);
  }, [page, rows]);

  const updateQuantityWithDecrement = useCallback(
    async (delivery: Delivery, newQuantity: number) => {
      const entryNo = String(delivery.EntryNo);
      const currentQuantity =
        localQuantities[entryNo] ??
        delivery.ProcedureLines?.[0]?.ProcedureQuantity ??
        1;
      const quantityDifference = currentQuantity - newQuantity;

      if (newQuantity < 1 || quantityDifference <= 0) return;

      // Optimistic update
      setLocalQuantities((prev) => ({ ...prev, [entryNo]: newQuantity }));
      setUpdatingQuantities((prev) => ({ ...prev, [entryNo]: true }));

      try {
        // Step 1: Update existing delivery with reduced quantity
        const updateData = {
          EnrolleeId: delivery.EnrolleeId,
          EnrolleeAge: delivery.EnrolleeAge,
          SchemeId: delivery.SchemeId,
          SchemeName: delivery.SchemeName,
          scheme_type: delivery.scheme_type,
          DeliveryFrequency: delivery.DeliveryFrequency,
          DelStartDate: delivery.DelStartDate,
          NextDeliveryDate: delivery.NextDeliveryDate,
          FrequencyDuration: delivery.FrequencyDuration,
          EndDate: delivery.EndDate,
          DiagnosisName: delivery.DiagnosisLines?.[0]?.DiagnosisName || "",
          DiagnosisId: delivery.DiagnosisLines?.[0]?.DiagnosisId || "",
          ProcedureName: delivery.ProcedureLines?.[0]?.ProcedureName || "",
          ProcedureId: delivery.ProcedureLines?.[0]?.ProcedureId || "",
          ProcedureQuantity: newQuantity,
          cost: delivery.cost || delivery.ProcedureLines?.[0]?.cost || "0",
          AdditionalInformation: delivery.AdditionalInformation || "",
          DosageDescription:
            delivery.DosageDescription ||
            delivery.ProcedureLines?.[0]?.DosageDescription ||
            "",
          Comment: delivery.Comment || "",
          IsDelivered: false,
          Username: delivery.EnrolleeName || "",
          deliveryaddress: delivery.deliveryaddress || "",
          phonenumber: delivery.phonenumber || "",
          Pharmacyid: delivery.pharmacyid,
          PharmacyName: delivery.PharmacyName,
          EntryNo: delivery.EntryNo,
        };

        const updateResponse = await editDelivery(updateData);

        if (
          updateResponse.ReturnMessage &&
          !updateResponse.ReturnMessage.toLowerCase().includes("success")
        ) {
          throw new Error(updateResponse.ReturnMessage);
        }

        // Step 2: Create new pickup with the difference quantity (NO pharmacy)
        const diagnosisLines = (delivery.DiagnosisLines || [])
          .map((d) => ({
            DiagnosisName: d.DiagnosisName || "",
            DiagnosisId: d.DiagnosisId || "",
          }))
          .filter((d) => d.DiagnosisId !== "");

        const newDelivery = {
          EnrolleeId: delivery.EnrolleeId || "",
          EnrolleeName: delivery.EnrolleeName || "",
          EnrolleeEmail: delivery.email || "",
          EnrolleeAge: delivery.EnrolleeAge || 0,
          SchemeId: delivery.SchemeId || "",
          SchemeName: delivery.SchemeName || "",
          DeliveryFrequency: delivery.DeliveryFrequency || "",
          DelStartDate: delivery.DelStartDate || new Date().toISOString(),
          NextDeliveryDate:
            delivery.NextDeliveryDate || new Date().toISOString(),
          EndDate: delivery.EndDate || new Date().toISOString(),
          FrequencyDuration: delivery.FrequencyDuration || "",
          DiagnosisLines: diagnosisLines,
          ProcedureLines: [
            {
              ProcedureName: delivery.ProcedureLines?.[0]?.ProcedureName || "",
              ProcedureId: delivery.ProcedureLines?.[0]?.ProcedureId || "",
              ProcedureQuantity: quantityDifference,
              cost: delivery.cost || delivery.ProcedureLines?.[0]?.cost || "0",
              DosageDescription:
                delivery.DosageDescription ||
                delivery.ProcedureLines?.[0]?.DosageDescription ||
                "",
            },
          ],
          AdditionalInformation: delivery.AdditionalInformation || "",
          DosageDescription: delivery.DosageDescription || "",
          Comment: delivery.Comment || "",
          IsDelivered: false,
          Username: delivery.EnrolleeName || "",
          deliveryaddress: "",
          phonenumber: delivery.phonenumber || "",
          Pharmacyid: 0,
          PharmacyName: "",
          cost: delivery.cost || "0",
        };

        const createResponse = await createAcuteDelivery(
          {
            Deliveries: [newDelivery],
            ConfirmDuplicates: false,
          },
          true,
        );

        if (createResponse.status !== 200) {
          throw new Error("Failed to create new pickup for reduced quantity");
        }

        // Single success message after both operations complete
        toast.success(
          `Quantity reduced to ${newQuantity}! New pickup created for ${quantityDifference} unit(s) without pharmacy.`,
        );
      } catch (error) {
        // Revert on error
        setLocalQuantities((prev) => {
          const newState = { ...prev };

          delete newState[entryNo];

          return newState;
        });
        toast.error(
          `Failed to update quantity: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setUpdatingQuantities((prev) => {
          const newState = { ...prev };

          delete newState[entryNo];

          return newState;
        });
      }
    },
    [localQuantities],
  );

  const handleQuantityChange = useCallback(
    (delivery: Delivery, delta: number) => {
      const currentQuantity =
        localQuantities[String(delivery.EntryNo)] ??
        delivery.ProcedureLines?.[0]?.ProcedureQuantity ??
        1;
      const newQuantity = currentQuantity + delta;

      if (newQuantity < 1) return;

      // Only allow decrement when isSelectable is true
      if (isSelectable && delta < 0) {
        updateQuantityWithDecrement(delivery, newQuantity);
      }
    },
    [localQuantities, isSelectable, updateQuantityWithDecrement],
  );

  const handleDeleteDelivery = useCallback(async (delivery: Delivery) => {
    const entryNo = delivery.EntryNo;

    if (!entryNo) {
      toast.error("Invalid entry number");

      return;
    }

    // Open confirmation modal
    setDeliveryToDelete(delivery);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deliveryToDelete) return;

    const entryNo = deliveryToDelete.EntryNo;
    const procedureName =
      deliveryToDelete.ProcedureLines?.[0]?.ProcedureName || "this drug";
    const entryNoStr = String(entryNo);

    setShowDeleteModal(false);
    setDeletingRows((prev) => ({ ...prev, [entryNoStr]: true }));

    try {
      const response = await fetch(
        `${API_URL}/Pharmacy/Pharmacy_removeDrug?entryno=${entryNo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 200) {
        toast.success(`Successfully deleted ${procedureName}`);

        // Refresh the table if onRefresh callback is provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(result.message || "Failed to delete delivery");
      }
    } catch (error) {
      toast.error(
        `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setDeletingRows((prev) => {
        const newState = { ...prev };

        delete newState[entryNoStr];

        return newState;
      });
      setDeliveryToDelete(null);
    }
  }, [deliveryToDelete, onRefresh]);

  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setDeliveryToDelete(null);
  }, []);

  // Handle edit delivery
  const handleEdit = async (delivery: Delivery) => {
    const key = String(delivery.EntryNo);

    try {
      setIsEditing((prev) => ({ ...prev, [key]: true }));
      deliveryActions.openModal();
      deliveryActions.setFormData(delivery);
    } catch (error) {
      toast.error(
        `Failed to load delivery for editing: ${(error as Error).message}`,
      );
    } finally {
      setIsEditing((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Handle view details click
  const handleViewDetailsClick = (delivery: Delivery) => {
    setViewDetailsModal({ isOpen: true, delivery });
  };

  // Handle cost edit click
  const handleCostEditClick = (delivery: Delivery) => {
    setCostEditModal({
      isOpen: true,
      delivery,
      newCost: delivery.cost !== "N/A" ? String(delivery.cost) : "",
    });
  };

  // Handle cost update
  const handleCostUpdate = async () => {
    if (!costEditModal.delivery) return;

    const entryNo = costEditModal.delivery.EntryNo;
    const newCostValue = parseFloat(costEditModal.newCost);

    // Validation
    if (!entryNo) {
      toast.error("Entry number is missing");

      return;
    }

    if (isNaN(newCostValue) || newCostValue < 0) {
      toast.error("Please enter a valid cost amount");

      return;
    }

    setIsUpdatingCost(true);

    try {
      const response = await fetch(
        `${API_URL}/Pharmacy/updatecostautoAutopayment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entryno: entryNo,
            cost: newCostValue,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update cost: ${response.statusText}`);
      }

      toast.success("Cost updated successfully!");

      // Refresh the table
      if (onRefresh) {
        onRefresh();
      }

      // Close modal
      setCostEditModal({ isOpen: false, delivery: null, newCost: "" });
    } catch (error) {
      toast.error(`Failed to update cost: ${(error as Error).message}`);
    } finally {
      setIsUpdatingCost(false);
    }
  };

  const renderCell = (item: any, columnKey: string) => {
    const isUpdating = updatingQuantities[item.key];
    const isDeleting = deletingRows[item.key];
    const isEditingRow = isEditing[item.key];

    switch (columnKey) {
      case "EnrolleeName":
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{item.EnrolleeName}</span>
          </div>
        );
      case "procedurename":
        return <span className="text-sm">{item.procedurename}</span>;
      case "procedurequantity":
        if (isSelectable) {
          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                isIconOnly
                isDisabled={item.procedurequantity <= 1 || isUpdating}
                size="sm"
                variant="flat"
                onPress={() => handleQuantityChange(item.original, -1)}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20 12H4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </Button>

              <div className="relative">
                <span className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-1 rounded-full min-w-[3rem] inline-block text-center">
                  {item.procedurequantity}
                </span>
              </div>
            </div>
          );
        }

        // When isSelectable is false, just show the quantity badge
        return (
          <div className="flex items-center justify-center">
            <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              {item.procedurequantity}
            </span>
          </div>
        );
      case "phonenumber":
        return <span className="text-sm">{item.phonenumber}</span>;
      case "cost":
        if (enableCostEdit) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">
                {item.cost && item.cost !== "N/A" ? `₦${item.cost}` : "N/A"}
              </span>
              <Button
                isIconOnly
                aria-label={`Edit cost for ${item.EnrolleeName}`}
                color="primary"
                size="sm"
                variant="light"
                onPress={() => handleCostEditClick(item.original)}
              >
                <EditIcon size={14} />
              </Button>
            </div>
          );
        }

        return (
          <span className="text-sm font-medium">
            {item.cost && item.cost !== "N/A" ? `₦${item.cost}` : "N/A"}
          </span>
        );
      case "scheme_type":
        return (
          <Chip color="warning" size="sm" variant="flat">
            {item.scheme_type}
          </Chip>
        );
      case "ispaid":
        return (
          <Badge color={item.ispaid ? "success" : "warning"}>
            {item.ispaid ? "Paid" : "Pending"}
          </Badge>
        );
      case "deliveryStatus":
        const getBadgeColor = () => {
          if (item.deliveryStatus === "Delivered") return "success";
          if (item.deliveryStatus === "Picked up") return "success";
          if (item.deliveryStatus === "Assigned to Rider") return "primary";
          if (item.deliveryStatus === "Packed") return "secondary";

          return "warning"; // Pending
        };

        return <Badge color={getBadgeColor()}>{item.deliveryStatus}</Badge>;
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            {/* View Details Icon */}
            {enableViewDetails && (
              <Tooltip color="primary" content="View details">
                <Button
                  isIconOnly
                  color="primary"
                  size="sm"
                  variant="flat"
                  onPress={() => handleViewDetailsClick(item.original)}
                >
                  <EyeIcon size={14} />
                </Button>
              </Tooltip>
            )}

            {/* Edit Icon */}
            {enableEditActions && (
              <Tooltip color="default" content="Edit delivery">
                <Button
                  isIconOnly
                  color="default"
                  isDisabled={item.actions.isDelivered || isEditingRow}
                  isLoading={isEditingRow}
                  size="sm"
                  variant="flat"
                  onPress={() => handleEdit(item.original)}
                >
                  {!isEditingRow && <EditIcon size={14} />}
                </Button>
              </Tooltip>
            )}

            {/* Delete Icon */}
            <Tooltip color="danger" content="Delete delivery">
              <Button
                isIconOnly
                color="danger"
                isDisabled={isDeleting}
                isLoading={isDeleting}
                size="sm"
                variant="light"
                onPress={() => handleDeleteDelivery(item.original)}
              >
                {!isDeleting && <DeleteIcon size={14} />}
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return getKeyValue(item, columnKey);
    }
  };

  if (deliveries.length === 0) {
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
        <p className="text-lg font-medium">No deliveries found</p>
        <p className="text-sm mt-2">
          There are no pending collections at this time
        </p>
      </div>
    );
  }

  return (
    <>
      <Table
        isStriped
        aria-label="Pharmacy deliveries table"
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
        selectedKeys={shouldShowSelection ? selectedKeys : undefined}
        selectionMode={shouldShowSelection ? "multiple" : "none"}
        topContent={
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">Pickup Deliveries</h3>
            {isSelectable ? (
              <>
                <p className="text-sm text-gray-600">
                  Click - to reduce quantity (creates new unassigned pickup for
                  difference)
                </p>
                <p className="text-xs text-gray-500">
                  Total: {deliveries.length} delivery(s)
                  {(selectedKeys as Set<string>).size > 0 &&
                    ` | Selected: ${(selectedKeys as Set<string>).size}`}
                </p>
              </>
            ) : isPharmacyBenefitUser ? (
              <>
                <p className="text-sm text-gray-600">
                  Select deliveries to mark as paid
                </p>
                <p className="text-xs text-gray-500">
                  Total: {deliveries.length} delivery(s)
                  {(selectedKeys as Set<string>).size > 0 &&
                    ` | Selected: ${(selectedKeys as Set<string>).size}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">View-only mode</p>
                <p className="text-xs text-gray-500">
                  Total: {deliveries.length} delivery(s)
                </p>
              </>
            )}
          </div>
        }
        onSelectionChange={
          shouldShowSelection
            ? (keys) => {
                if (keys === "all") {
                  onSelectionChange(new Set(rows.map((r) => r.key)));
                } else {
                  onSelectionChange(keys as Set<string>);
                }
              }
            : undefined
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={paginatedRows}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => (
                <TableCell>{renderCell(item, String(columnKey))}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* View Details Modal */}
      <Modal
        isOpen={viewDetailsModal.isOpen}
        scrollBehavior="inside"
        size="3xl"
        onOpenChange={(isOpen) =>
          setViewDetailsModal((prev) => ({ ...prev, isOpen }))
        }
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">Delivery Details</h2>
            <p className="text-sm text-gray-500 font-normal">
              Complete information for this delivery
            </p>
          </ModalHeader>
          <ModalBody>
            {viewDetailsModal.delivery && (
              <div className="space-y-6">
                {/* Enrollee Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">
                    Enrollee Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Enrollee Name
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.EnrolleeName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Enrollee ID
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.EnrolleeId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Scheme Type
                      </p>
                      <Badge color="primary" variant="flat">
                        {viewDetailsModal.delivery.scheme_type || "N/A"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Email
                      </p>
                      <p className="text-sm font-medium break-words">
                        {viewDetailsModal.delivery.email ||
                          viewDetailsModal.delivery.EnrolleeEmail ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Phone Number
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.phonenumber || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Member Address
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.memberaddress || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pharmacy Information */}
                {viewDetailsModal.delivery.PharmacyName && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-gray-800">
                      Pharmacy Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">
                          Pharmacy Name
                        </p>
                        <p className="text-sm font-medium">
                          {viewDetailsModal.delivery.PharmacyName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">
                          Pharmacy ID
                        </p>
                        <p className="text-sm font-medium">
                          {viewDetailsModal.delivery.pharmacyid || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">
                    Delivery Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Created Date
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(viewDetailsModal.delivery.inputteddate) ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Pay Date
                      </p>
                      <p
                        className={`text-sm font-medium ${!viewDetailsModal.delivery.paydate ? "text-orange-500 italic" : ""}`}
                      >
                        {viewDetailsModal.delivery.paydate
                          ? formatDate(viewDetailsModal.delivery.paydate)
                          : "Not Paid"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Code Expiry Date
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(viewDetailsModal.delivery.codeexpirydate) ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Delivery Status
                      </p>
                      <Badge
                        color={
                          rows.find(
                            (r) =>
                              r.key ===
                              String(viewDetailsModal.delivery?.EntryNo),
                          )?.deliveryStatus === "Delivered" ||
                          rows.find(
                            (r) =>
                              r.key ===
                              String(viewDetailsModal.delivery?.EntryNo),
                          )?.deliveryStatus === "Picked up"
                            ? "success"
                            : "warning"
                        }
                      >
                        {rows.find(
                          (r) =>
                            r.key ===
                            String(viewDetailsModal.delivery?.EntryNo),
                        )?.deliveryStatus || "N/A"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Cost
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.cost
                          ? `₦${viewDetailsModal.delivery.cost}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Diagnosis
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.DiagnosisLines?.[0]
                          ?.DiagnosisName || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Procedure
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.ProcedureLines?.[0]
                          ?.ProcedureName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Procedure Quantity
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.ProcedureLines?.[0]
                          ?.ProcedureQuantity || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        Dosage Description
                      </p>
                      <p className="text-sm font-medium">
                        {viewDetailsModal.delivery.DosageDescription ||
                          viewDetailsModal.delivery.ProcedureLines?.[0]
                            ?.DosageDescription ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {viewDetailsModal.delivery.Comment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-gray-800">
                      Comment
                    </h3>
                    <p className="text-sm font-medium text-gray-700">
                      {viewDetailsModal.delivery.Comment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() =>
                setViewDetailsModal({ isOpen: false, delivery: null })
              }
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Cost Edit Modal */}
      <Modal
        isOpen={costEditModal.isOpen}
        onOpenChange={(isOpen) =>
          setCostEditModal((prev) => ({ ...prev, isOpen }))
        }
      >
        <ModalContent>
          <ModalHeader>Update Cost</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Enrollee:{" "}
                  <span className="font-semibold text-gray-900">
                    {costEditModal.delivery?.EnrolleeName || "N/A"}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Current Cost:{" "}
                  <span className="font-semibold text-gray-900">
                    {costEditModal.delivery?.cost
                      ? `₦${costEditModal.delivery.cost}`
                      : "N/A"}
                  </span>
                </p>
              </div>
              <Input
                label="New Cost"
                placeholder="Enter new cost"
                type="number"
                value={costEditModal.newCost}
                variant="bordered"
                onChange={(e) =>
                  setCostEditModal((prev) => ({
                    ...prev,
                    newCost: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isUpdatingCost) {
                    handleCostUpdate();
                  }
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex gap-2 justify-end">
              <Button
                color="default"
                variant="light"
                onPress={() =>
                  setCostEditModal({
                    isOpen: false,
                    delivery: null,
                    newCost: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button
                color="primary"
                isLoading={isUpdatingCost}
                startContent={!isUpdatingCost ? <Check size={16} /> : null}
                onPress={handleCostUpdate}
              >
                {isUpdatingCost ? "Saving..." : "Save"}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        backdrop="blur"
        isOpen={showDeleteModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) cancelDelete();
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span className="text-red-600">Confirm Deletion</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-base">
                Are you sure you want to delete this delivery?
              </p>
              {deliveryToDelete && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-900">
                    {deliveryToDelete.ProcedureLines?.[0]?.ProcedureName ||
                      "Unknown Drug"}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Enrollee: {deliveryToDelete.EnrolleeName || "N/A"}
                  </p>
                  <p className="text-xs text-red-700">
                    Entry No: {deliveryToDelete.EntryNo}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                ⚠️ This action cannot be undone.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={cancelDelete}>
              Cancel
            </Button>
            <Button color="danger" onPress={confirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
