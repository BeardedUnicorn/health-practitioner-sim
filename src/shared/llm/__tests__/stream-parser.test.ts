import { describe, expect, it } from 'vitest';
import { LlmStreamParser } from '../stream-parser';

describe('LlmStreamParser', () => {
  it('parses delta and done events from SSE chunks', () => {
    const parser = new LlmStreamParser();

    const events = parser.pushChunk(
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n' +
        'data: {"choices":[{"delta":{"content":" world"}}]}\n' +
        'data: [DONE]\n',
    );

    expect(events).toEqual([
      { type: 'delta', content: 'Hello' },
      { type: 'delta', content: ' world' },
      { type: 'done' },
    ]);
  });

  it('ignores malformed chunks and preserves valid events', () => {
    const parser = new LlmStreamParser();

    const events = parser.pushChunk(
      ': keep-alive\n' +
      'data: {"choices":[{"delta":{"content":"Valid"}}]}\n' +
        'data: {"choices":[{"delta":{}}]}\n' +
        'data: not-json\n' +
        'data: {"choices":[{"delta":{"content":" chunk"}}]}\n',
    );

    expect(events).toEqual([
      { type: 'delta', content: 'Valid' },
      { type: 'delta', content: ' chunk' },
    ]);
  });

  it('flushes partial data and drops empty buffers', () => {
    const parser = new LlmStreamParser();

    expect(parser.pushChunk('   ')).toEqual([]);
    expect(parser.flush()).toEqual([]);

    expect(parser.pushChunk('data: {"choices":[{"delta":{"content":"Partial"}}]}')).toEqual([]);
    expect(parser.flush()).toEqual([{ type: 'delta', content: 'Partial' }]);
  });
});
