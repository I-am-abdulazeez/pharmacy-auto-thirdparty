import { parseDate } from "@internationalized/date";

import { Attachment } from "../services/mail-service";
import { ProviderPickup } from "../services/delivery-service";

import { Delivery, DeliveryApiResponse } from "@/types";

export const API_URL = import.meta.env.VITE_PROGNOSIS_API_URL;

export const safeGet = (value: any, fallback: any) => {
  return value !== undefined && value !== null ? value : fallback;
};

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return (error as Error).message;
  }
};

export const parseDateString = (dateString: string) => {
  if (!dateString) return null;
  try {
    const dateOnly = dateString.split("T")[0];

    return parseDate(dateOnly);
  } catch {
    return null;
  }
};

export const transformApiResponse = (
  apiResponse: DeliveryApiResponse | any,
): Delivery => {
  return {
    DeliveryFrequency: apiResponse.deliveryfrequency || "",
    DelStartDate: apiResponse.delStartdate || "",
    NextDeliveryDate: apiResponse.nextdeliverydate || "",
    FrequencyDuration: apiResponse.frequencyduration || "",
    EndDate: apiResponse.enddate || "",

    // Diagnosis information
    DiagnosisLines: [
      {
        DiagnosisName: apiResponse.diagnosisname || "",
        DiagnosisId: apiResponse.diagnosis_id || "",
      },
    ],

    // Procedure information
    ProcedureLines: [
      {
        ProcedureName: apiResponse.procedurename || "",
        ProcedureId: apiResponse.procdeureid || "",
        ProcedureQuantity: apiResponse.procedurequantity || 1,
        cost: apiResponse.cost || "",
        DosageDescription: apiResponse.DosageDescription || "",
      },
    ],

    // User and additional info
    DosageDescription: apiResponse.DosageDescription || "",
    Username: apiResponse.username || "",
    AdditionalInformation: apiResponse.additionalinformation || "",
    Comment: apiResponse.comment || "",
    IsDelivered: apiResponse.isdelivered || false,

    // Enrollee information
    EnrolleeId: apiResponse.enrolleeid || "",
    EnrolleeName: apiResponse.EnrolleeName || "",
    EnrolleeEmail: apiResponse.email || "",
    EnrolleeAge: apiResponse.enrollee_age || 0,

    // Scheme information
    SchemeName: apiResponse.schemename || "",
    SchemeId: apiResponse.schemeid || "",
    scheme_type: apiResponse.scheme_type || "",

    // Status
    Status: apiResponse.Status || "",
    memberstatus: apiResponse.memberstatus || "",

    // Pharmacy and delivery details
    Pharmacyid: apiResponse.pharmacyid || 0,
    PharmacyName: apiResponse.pharmacyname || "",
    deliveryaddress: apiResponse.deliveryaddress || "",
    phonenumber: apiResponse.phonenumber || "",
    othernumber: apiResponse.othernumber || "",
    cost: apiResponse.cost || "",
    recipientcode: apiResponse.recipientcode || "",

    // Additional API fields
    EntryNo: apiResponse.entryno,
    DeliveryId: apiResponse.deliveryid || "",

    // New fields from updated API
    inputteddate: apiResponse.inputteddate || "",
    modifieddate: apiResponse.modifieddate || "",
    email: apiResponse.email || "",
    codeexpirydate: apiResponse.codeexpirydate || "",
    paydate: apiResponse.paydate || null,
    ispaid: apiResponse.ispaid || null,
    codetopharmacy: apiResponse.codetopharmacy || null,
  };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const createAttachmentFromFile = async (
  file: File,
): Promise<Attachment> => {
  const base64Data = await fileToBase64(file);

  return {
    FileName: file.name,
    ContentType: file.type,
    Base64Data: base64Data,
  };
};

/**
 * Generates a random 6-digit code
 * @returns string - A 6-digit numeric code
 */
export const generateRandomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const downloadTableAsPDF = (
  deliveries: Delivery[],
  showAll: boolean,
) => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pending Collections Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #f15a24;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #c61531;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .info-box {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #f15a24;
        }
        .info-box p {
          margin: 5px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #f15a24;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 11px;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          display: inline-block;
        }
        .status-paid {
          background-color: #d4edda;
          color: #155724;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .scheme-chip {
          background-color: #fff8e1;
          color: #f57c00;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .quantity-badge {
          background-color: #e3f2fd;
          color: #1565c0;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          text-align: center;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #e0e0e0;
          padding-top: 15px;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #c61531;
        }
        .summary-item .label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        @media print {
          body {
            padding: 10px;
          }
          .header {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pharmacy Collections Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>

      <div class="info-box">
        <p><strong>Report Type:</strong> ${showAll ? "All Pickups (Including Previous)" : "Pending Pickups Only"}</p>
        <p><strong>Total Records:</strong> ${deliveries.length}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Entry No.</th>
            <th>Enrollee Name</th>
            <th>Procedure</th>
            <th>Quantity</th>
            <th>Phone Number</th>
            <th>Cost</th>
            <th>Scheme</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${deliveries
            .map((delivery) => {
              const procedureName =
                delivery.ProcedureLines?.[0]?.ProcedureName || "N/A";
              const procedureQuantity =
                delivery.ProcedureLines?.[0]?.ProcedureQuantity || 0;
              const cost =
                delivery.cost || delivery.ProcedureLines?.[0]?.cost || "N/A";

              return `
                  <tr>
                    <td>${delivery.EntryNo}</td>
                    <td><strong>${delivery.EnrolleeName || "N/A"}</strong></td>
                    <td>${procedureName}</td>
                    <td><span class="quantity-badge">${procedureQuantity}</span></td>
                    <td>${delivery.phonenumber || "N/A"}</td>
                    <td>${cost && cost !== "N/A" ? `₦${cost}` : "N/A"}</td>
                    <td><span class="scheme-chip">${delivery.scheme_type || "N/A"}</span></td>
                    <td>
                      <span class="status-badge ${delivery.ispaid ? "status-paid" : "status-pending"}">
                        ${delivery.ispaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                `;
            })
            .join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-item">
          <div class="value">${deliveries.length}</div>
          <div class="label">Total Deliveries</div>
        </div>
        <div class="summary-item">
          <div class="value">${deliveries.filter((d) => !d.ispaid).length}</div>
          <div class="label">Pending</div>
        </div>
        <div class="summary-item">
          <div class="value">${deliveries.filter((d) => d.ispaid).length}</div>
          <div class="label">Paid</div>
        </div>
      </div>

      <div class="footer">
        <p>This report was automatically generated by the Pharmacy Delivery System.</p>
        <p>© ${new Date().getFullYear()} Pharmacy Management System. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  // Create a Blob from the HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Create a temporary iframe to print
  const iframe = document.createElement("iframe");

  iframe.style.display = "none";
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.print();

    // Clean up after a delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  iframe.src = url;
};

export const downloadReassignDeliveriesAsPDF = (
  deliveries: ProviderPickup[],
) => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reassign or Claim Deliveries Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #f15a24;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #c61531;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .info-box {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #f15a24;
        }
        .info-box p {
          margin: 5px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #f15a24;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 10px;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .scheme-chip {
          background-color: #fff8e1;
          color: #f57c00;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          display: inline-block;
        }
        .rider-badge {
          background-color: #e3f2fd;
          color: #1565c0;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 10px;
          display: inline-block;
        }
        .no-rider {
          background-color: #ffebee;
          color: #c62828;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #e0e0e0;
          padding-top: 15px;
        }
        .summary {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #c61531;
        }
        .summary-item .label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .address-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media print {
          body {
            padding: 10px;
          }
          .header {
            page-break-after: avoid;
          } {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reassign or Claim Deliveries Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>

      <div class="info-box">
        <p><strong>Report Type:</strong> Deliveries Available for Reassignment or Claim</p>
        <p><strong>Total Records:</strong> ${deliveries.length}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Enrollee ID</th>
            <th>Enrollee Name</th>
            <th>Scheme Type</th>
            <th>Address</th>
            <th>Time Used</th>
            <th>Assigned Rider</th>
            <th>Date Submitted</th>
          </tr>
        </thead>
        <tbody>
          ${deliveries
            .map((delivery) => {
              const hasRider =
                delivery.assignedrider && delivery.assignedrider.trim() !== "";
              const formattedDate = delivery.inputteddate
                ? new Date(delivery.inputteddate).toLocaleDateString()
                : "N/A";

              return `
                  <tr>
                    <td><strong>${delivery.EnrolleeId || "N/A"}</strong></td>
                    <td>${delivery.EnrolleeName || "N/A"}</td>
                    <td><span class="scheme-chip">${delivery.scheme_type || "N/A"}</span></td>
                    <td class="address-cell" title="${delivery.Pharmacyname || "N/A"}">${delivery.Pharmacyname || "N/A"}</td>
                    <td>${delivery.TimeUsed || "N/A"}</td>
                    <td>
                      <span class="rider-badge ${!hasRider ? "no-rider" : ""}">
                        ${hasRider ? delivery.assignedrider : "Not Assigned"}
                      </span>
                    </td>
                    <td>${formattedDate}</td>
                  </tr>
                `;
            })
            .join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-item">
          <div class="value">${deliveries.length}</div>
          <div class="label">Total Deliveries</div>
        </div>
        <div class="summary-item">
          <div class="value">${deliveries.filter((d) => d.assignedrider && d.assignedrider.trim() !== "").length}</div>
          <div class="label">With Rider</div>
        </div>
        <div class="summary-item">
          <div class="value">${deliveries.filter((d) => !d.assignedrider || d.assignedrider.trim() === "").length}</div>
          <div class="label">Without Rider</div>
        </div>
      </div>

      <div class="footer">
        <p>This report was automatically generated by the Pharmacy Delivery System.</p>
        <p>© ${new Date().getFullYear()} Pharmacy Management System. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  // Create a Blob from the HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Create a temporary iframe to print
  const iframe = document.createElement("iframe");

  iframe.style.display = "none";
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.print();

    // Clean up after a delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  iframe.src = url;
};

export const downloadProviderDeliveriesAsPDF = (
  deliveries: ProviderPickup[],
) => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reassign or Claim Deliveries Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #f15a24;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #c61531;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .info-box {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #f15a24;
        }
        .info-box p {
          margin: 5px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #f15a24;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 10px;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .scheme-chip {
          background-color: #fff8e1;
          color: #f57c00;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          display: inline-block;
        }
        .rider-badge {
          background-color: #e3f2fd;
          color: #1565c0;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 10px;
          display: inline-block;
        }
        .no-rider {
          background-color: #ffebee;
          color: #c62828;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #e0e0e0;
          padding-top: 15px;
        }
        .summary {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #c61531;
        }
        .summary-item .label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .address-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media print {
          body {
            padding: 10px;
          }
          .header {
            page-break-after: avoid;
          } {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reassign or Claim Deliveries Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>

      <div class="info-box">
        <p><strong>Report Type:</strong> Deliveries Available for Reassignment or Claim</p>
        <p><strong>Total Records:</strong> ${deliveries.length}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Enrollee ID</th>
            <th>Enrollee Name</th>
            <th>Scheme Type</th>
            <th>Address</th>
            <th>Time Used</th>
            <th>Date Submitted</th>
          </tr>
        </thead>
        <tbody>
          ${deliveries
            .map((delivery) => {
              const formattedDate = delivery.inputteddate
                ? new Date(delivery.inputteddate).toLocaleDateString()
                : "N/A";

              return `
                  <tr>
                    <td><strong>${delivery.EnrolleeId || "N/A"}</strong></td>
                    <td>${delivery.EnrolleeName || "N/A"}</td>
                    <td><span class="scheme-chip">${delivery.scheme_type || "N/A"}</span></td>
                    <td class="address-cell" title="${delivery.Pharmacyname || "N/A"}">${delivery.Pharmacyname || "N/A"}</td>
                    <td>${delivery.TimeUsed || "N/A"}</td>
                    <td>${formattedDate}</td>
                  </tr>
                `;
            })
            .join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-item">
          <div class="value">${deliveries.length}</div>
          <div class="label">Total Deliveries</div>
        </div>
      </div>

      <div class="footer">
        <p>This report was automatically generated by the Pharmacy Delivery System.</p>
        <p>© ${new Date().getFullYear()} Pharmacy Management System. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  // Create a Blob from the HTML content
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Create a temporary iframe to print
  const iframe = document.createElement("iframe");

  iframe.style.display = "none";
  document.body.appendChild(iframe);

  iframe.onload = () => {
    iframe.contentWindow?.print();

    // Clean up after a delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  iframe.src = url;
};
