import type { Delivery } from "@/types";

import { useMemo } from "react";
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

import { AUTOLINE_COLUMNS } from "@/lib/constants";

interface PayAutoLineTableProps {
  deliveries: Delivery[];
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
}

export default function PayAutoLineTable({
  deliveries,
  selectedKeys,
  onSelectionChange,
}: PayAutoLineTableProps) {
  const rows = useMemo(
    () =>
      deliveries.map((delivery) => ({
        key: String(delivery.EntryNo),
        EnrolleeName: delivery.EnrolleeName || "N/A",
        procedurename: delivery.ProcedureLines?.[0]?.ProcedureName || "N/A",
        phonenumber: delivery.phonenumber || "N/A",
        cost: delivery.cost || "N/A",
        scheme_type: delivery.scheme_type || "N/A",
        ispaid: delivery.ispaid,
        paydate: delivery.paydate,
      })),
    [deliveries]
  );

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "EnrolleeName":
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{item.EnrolleeName}</span>
          </div>
        );
      case "procedurename":
        return <span className="text-sm">{item.procedurename}</span>;
      case "phonenumber":
        return <span className="text-sm">{item.phonenumber}</span>;
      case "cost":
        return (
          <span className="text-sm font-medium">{item.cost || "N/A"}</span>
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
      <div className="text-center p-8 text-gray-500">
        <p>No deliveries found.</p>
        <p className="text-sm mt-2">
          Use the search filters above to find deliveries.
        </p>
      </div>
    );
  }

  return (
    <Table
      isStriped
      aria-label="Pharmacy deliveries table"
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      topContent={
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">AutoLine Deliveries</h3>
          <p className="text-sm text-gray-600">
            Select deliveries to mark as paid
          </p>
          <p className="text-xs text-gray-500">
            Total: {deliveries.length} delivery(s)
            {selectedKeys.size > 0 && ` | Selected: ${selectedKeys.size}`}
          </p>
        </div>
      }
      onSelectionChange={(keys) => {
        if (keys === "all") {
          onSelectionChange(new Set(rows.map((r) => r.key)));
        } else {
          onSelectionChange(keys as Set<string>);
        }
      }}
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
