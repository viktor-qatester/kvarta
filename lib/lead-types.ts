export type Interest = "subscription" | "order" | "question";

export type LeadInput = {
  name: string;
  phone: string;
  interest: Interest;
  comment?: string | null;
  productName?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingUrl?: string | null;
};

export type ValidatedLead = {
  name: string;
  phoneNormalized: string;
  interest: Interest;
  comment: string | null;
  productName: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  landingUrl: string | null;
};

export type FieldErrors = Partial<
  Record<
    | "name"
    | "phone"
    | "interest"
    | "comment"
    | "productName"
    | "landingUrl"
    | "utmSource"
    | "utmMedium"
    | "utmCampaign"
    | "utmTerm"
    | "utmContent",
    string
  >
>;

export const LEAD_SCHEMAS = ["public", "lead_api_test"] as const;
export type LeadSchema = (typeof LEAD_SCHEMAS)[number];

export function assertLeadSchema(schema: string): LeadSchema {
  if ((LEAD_SCHEMAS as readonly string[]).includes(schema)) {
    return schema as LeadSchema;
  }
  throw new Error("Недопустимая схема для заявок");
}
