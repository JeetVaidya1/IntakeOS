import { isAgenticSchema, isLegacySchema } from '@/types/agentic';

/**
 * Format snake_case keys into Title Case
 */
export function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get field label from schema (supports both legacy and agentic schemas)
 */
export function getFieldLabel(key: string, schema: any): string {
  if (isLegacySchema(schema)) {
    const field = schema.find((f: any) => f.id === key);
    return field?.label || formatKey(key);
  }
  if (isAgenticSchema(schema)) {
    const info = schema.required_info[key];
    return info?.description || formatKey(key);
  }
  return formatKey(key);
}

