import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Spinner } from "@heroui/spinner";

import { EnrolleeBenefitData } from "@/lib/services/enrollee-service";

interface BenefitTableProps {
  benefitsData: EnrolleeBenefitData[];
  loading: boolean;
  error: string;
}

const COLUMN_CONFIG = [
  { key: "Benefit", label: "BENEFIT" },
  { key: "Limit", label: "LIMIT" },
  { key: "Used", label: "USED" },
  { key: "AmtClaimed", label: "AMT CLAIMED" },
  { key: "Authorised", label: "AUTHORISED" },
  { key: "Balance", label: "BALANCE" },
  { key: "VisitsLimit", label: "VISITS LIMIT" },
  { key: "VisitsUsed", label: "VISITS USED" },
  { key: "VisitsBalance", label: "VISITS BALANCE" },
  {
    key: "CoinsurancePercentage",
    label: "COINSURANCE %",
    format: (val: any) => `${val}%`,
  },
  { key: "CopaymentAmount", label: "COPAYMENT" },
];

export default function BenefitTable({
  benefitsData,
  loading,
  error,
}: BenefitTableProps) {
  if (loading) {
    return (
      <div className="text-center py-10">
        <Spinner color="primary" />
        <p className="mt-2">Loading benefits data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (benefitsData.length === 0) {
    return (
      <div className="text-center py-10">
        <p>No benefits data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table isStriped aria-label="Enrollee Benefits Table">
        <TableHeader>
          {COLUMN_CONFIG.map((column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {benefitsData.map((benefit) => (
            <TableRow key={benefit.RowId}>
              {COLUMN_CONFIG.map((column) => (
                <TableCell key={column.key}>
                  {column.format
                    ? column.format(
                        benefit[column.key as keyof EnrolleeBenefitData]
                      )
                    : benefit[column.key as keyof EnrolleeBenefitData]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
