import * as XLSX from "xlsx";

import { ProviderPickup } from "../services/delivery-service";

import { Delivery } from "@/types";


export const downloadTableAsExcel = (
  deliveries: Delivery[],
  showAll: boolean,
) => {
  // Prepare data for Excel
  const excelData = deliveries.map((delivery) => {
    const procedureName =
      delivery.ProcedureLines?.[0]?.ProcedureName || "N/A";
    const procedureQuantity =
      delivery.ProcedureLines?.[0]?.ProcedureQuantity || 0;
    const cost = delivery.cost || delivery.ProcedureLines?.[0]?.cost || "N/A";

    return {
      "Entry No.": delivery.EntryNo,
      "Enrollee Name": delivery.EnrolleeName || "N/A",
      Procedure: procedureName,
      Quantity: procedureQuantity,
      "Phone Number": delivery.phonenumber || "N/A",
      Cost: cost && cost !== "N/A" ? `₦${cost}` : "N/A",
      Scheme: delivery.scheme_type || "N/A",
      Status: delivery.ispaid ? "Paid" : "Pending",
    };
  });

  // Create summary data
  const summaryData = [
    {},
    {
      "Entry No.": "SUMMARY",
      "Enrollee Name": "",
      Procedure: "",
      Quantity: "",
      "Phone Number": "",
      Cost: "",
      Scheme: "",
      Status: "",
    },
    {
      "Entry No.": "Total Deliveries",
      "Enrollee Name": deliveries.length,
      Procedure: "",
      Quantity: "",
      "Phone Number": "",
      Cost: "",
      Scheme: "",
      Status: "",
    },
    {
      "Entry No.": "Pending",
      "Enrollee Name": deliveries.filter((d) => !d.ispaid).length,
      Procedure: "",
      Quantity: "",
      "Phone Number": "",
      Cost: "",
      Scheme: "",
      Status: "",
    },
    {
      "Entry No.": "Paid",
      "Enrollee Name": deliveries.filter((d) => d.ispaid).length,
      Procedure: "",
      Quantity: "",
      "Phone Number": "",
      Cost: "",
      Scheme: "",
      Status: "",
    },
  ];

  // Combine data and summary
  const fullData = [...excelData, ...summaryData];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(fullData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 12 }, // Entry No.
    { wch: 25 }, // Enrollee Name
    { wch: 30 }, // Procedure
    { wch: 10 }, // Quantity
    { wch: 15 }, // Phone Number
    { wch: 12 }, // Cost
    { wch: 20 }, // Scheme
    { wch: 10 }, // Status
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Collections Report");

  // Add metadata sheet
  const metadataSheet = XLSX.utils.json_to_sheet([
    {
      Field: "Report Title",
      Value: "Pharmacy Collections Report",
    },
    {
      Field: "Generated On",
      Value: new Date().toLocaleString(),
    },
    {
      Field: "Report Type",
      Value: showAll
        ? "All Pickups (Including Previous)"
        : "Pending Pickups Only",
    },
    {
      Field: "Total Records",
      Value: deliveries.length,
    },
  ]);

  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Report Info");

  // Generate filename
  const filename = `Pharmacy_Collections_Report_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
};

export const downloadReassignDeliveriesAsExcel = (
  deliveries: ProviderPickup[],
) => {
  // Prepare data for Excel
  const excelData = deliveries.map((delivery) => {
    const hasRider =
      delivery.assignedrider && delivery.assignedrider.trim() !== "";
    const formattedDate = delivery.inputteddate
      ? new Date(delivery.inputteddate).toLocaleDateString()
      : "N/A";

    return {
      "Enrollee ID": delivery.EnrolleeId || "N/A",
      "Enrollee Name": delivery.EnrolleeName || "N/A",
      "Scheme Type": delivery.scheme_type || "N/A",
      Address: delivery.Pharmacyname || "N/A",
      "Time Used": delivery.TimeUsed || "N/A",
      "Assigned Rider": hasRider ? delivery.assignedrider : "Not Assigned",
      "Date Submitted": formattedDate,
    };
  });

  // Create summary data
  const summaryData = [
    {},
    {
      "Enrollee ID": "SUMMARY",
      "Enrollee Name": "",
      "Scheme Type": "",
      Address: "",
      "Time Used": "",
      "Assigned Rider": "",
      "Date Submitted": "",
    },
    {
      "Enrollee ID": "Total Deliveries",
      "Enrollee Name": deliveries.length,
      "Scheme Type": "",
      Address: "",
      "Time Used": "",
      "Assigned Rider": "",
      "Date Submitted": "",
    },
    {
      "Enrollee ID": "With Rider",
      "Enrollee Name": deliveries.filter(
        (d) => d.assignedrider && d.assignedrider.trim() !== "",
      ).length,
      "Scheme Type": "",
      Address: "",
      "Time Used": "",
      "Assigned Rider": "",
      "Date Submitted": "",
    },
    {
      "Enrollee ID": "Without Rider",
      "Enrollee Name": deliveries.filter(
        (d) => !d.assignedrider || d.assignedrider.trim() === "",
      ).length,
      "Scheme Type": "",
      Address: "",
      "Time Used": "",
      "Assigned Rider": "",
      "Date Submitted": "",
    },
  ];

  // Combine data and summary
  const fullData = [...excelData, ...summaryData];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(fullData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Enrollee ID
    { wch: 25 }, // Enrollee Name
    { wch: 20 }, // Scheme Type
    { wch: 35 }, // Address
    { wch: 12 }, // Time Used
    { wch: 20 }, // Assigned Rider
    { wch: 15 }, // Date Submitted
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Reassign Deliveries Report",
  );

  // Add metadata sheet
  const metadataSheet = XLSX.utils.json_to_sheet([
    {
      Field: "Report Title",
      Value: "Reassign or Claim Deliveries Report",
    },
    {
      Field: "Generated On",
      Value: new Date().toLocaleString(),
    },
    {
      Field: "Report Type",
      Value: "Deliveries Available for Reassignment or Claim",
    },
    {
      Field: "Total Records",
      Value: deliveries.length,
    },
  ]);

  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Report Info");

  // Generate filename
  const filename = `Reassign_Deliveries_Report_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
};

