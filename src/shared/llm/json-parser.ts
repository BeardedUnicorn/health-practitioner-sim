export function stripJsonCodeFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractCandidate(content: string): string {
  const normalized = stripJsonCodeFence(content);

  const objectMatch = normalized.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  const arrayMatch = normalized.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return normalized;
}

export function parseJsonObject<T>(content: string): T {
  const candidate = extractCandidate(content);
  const parsed = JSON.parse(candidate) as unknown;

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object response');
  }

  return parsed as T;
}

export function parseJsonArray<T>(content: string): T[] {
  const candidate = extractCandidate(content);
  const parsed = JSON.parse(candidate) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array response');
  }

  return parsed as T[];
}
