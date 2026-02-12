import toast from "react-hot-toast";

import { API_URL, createAttachmentFromFile } from "../utils";
import { appChunk, authStore } from "../store/app-store";

export type EmailPayload = {
  EmailAddress: string;
  CC: string;
  BCC: string;
  Subject: string;
  MessageBody: string;
  Attachments?: Attachment[] | null;
  Category: string;
  UserId: number;
  ProviderId: number;
  ServiceId: number;
  Reference: string;
  TransactionType: string;
};

export interface Attachment {
  FileName: string;
  ContentType: string;
  Base64Data?: string;
}

export interface EmailTemplateData {
  procedureName: string[];
  diagnosisName: string[];
  enrolleeName: string;
  enrolleeId: string;
  deliveryAddress: string;
  phoneNumber: string;
  pharmacyType?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyTown?: string;
  selectedDeliveries?: any[];
  email?: string;
  memberaddress?: string;
}

// BEFORE 4PM Template - Immediate Delivery
export const getInternalPharmacyEmailTemplateBeforeFourPM = (templateData: EmailTemplateData): string => {
  const { enrolleeName, enrolleeId, deliveryAddress, phoneNumber, selectedDeliveries, memberaddress } = templateData;

  // Build medication table rows
  let medicationRows = '';

  console.log(selectedDeliveries)

  if (selectedDeliveries && selectedDeliveries.length > 0) {
    medicationRows = selectedDeliveries.map((delivery, index) => {
      const procedureName = delivery.ProcedureLines?.[0]?.ProcedureName || "N/A";
      const dosage = delivery.ProcedureLines?.[0]?.DosageDescription || "One tab daily";
      const quantity = delivery.ProcedureLines?.[0]?.ProcedureQuantity || "N/A";

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 8px;">${procedureName}</td>
          <td style="padding: 12px 8px;">${dosage}</td>
          <td style="padding: 12px 8px;">${quantity}</td>
        </tr>
      `;
    }).join('');
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delivery Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #262626;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          color: white;
          background-color: #f15a24;
          padding: 25px;
          margin: -30px -30px 30px -30px;
          border-radius: 8px 8px 0 0;
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 15px;
        }
        .otp-box {
          background: linear-gradient(135deg, #fff8f0 0%, #ffe8d6 100%);
          border: 3px solid #f15a24;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .otp-label {
          font-size: 14px;
          color: #c61531;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 700;
          color: #c61531;
          letter-spacing: 3px;
          font-family: 'Courier New', monospace;
        }
        .info-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-left: 4px solid #f15a24;
          border-radius: 4px;
        }
        .info-section h3 {
          margin-top: 0;
          color: #c61531;
          font-size: 16px;
        }
        .info-item {
          margin: 8px 0;
          font-size: 14px;
        }
        .info-label {
          font-weight: bold;
          color: #262626;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background-color: white;
          border: 1px solid #ddd;
        }
        th {
          background-color: #f15a24;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 14px;
        }
        td {
          padding: 12px 8px;
          font-size: 14px;
        }
        .contact-box {
          background-color: #e8f4fd;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .contact-box h3 {
          margin-top: 0;
          color: #0066cc;
          font-size: 16px;
        }
        .footer {
          margin-top: 30px;
          padding: 20px;
          background-color: #262626;
          color: white;
          text-align: center;
          font-size: 14px;
          margin-left: -30px;
          margin-right: -30px;
          margin-bottom: -30px;
          border-radius: 0 0 8px 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🏥 Pharmacy Delivery Notification</h2>
        </div>

        <div class="greeting">
          Dear <strong>${enrolleeName} [${enrolleeId}]</strong>,
        </div>

        <p>We hope you're feeling better!</p>

        <p>We've received your prescription and are excited to let you know that your medications are on their way to you! 🎉</p>

        <div class="info-section">
          <h3>Your Delivery Details:</h3>
          <div class="otp-box">
            <div class="otp-label">OTP Code</div>
            <div class="otp-code">${deliveryAddress}</div>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">Please show this to our rider</p>
          </div>
          <div class="info-item">
            <span class="info-label">📍 Delivery Address:</span> ${memberaddress}
          </div>
          <div class="info-item">
            <span class="info-label">📞 Phone Number:</span> ${phoneNumber}
          </div>
          <div class="info-item">
            <span class="info-label">⏱️ Estimated Arrival:</span> Soon!
          </div>
        </div>

        <h3 style="color: #c61531; margin-top: 30px;">Medication List</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align: center;">SN</th>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${medicationRows || '<tr><td colspan="4" style="text-align: center; padding: 20px;">No medications listed</td></tr>'}
          </tbody>
        </table>

        <div class="contact-box">
          <h3>Contact & Delivery Details</h3>
          <p style="margin: 5px 0;"><strong>Please confirm:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Is your phone number accurate?</li>
            <li>Is your delivery address correct?</li>
          </ul>
          <p style="margin-top: 15px;">If you need to clarify any details or have questions about your medications, please email us at <strong>Pharmacybenefitmgt@leadway.com</strong> or call:</p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            <li><strong>0701 170 6864</strong> (acute medications)</li>
            <li><strong>0708 340 6022</strong> (chronic refills)</li>
          </ul>
        </div>

        <p style="margin-top: 25px;">Your health is our priority, and we're committed to delivering excellent service every step of the way! 💙</p>

        <p style="margin-top: 15px;"><strong>Stay well and take care!</strong></p>

        <div class="footer">
          <p style="margin: 0; font-weight: bold;">Leadway HMO - Your Health, Our Priority</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This is an automated notification. Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// AFTER 4PM Template - Next Day Delivery
export const getInternalPharmacyEmailTemplateAfterFourPM = (templateData: EmailTemplateData): string => {
  const { enrolleeName, enrolleeId, deliveryAddress, phoneNumber, selectedDeliveries, memberaddress } = templateData;

  // Build medication table rows
  let medicationRows = '';

  if (selectedDeliveries && selectedDeliveries.length > 0) {
    medicationRows = selectedDeliveries.map((delivery, index) => {
      const procedureName = delivery.ProcedureLines?.[0]?.ProcedureName || "N/A";
      const dosage = delivery.ProcedureLines?.[0]?.DosageDescription || "One tab daily";
      const quantity = delivery.ProcedureLines?.[0]?.ProcedureQuantity || "N/A";

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 8px;">${procedureName}</td>
          <td style="padding: 12px 8px;">${dosage}</td>
          <td style="padding: 12px 8px;">${quantity}</td>
        </tr>
      `;
    }).join('');
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delivery Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #262626;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          color: white;
          background-color: #f15a24;
          padding: 25px;
          margin: -30px -30px 30px -30px;
          border-radius: 8px 8px 0 0;
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 15px;
        }
        .otp-box {
          background: linear-gradient(135deg, #fff8f0 0%, #ffe8d6 100%);
          border: 3px solid #f15a24;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .otp-label {
          font-size: 14px;
          color: #c61531;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 700;
          color: #c61531;
          letter-spacing: 3px;
          font-family: 'Courier New', monospace;
        }
        .info-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-left: 4px solid #f15a24;
          border-radius: 4px;
        }
        .info-section h3 {
          margin-top: 0;
          color: #c61531;
          font-size: 16px;
        }
        .info-item {
          margin: 8px 0;
          font-size: 14px;
        }
        .info-label {
          font-weight: bold;
          color: #262626;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background-color: white;
          border: 1px solid #ddd;
        }
        th {
          background-color: #f15a24;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 14px;
        }
        td {
          padding: 12px 8px;
          font-size: 14px;
        }
        .contact-box {
          background-color: #e8f4fd;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .contact-box h3 {
          margin-top: 0;
          color: #0066cc;
          font-size: 16px;
        }
        .footer {
          margin-top: 30px;
          padding: 20px;
          background-color: #262626;
          color: white;
          text-align: center;
          font-size: 14px;
          margin-left: -30px;
          margin-right: -30px;
          margin-bottom: -30px;
          border-radius: 0 0 8px 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🏥 Pharmacy Delivery Notification</h2>
        </div>

        <div class="greeting">
          Dear <strong>${enrolleeName} [${enrolleeId}]</strong>,
        </div>

        <p>We hope you're feeling better!</p>

        <p>We've received your prescription and are excited to let you know that your order is ready however if you got this message late in the day, medication delivery might not be possible today.</p>

        <p>We will ensure you get your delivery early tomorrow. We sincerely apologize for any inconvenience this may cause.</p>

        <div class="info-section">
          <h3>Your Delivery Details:</h3>
          <div class="otp-box">
            <div class="otp-label">OTP Code</div>
            <div class="otp-code">${deliveryAddress}</div>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">Please show this to our rider</p>
          </div>
          <div class="info-item">
            <span class="info-label">📍 Delivery Address:</span> ${memberaddress}
          </div>
          <div class="info-item">
            <span class="info-label">📞 Phone Number:</span> ${phoneNumber}
          </div>
          <div class="info-item">
            <span class="info-label">⏱️ Estimated Arrival:</span> Soon!
          </div>
        </div>

        <h3 style="color: #c61531; margin-top: 30px;">Medication List</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align: center;">SN</th>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${medicationRows || '<tr><td colspan="4" style="text-align: center; padding: 20px;">No medications listed</td></tr>'}
          </tbody>
        </table>

        <div class="contact-box">
          <h3>Contact & Delivery Details</h3>
          <p style="margin: 5px 0;"><strong>Please confirm:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Is your phone number accurate?</li>
            <li>Is your delivery address correct?</li>
          </ul>
          <p style="margin-top: 15px;">If you need to clarify any details or have questions about your medications, please email us at <strong>Pharmacybenefitmgt@leadway.com</strong> or call:</p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            <li><strong>0701 170 6864</strong> (acute medications)</li>
            <li><strong>0708 340 6022</strong> (chronic refills)</li>
          </ul>
        </div>

        <p style="margin-top: 25px;">Your health is our priority, and we're committed to delivering excellent service every step of the way! 💙</p>

        <p style="margin-top: 15px;"><strong>Stay well and take care!</strong></p>

        <div class="footer">
          <p style="margin: 0; font-weight: bold;">Leadway HMO - Your Health, Our Priority</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This is an automated notification. Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Main function that routes to correct template based on time
export const getInternalPharmacyEmailTemplate = (templateData: EmailTemplateData): string => {
  const currentHour = new Date().getHours();
  const isWorkHours = currentHour < 16; // Before 4pm

  if (isWorkHours) {
    return getInternalPharmacyEmailTemplateBeforeFourPM(templateData);
  } else {
    return getInternalPharmacyEmailTemplateAfterFourPM(templateData);
  }
};

export const getExternalPharmacyEmailTemplate = (templateData: EmailTemplateData): string => {
  const {
    enrolleeName,
    enrolleeId,
    deliveryAddress,
    pharmacyName,
    pharmacyAddress,
    pharmacyTown,
    selectedDeliveries
  } = templateData;

  // Build medication table rows
  let medicationRows = '';

  if (selectedDeliveries && selectedDeliveries.length > 0) {
    medicationRows = selectedDeliveries.map((delivery, index) => {
      const procedureName = delivery.ProcedureLines?.[0]?.ProcedureName || "N/A";
      const dosage = delivery.ProcedureLines?.[0]?.Dosage || "One tab daily";
      const quantity = delivery.ProcedureLines?.[0]?.Quantity || "N/A";

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 8px;">${procedureName}</td>
          <td style="padding: 12px 8px;">${dosage}</td>
          <td style="padding: 12px 8px;">${quantity}</td>
        </tr>
      `;
    }).join('');
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pharmacy Pickup Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #262626;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          color: white;
          background-color: #f15a24;
          padding: 25px;
          margin: -30px -30px 30px -30px;
          border-radius: 8px 8px 0 0;
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 15px;
        }
        .highlight-box {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border: 3px solid #4caf50;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .otp-box {
          background: linear-gradient(135deg, #fff8f0 0%, #ffe8d6 100%);
          border: 3px solid #f15a24;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .otp-label {
          font-size: 14px;
          color: #c61531;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 700;
          color: #c61531;
          letter-spacing: 3px;
          font-family: 'Courier New', monospace;
        }
        .info-section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-left: 4px solid #f15a24;
          border-radius: 4px;
        }
        .info-section h3 {
          margin-top: 0;
          color: #c61531;
          font-size: 16px;
        }
        .info-item {
          margin: 8px 0;
          font-size: 14px;
        }
        .info-label {
          font-weight: bold;
          color: #262626;
        }
        .checklist {
          background-color: #fff9e6;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .checklist h3 {
          margin-top: 0;
          color: #f57c00;
          font-size: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background-color: white;
          border: 1px solid #ddd;
        }
        th {
          background-color: #f15a24;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 14px;
        }
        td {
          padding: 12px 8px;
          font-size: 14px;
        }
        .contact-box {
          background-color: #e8f4fd;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .contact-box h3 {
          margin-top: 0;
          color: #0066cc;
          font-size: 16px;
        }
        .footer {
          margin-top: 30px;
          padding: 20px;
          background-color: #262626;
          color: white;
          text-align: center;
          font-size: 14px;
          margin-left: -30px;
          margin-right: -30px;
          margin-bottom: -30px;
          border-radius: 0 0 8px 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🏥 Pharmacy Pickup Notification</h2>
        </div>

        <div class="greeting">
          Dear <strong>${enrolleeName} [${enrolleeId}]</strong>,
        </div>

        <p>We hope you're feeling much better!</p>

        <p>Great news! We've received your prescription and your medications are ready for pickup at our partner pharmacy.</p>

        <div class="info-section">
          <h3>Pickup Details:</h3>
          <div class="info-item">
            <span class="info-label">🏪 Pharmacy Name:</span> ${pharmacyName || "N/A"}
          </div>
          <div class="info-item">
            <span class="info-label">📍 Pharmacy Address:</span> ${pharmacyAddress || "N/A"}, ${pharmacyTown || "N/A"}
          </div>

          <div class="otp-box">
            <div class="otp-label">Pickup Code (OTP)</div>
            <div class="otp-code">${deliveryAddress}</div>
          </div>

          <div class="info-item">
            <span class="info-label">⏰ Code Valid For:</span> 48 hours from now
          </div>
        </div>

        <div class="checklist">
          <h3>What to Bring:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>✓ Your Leadway Enrollee ID</li>
            <li>✓ Your Pickup Code (OTP) shown above</li>
          </ul>
          <p style="margin-top: 15px; font-size: 14px;">Simply visit the pharmacy within 48 hours, present your Enrollee ID and OTP code, and collect your medications!</p>
        </div>

        <h3 style="color: #c61531; margin-top: 30px;">Medication List</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align: center;">SN</th>
              <th>Medication</th>
              <th>Dosage</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${medicationRows || '<tr><td colspan="4" style="text-align: center; padding: 20px;">No medications listed</td></tr>'}
          </tbody>
        </table>

        <div class="contact-box">
          <h3>Contact Us</h3>
          <p style="margin: 5px 0;"><strong>Need Help?</strong></p>
          <p style="margin: 10px 0;">If you have any questions about your medications or pickup process, please contact us:</p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            <li><strong>Email:</strong> Pharmacybenefitmgt@leadway.com</li>
            <li><strong>Phone:</strong> 0701 170 6864</li>
          </ul>
        </div>

        <p style="margin-top: 25px;">Your health matters to us, and we are here to support you every step of the way!</p>

        <p style="margin-top: 15px;"><strong>Wishing you a speedy recovery!</strong></p>

        <div class="footer">
          <p style="margin: 0; font-weight: bold;">Leadway HMO - Your Health, Our Priority</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This is an automated notification. Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getEmailTemplate = (templateData: EmailTemplateData): string => {
  const { pharmacyType } = templateData;

  // Route to appropriate template based on pharmacy type
  if (pharmacyType === "Internal") {
    console.log("I am Internal")

    return getInternalPharmacyEmailTemplate(templateData);
  } else if (pharmacyType === "External") {
    console.log("I am External");

    return getExternalPharmacyEmailTemplate(templateData);
  }

  // Fallback to internal template if no type specified
  return getInternalPharmacyEmailTemplate(templateData);
};

export const getPharmacyDeliveryEmailTemplate = (templateData: EmailTemplateData): string => {
  const { enrolleeName, deliveryAddress } = templateData;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pharmacy Pickup Code</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f7fa;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #f15a24 0%, #c61531 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .greeting {
          font-size: 18px;
          color: #333;
          margin-bottom: 25px;
        }
        .message {
          font-size: 16px;
          color: #555;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .code-box {
          background: linear-gradient(135deg, #fff8f0 0%, #ffe8d6 100%);
          border: 3px solid #f15a24;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        .code-label {
          font-size: 14px;
          color: #c61531;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .code-value {
          font-size: 36px;
          font-weight: 700;
          color: #c61531;
          letter-spacing: 3px;
          font-family: 'Courier New', monospace;
          margin: 10px 0;
        }
        .instructions {
          background-color: #f8f9fa;
          border-left: 4px solid #f15a24;
          padding: 20px;
          margin: 25px 0;
          text-align: left;
          border-radius: 4px;
        }
        .instructions p {
          margin: 10px 0;
          color: #555;
          font-size: 15px;
        }
        .footer {
          background-color: #262626;
          color: #ffffff;
          padding: 25px 30px;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
          font-size: 13px;
          color: #999;
        }
        .footer .timestamp {
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Pharmacy Pickup Code</h1>
        </div>

        <div class="content">
          <p class="greeting">
            Dear <strong>${enrolleeName}</strong>,
          </p>

          <p class="message">
            Your medication is ready for pickup. Please use the code below to collect your prescription from the pharmacy.
          </p>

          <div class="code-box">
            <div class="code-label">Your Pickup Code</div>
            <div class="code-value">${deliveryAddress || "N/A"}</div>
          </div>

          <div class="instructions">
            <p><strong>📋 Instructions:</strong></p>
            <p>• Present this code at the pharmacy counter</p>
            <p>• Have a valid ID ready for verification</p>
            <p>• Contact us if you have any questions</p>
          </div>

          <p class="message" style="margin-top: 30px;">
            Thank you for choosing our pharmacy services.
          </p>
        </div>

        <div class="footer">
          <p><strong>Pharmacy Delivery System</strong></p>
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p class="timestamp">Generated on: ${new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendEmailAlert = async (templateData: EmailTemplateData, attachmentFile?: File | null) => {
  const { user } = authStore.get();
  const { enrolleeData } = appChunk.get();

  try {
    let attachments: Attachment[] | null = null;

    if (attachmentFile) {
      try {
        const attachment = await createAttachmentFromFile(attachmentFile);

        attachments = [attachment];
      } catch (error) {
        toast.error(`Failed to process attachment. Sending email without attachment: ${(error as Error).message}`);
      }
    }

    const emailPayload: EmailPayload = {
      EmailAddress: String(enrolleeData?.Member_Email),
      CC: `Pharmacybenefitmgt@leadway.com`,
      BCC: "",
      Subject: `Pharmacy Delivery Request - ${templateData.enrolleeName} (ID: ${templateData.enrolleeId})`,
      MessageBody: getEmailTemplate(templateData),
      Attachments: attachments,
      Category: "PHARMACY_DELIVERY",
      UserId: user?.User_id || 0,
      ProviderId: 0,
      ServiceId: 0,
      Reference: templateData.enrolleeId,
      TransactionType: "DELIVERY_NOTIFICATION",
    };

    const response = await fetch(
      `${API_URL}/EnrolleeProfile/SendEmailAlert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const result = await response.json();

    toast.success("Email Sent Successfully!");

    return result;

  } catch (err) {
    toast.error(`Failed to send Email: ${(err as Error).message}`);
    throw err;
  }
};

export const sendPhaEmailAlert = async (templateData: EmailTemplateData, attachmentFile?: File | null) => {
  try {
    let attachments: Attachment[] | null = null;

    if (attachmentFile) {
      try {
        const attachment = await createAttachmentFromFile(attachmentFile);

        attachments = [attachment];
      } catch (error) {
        toast.error(`Failed to process attachment. Sending email without attachment: ${(error as Error).message}`);
      }
    }

    const emailPayload: EmailPayload = {
      EmailAddress: templateData.email || "",
      CC: "Pharmacybenefitmgt@leadway.com",
      BCC: "",
      Subject: `🏥 Pharmacy Delivery - ${templateData.enrolleeName} (${templateData.enrolleeId})`,
      MessageBody: getEmailTemplate(templateData),
      Attachments: attachments,
      Category: "PHARMACY_DELIVERY",
      UserId: 0,
      ProviderId: 0,
      ServiceId: 0,
      Reference: templateData.enrolleeId,
      TransactionType: "DELIVERY_NOTIFICATION",
    };

    const response = await fetch(
      `${API_URL}/EnrolleeProfile/SendEmailAlert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const result = await response.json();

    return result;

  } catch (err) {
    toast.error((err as Error).message)
    throw err;
  }
};
