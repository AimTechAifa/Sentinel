import { prisma } from "./prisma";
import { runWithOrgContext } from "./tenancy";

export type CustomFieldEntityType = "Application" | "Environment" | "User" | "Release";

export interface CustomFieldsValidation {
  ok: boolean;
  errors: string[];
  /** Sanitized payload safe to persist (only known fields, coerced types). */
  value: Record<string, unknown>;
}

/**
 * B6 — validates a customFields payload against the org's
 * CustomFieldDefinition rows before it is written to the JSONB column.
 * Rejects unknown fields, wrong types, and missing required fields.
 */
export async function validateCustomFields(
  entityType: CustomFieldEntityType,
  organizationId: string,
  payload: unknown
): Promise<CustomFieldsValidation> {
  const errors: string[] = [];
  const value: Record<string, unknown> = {};

  if (payload == null) payload = {};
  if (typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, errors: ["customFields must be a JSON object"], value: {} };
  }
  const input = payload as Record<string, unknown>;

  const definitions = await runWithOrgContext({ organizationId }, () =>
    prisma.customFieldDefinition.findMany({ where: { entityType } })
  );
  const byName = new Map(definitions.map((d) => [d.fieldName, d]));

  for (const key of Object.keys(input)) {
    if (!byName.has(key)) {
      errors.push(`Unknown custom field "${key}" for ${entityType}`);
    }
  }

  for (const def of definitions) {
    const raw = input[def.fieldName];
    const missing = raw === undefined || raw === null || raw === "";

    if (missing) {
      if (def.required) errors.push(`Missing required custom field "${def.fieldName}"`);
      continue;
    }

    switch (def.fieldType) {
      case "text": {
        if (typeof raw !== "string") {
          errors.push(`Custom field "${def.fieldName}" must be a string`);
        } else {
          value[def.fieldName] = raw;
        }
        break;
      }
      case "number": {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (typeof raw === "boolean" || Number.isNaN(n)) {
          errors.push(`Custom field "${def.fieldName}" must be a number`);
        } else {
          value[def.fieldName] = n;
        }
        break;
      }
      case "date": {
        const d = new Date(String(raw));
        if (Number.isNaN(d.getTime())) {
          errors.push(`Custom field "${def.fieldName}" must be a valid date`);
        } else {
          value[def.fieldName] = d.toISOString();
        }
        break;
      }
      case "dropdown": {
        const options = Array.isArray(def.options) ? (def.options as unknown[]).map(String) : [];
        if (typeof raw !== "string" || !options.includes(raw)) {
          errors.push(
            `Custom field "${def.fieldName}" must be one of: ${options.join(", ") || "(no options defined)"}`
          );
        } else {
          value[def.fieldName] = raw;
        }
        break;
      }
      default: {
        // Unknown definition type — accept as-is rather than block saves.
        value[def.fieldName] = raw;
      }
    }
  }

  return { ok: errors.length === 0, errors, value };
}
