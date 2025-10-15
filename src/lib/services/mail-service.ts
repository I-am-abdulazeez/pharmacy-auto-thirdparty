import toast from "react-hot-toast";

import { API_URL, createAttachmentFromFile } from "../utils";
import { appChunk, authStore } from "../store/app-store";
import { deliveryFormState } from "../store/delivery-store";

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
}



export const getEmailTemplate = (templateData: EmailTemplateData): string => {
  const { procedureName, diagnosisName, enrolleeName, enrolleeId, deliveryAddress, phoneNumber } = templateData;

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
          max-width: 600px;
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
        .info-section {
          margin-bottom: 15px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .info-label {
          font-weight: bold;
          color: #c61531;
          display: inline-block;
          min-width: 140px;
        }
        .info-value {
          color: #262626;
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
          <h2>Pharmacy Delivery Notification</h2>
        </div>

        <p>Dear Team,</p>

        <p>A new pharmacy delivery has been successfully created. Please find the details below:</p>

        <div class="info-section">
          <div><span class="info-label">Enrollee Name:</span> <span class="info-value">${enrolleeName}</span></div>
        </div>

        <div class="info-section">
          <div><span class="info-label">Enrollee ID:</span> <span class="info-value">${enrolleeId}</span></div>
        </div>

        <div class="info-section">
          <div><span class="info-label">Procedure Name:</span> <span class="info-value">${procedureName}</span></div>
        </div>

        <div class="info-section">
          <div><span class="info-label">Diagnosis:</span> <span class="info-value">${diagnosisName}</span></div>
        </div>

        <div class="info-section">
          <div><span class="info-label">Delivery Address:</span> <span class="info-value">${deliveryAddress}</span></div>
        </div>

        <div class="info-section">
          <div><span class="info-label">Phone Number:</span> <span class="info-value">${phoneNumber}</span></div>
        </div>

        <p>Please process this delivery request accordingly.</p>

        <div class="footer">
          <p>This is an automated notification from the Pharmacy Delivery System.</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
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
  const { enrolleeEmail } = deliveryFormState.get();

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
      EmailAddress: enrolleeEmail,
      CC: "Pharmacybenefitmgt@leadway.com",
      BCC: "",
      Subject: `🏥 Pharmacy Delivery - ${templateData.enrolleeName} (${templateData.enrolleeId})`,
      MessageBody: getPharmacyDeliveryEmailTemplate(templateData),
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
    throw err;
  }
};
