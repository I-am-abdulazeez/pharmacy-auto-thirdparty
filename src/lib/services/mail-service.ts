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
