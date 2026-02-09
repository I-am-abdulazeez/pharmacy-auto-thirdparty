import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type BaseForm = {
  email: string;
  password: string;
};

export type User = {
  Id: string;
  UserName: string;
  PasswordHash: string;
  SecurityStamp: string;
  Discriminator: string;
  Email: string;
  Emailconfirmed: boolean;
  Phonenumber: string;
  Phonenumberconfirmed: boolean;
  Twofactorenabled: boolean;
  LockoutEndDateUtc: string | null;
  LockoutEnabled: boolean;
  AccessFailedCount: number;
  insco_id: number;
  provider_id: string | null | number;
  surname: string;
  firstname: string;
  ModifiedDateTime: string;
  User_id: number;
  DisciplineID: string | null;
  ProfilePicture: string | null;
  ProfilePictureType: string | null;
  DateOfBirth: string | null;
  Gender: string | null;
  Street: string | null;
  CityID: string | null;
  StateID: string | null;
  CountryID: string | null;
  TitleID: string | null;
  TitleName: string | null;
  ConcurrencyStamp: string | null;
  NormalizedUserName: string;
  NormalizedEmail: string;
  LOCKOUTEND: string | null;
  EnterService: boolean | null;
  ConsultServiceEntered: boolean | null;
  RegisterInvoice: boolean | null;
  ViewInvoices: boolean | null;
  Viewaccountstatement: boolean | null;
  Manageprescribers: boolean | null;
  ManageAdministrativestaff: boolean | null;
  ManageAccount: boolean | null;
  PracticeNumber: string | null;
  fixed: string | null;
  function: string | null;
  rightofconnection: string | null;
}

export type LoginResponse = {
  status: number;
  result: User[] | null;
  ErrorMessage: string;
}

export type Provider = {
  Pharmacyid: number | string;
  PharmacyName: string;
  PharmacyAddress?: string;
  PharmacyTown?: string;
};

export type Diagnosis = {
  DiagnosisId: string;
  DiagnosisName: string;
};

export type Procedure = {
  ProcedureId: string;
  ProcedureName: string;
  ProcedureQuantity: number;
  cost: string;
  DosageDescription?: string
};

export type Delivery = {
  // Core delivery fields
  DeliveryFrequency?: string;
  DelStartDate?: string | null;
  NextDeliveryDate?: string | null;
  DiagnosisLines: Diagnosis[];
  ProcedureLines: Procedure[];
  Username: string;
  AdditionalInformation?: string;
  DosageDescription: string;
  Comment: string;
  IsDelivered: boolean;

  // Enrollee information
  EnrolleeId: string;
  EnrolleeName: string;
  EnrolleeEmail: string;
  EnrolleeAge: number;

  // Scheme information
  SchemeName?: string;
  SchemeId?: string;
  scheme_type?: string;

  // Pharmacy information
  Pharmacyid: number | string;
  PharmacyName?: string;
  phonenumber?: string;
  deliveryaddress?: string;

  // Additional fields
  FrequencyDuration?: string;
  EndDate?: string | null;
  Status?: string;
  memberstatus?: string;
  recipientcode?: string;
  cost?: string;
  Tobedeliverdby?: string;
  EntryNo?: number;
  DeliveryId?: string;
  attachment?: File | null;

  // Fields from new API response
  inputteddate?: string;
  modifieddate?: string;
  email?: string;
  codeexpirydate?: string;
  paydate?: string | null;
  ispaid?: number | null;
  othernumber?: string;
  codetopharmacy?: string | null;
  memberaddress?: string;
  isClaimed?: number | null;
  assignedrider?: string | null
  assignedrideron?: string | null;
  source?: string
};


export type DeliveryData = {
  Deliveries: Delivery[];
};

export type DeliveryApiResponse = {
  status: number;
  result: {
    DeliveryFrequency?: string;
    DelStartDate?: string;
    NextDeliveryDate?: string;
    DiagnosisLines: Diagnosis[];
    ProcedureLines: Procedure[];
    Username: string;
    AdditionalInformation?: string;
    DosageDescription: string;
    Comment: string;
    IsDelivered: boolean;

    // Enrollee information
    EnrolleeId: string;
    EnrolleeName: string;
    EnrolleeEmail: string;
    EnrolleeAge: number;

    // Scheme information
    SchemeName?: string;
    SchemeId?: string;
    scheme_type?: string;

    // Pharmacy information
    Pharmacyid: number | string;
    PharmacyName?: string;
    phonenumber?: string;
    deliveryaddress?: string;

    // Additional fields
    FrequencyDuration?: string;
    EndDate?: string;
    Status?: string;
    memberstatus?: string;
    recipientcode?: string;
    cost?: string;
    Tobedeliverdby?: string;
    EntryNo?: number;
    DeliveryId?: string;

    // Fields from new API response
    inputteddate?: string;
    modifieddate?: string;
    email?: string;
    codeexpirydate?: string;
    paydate?: string | null;
    ispaid?: boolean | null;
    othernumber?: string;
    codetopharmacy?: string | null;
  }[]
};