export const downloadProviderDeliveriesAsExcel = (
  deliveries: ProviderPickup[],
) => {
  // Prepare data for Excel
  const excelData = deliveries.map((delivery) => {
    const formattedDate = delivery.inputteddate
      ? new Date(delivery.inputteddate).toLocaleDateString()
      : "N/A";

    return {
      "Enrollee ID": delivery.EnrolleeId || "N/A",
      "Enrollee Name": delivery.EnrolleeName || "N/A",
      "Scheme Type": delivery.scheme_type || "N/A",
      Address: delivery.Pharmacyname || "N/A",
      "Time Used": delivery.TimeUsed || "N/A",
      "Date Submitted": formattedDate,
    };
  });

  // Create summary data
  const summaryData = [
    {},
    {
      "Enrollee ID": "SUMMARY",
      "Enrollee Name": "",
      "Scheme Type": "",
      Address: "",
      "Time Used": "",
      "Date Submitted": "",
    },
    {
      "Enrollee ID": "Total Deliveries",
      "Enrollee Name": deliveries.length,
      "Scheme Type": "",
      Address: "",
      "Time Used": "",
      "Date Submitted": "",
    },
  ];

  // Combine data and summary
  const fullData = [...excelData, ...summaryData];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(fullData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Enrollee ID
    { wch: 25 }, // Enrollee Name
    { wch: 20 }, // Scheme Type
    { wch: 35 }, // Address
    { wch: 12 }, // Time Used
    { wch: 15 }, // Date Submitted
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Provider Deliveries Report",
  );

  // Add metadata sheet
  const metadataSheet = XLSX.utils.json_to_sheet([
    {
      Field: "Report Title",
      Value: "Provider Deliveries Report",
    },
    {
      Field: "Generated On",
      Value: new Date().toLocaleString(),
    },
    {
      Field: "Report Type",
      Value: "Deliveries Available for Reassignment or Claim",
    },
    {
      Field: "Total Records",
      Value: deliveries.length,
    },
  ]);

  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Report Info");

  // Generate filename
  const filename = `Provider_Deliveries_Report_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
};
