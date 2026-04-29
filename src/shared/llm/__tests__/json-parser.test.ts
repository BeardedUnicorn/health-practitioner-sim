import { describe, expect, it } from 'vitest';
import { parseJsonArray, parseJsonObject, stripJsonCodeFence } from '../json-parser';

describe('json-parser', () => {
  it('strips optional json code fences', () => {
    expect(stripJsonCodeFence('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
    expect(stripJsonCodeFence('```\n[1,2]\n```')).toBe('[1,2]');
    expect(stripJsonCodeFence(' plain text ')).toBe('plain text');
  });

  it('extracts and parses object candidates', () => {
    expect(parseJsonObject<{ ok: boolean }>('prefix {"ok":true} suffix')).toEqual({ ok: true });
    expect(parseJsonObject<{ ok: boolean }>('prefix {"ok":true} then [1] suffix')).toEqual({ ok: true });
    expect(() => parseJsonObject('[]')).toThrow('Expected a JSON object response');
    expect(() => parseJsonObject('null')).toThrow('Expected a JSON object response');
  });

  it('extracts and parses array candidates', () => {
    expect(parseJsonArray<number>('prefix [1,2] suffix')).toEqual([1, 2]);
    expect(parseJsonArray<{ ok: boolean }>('prefix [{"ok":true}] suffix')).toEqual([{ ok: true }]);
    expect(() => parseJsonArray('{}')).toThrow('Expected a JSON array response');
  });
});
