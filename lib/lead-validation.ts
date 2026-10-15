import type { FieldErrors, Interest, LeadInput, ValidatedLead } from "@/lib/lead-types";

const NAME_MAX = 200;
const COMMENT_MAX = 2000;
const PRODUCT_MAX = 200;
const UTM_MAX = 255;
const LANDING_URL_MAX = 2048;

const INTERESTS: Interest[] = ["subscription", "order", "question"];

/** Формат после нормализации: +375 и ровно 9 цифр (без пробелов и скобок). */
export const PHONE_NORMALIZED_PATTERN = /^\+375\d{9}$/;

const DISALLOWED_PHONE_CHARS = /[^\d+\s()\-]/;

export function normalizeBelarusPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || DISALLOWED_PHONE_CHARS.test(trimmed)) {
    return null;
  }

  let compact = trimmed.replace(/[\s\-()]/g, "");
  if (compact.startsWith("375")) {
    compact = `+${compact}`;
  } else if (compact.startsWith("+375")) {
    // already prefixed
  } else if (compact.startsWith("+")) {
    return null;
  } else {
    return null;
  }

  if (!PHONE_NORMALIZED_PATTERN.test(compact)) {
    return null;
  }

  return compact;
}

function optionalText(
  value: unknown,
  max: number,
  field: keyof FieldErrors,
  errors: FieldErrors,
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    errors[field] = "Некорректное значение";
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    errors[field] = `Не более ${max} символов`;
    return null;
  }
  return trimmed.length ? trimmed : null;
}

function landingUrl(value: unknown, errors: FieldErrors): string | null {
  const text = optionalText(value, LANDING_URL_MAX, "landingUrl", errors);
  if (!text || errors.landingUrl) {
    return text;
  }
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      errors.landingUrl = "Допустимы только http и https";
      return null;
    }
    return text;
  } catch {
    errors.landingUrl = "Некорректный URL";
    return null;
  }
}

export function validateLeadInput(body: unknown):
  | { ok: true; data: ValidatedLead }
  | { ok: false; fieldErrors: FieldErrors } {
  const errors: FieldErrors = {};

  if (!body || typeof body !== "object") {
    return { ok: false, fieldErrors: { name: "Некорректное тело запроса" } };
  }

  const input = body as LeadInput;

  if (typeof input.name !== "string") {
    errors.name = "Укажите имя";
  } else {
    const name = input.name.trim();
    if (!name) {
      errors.name = "Укажите имя";
    } else if (name.length > NAME_MAX) {
      errors.name = `Не более ${NAME_MAX} символов`;
    }
  }

  if (typeof input.phone !== "string") {
    errors.phone = "Укажите телефон";
  } else {
    const normalized = normalizeBelarusPhone(input.phone);
    if (!normalized) {
      if (!input.phone.trim()) {
        errors.phone = "Укажите телефон";
      } else if (DISALLOWED_PHONE_CHARS.test(input.phone)) {
        errors.phone =
          "Только цифры, пробелы, скобки и дефисы; после нормализации — +375 и 9 цифр";
      } else {
        errors.phone = "Формат: +375 и 9 цифр (пробелы и скобки допустимы)";
      }
    }
  }

  if (typeof input.interest !== "string" || !INTERESTS.includes(input.interest as Interest)) {
    errors.interest = "Выберите, что интересует";
  }

  optionalText(input.comment, COMMENT_MAX, "comment", errors);
  optionalText(input.productName, PRODUCT_MAX, "productName", errors);
  optionalText(input.utmSource, UTM_MAX, "utmSource", errors);
  optionalText(input.utmMedium, UTM_MAX, "utmMedium", errors);
  optionalText(input.utmCampaign, UTM_MAX, "utmCampaign", errors);
  optionalText(input.utmTerm, UTM_MAX, "utmTerm", errors);
  optionalText(input.utmContent, UTM_MAX, "utmContent", errors);
  landingUrl(input.landingUrl, errors);

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  const phoneNormalized = normalizeBelarusPhone(input.phone as string)!;
  const name = (input.name as string).trim();

  const comment =
    input.comment === undefined || input.comment === null || input.comment === ""
      ? null
      : (input.comment as string).trim() || null;
  const productName =
    input.productName === undefined ||
    input.productName === null ||
    input.productName === ""
      ? null
      : (input.productName as string).trim() || null;

  return {
    ok: true,
    data: {
      name,
      phoneNormalized,
      interest: input.interest as Interest,
      comment,
      productName,
      utmSource:
        input.utmSource === undefined || input.utmSource === null
          ? null
          : (input.utmSource as string).trim() || null,
      utmMedium:
        input.utmMedium === undefined || input.utmMedium === null
          ? null
          : (input.utmMedium as string).trim() || null,
      utmCampaign:
        input.utmCampaign === undefined || input.utmCampaign === null
          ? null
          : (input.utmCampaign as string).trim() || null,
      utmTerm:
        input.utmTerm === undefined || input.utmTerm === null
          ? null
          : (input.utmTerm as string).trim() || null,
      utmContent:
        input.utmContent === undefined || input.utmContent === null
          ? null
          : (input.utmContent as string).trim() || null,
      landingUrl:
        input.landingUrl === undefined || input.landingUrl === null
          ? null
          : (input.landingUrl as string).trim() || null,
    },
  };
}
