import { useMemo, useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import toast from "react-hot-toast";

import { editDelivery, createDelivery } from "@/lib/services/delivery-service";
import { AUTOLINE_COLUMNS } from "@/lib/constants";

interface Delivery {
  EntryNo?: number;
  EnrolleeName?: string;
  EnrolleeId?: string;
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
  ispaid?: boolean | null;
  paydate?: string | null;
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
}

interface PayAutoLineTableProps {
  deliveries: Delivery[];
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  isSelectable?: boolean;
}

export default function PayAutoLineTable({
  deliveries,
  selectedKeys,
  onSelectionChange,
  isSelectable = true,
}: PayAutoLineTableProps) {
  const [updatingQuantities, setUpdatingQuantities] = useState<
    Record<string, boolean>
  >({});
  const [localQuantities, setLocalQuantities] = useState<
    Record<string, number>
  >({});

  const rows = useMemo(
    () =>
      deliveries.map((delivery) => ({
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
      })),
    [deliveries, localQuantities]
  );

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

        const createResponse = await createDelivery(
          {
            Deliveries: [newDelivery],
            ConfirmDuplicates: false,
          },
          true
        );

        if (createResponse.status !== 200) {
          throw new Error("Failed to create new pickup for reduced quantity");
        }

        // Single success message after both operations complete
        toast.success(
          `Quantity reduced to ${newQuantity}! New pickup created for ${quantityDifference} unit(s) without pharmacy.`
        );
      } catch (error) {
        // Revert on error
        setLocalQuantities((prev) => {
          const newState = { ...prev };

          delete newState[entryNo];

          return newState;
        });
        toast.error(
          `Failed to update quantity: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
    [localQuantities]
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
    [localQuantities, isSelectable, updateQuantityWithDecrement]
  );

  const renderCell = (item: any, columnKey: string) => {
    const isUpdating = updatingQuantities[item.key];

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

        // When isSelectable is false, just show the quantity badge (no buttons)
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
    <Table
      isStriped
      aria-label="Pharmacy deliveries table"
      selectedKeys={isSelectable ? selectedKeys : undefined}
      selectionMode={isSelectable ? "multiple" : "none"}
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
                {selectedKeys.size > 0 && ` | Selected: ${selectedKeys.size}`}
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
        isSelectable
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
      <TableHeader columns={AUTOLINE_COLUMNS}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={rows}>
        {(item) => (
          <TableRow key={item.key}>
            {(columnKey) => (
              <TableCell>{renderCell(item, String(columnKey))}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
