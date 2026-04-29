import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestCompletion, requestCompletionText, streamCompletion } from '../client';

const apiConfig = {
  apiUrl: 'https://llm.example.test/v1',
  apiKey: 'secret',
  modelName: 'model-a',
};

const completionRequest = {
  model: 'model-a',
  messages: [{ role: 'user' as const, content: 'Hello' }],
  temperature: 0.2,
};

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function createStream(chunks: string[]): ReadableStream<Uint8Array<ArrayBuffer>> {
  return new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      const encoder = new TextEncoder();
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk) as Uint8Array<ArrayBuffer>));
      controller.close();
    },
  });
}

async function collectStream(chunks: string[]) {
  const fetchMock = mockFetch({
    ok: true,
    body: createStream(chunks),
  });

  const events = [];
  for await (const event of streamCompletion(apiConfig, completionRequest)) {
    events.push(event);
  }

  return { events, fetchMock };
}

describe('llm client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts completion requests with headers and returns response JSON', async () => {
    const signal = new AbortController().signal;
    const fetchMock = mockFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Hi' } }] }),
    });

    await expect(requestCompletion(apiConfig, completionRequest, signal)).resolves.toEqual({
      choices: [{ message: { content: 'Hi' } }],
    });
    expect(fetchMock).toHaveBeenCalledWith('https://llm.example.test/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret',
      },
      body: JSON.stringify(completionRequest),
      signal,
    });
  });

  it('throws for failed completion requests and returns empty text when content is absent', async () => {
    mockFetch({ ok: false, status: 503 });
    await expect(requestCompletion(apiConfig, completionRequest)).rejects.toThrow('Completion request failed (503)');

    mockFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [] }),
    });
    await expect(requestCompletionText(apiConfig, completionRequest)).resolves.toBe('');

    mockFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [{ message: {} }] }),
    });
    await expect(requestCompletionText(apiConfig, completionRequest)).resolves.toBe('');
  });

  it('streams events and flushes buffered final chunks', async () => {
    const { events, fetchMock } = await collectStream([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}',
    ]);

    expect(events).toEqual([
      { type: 'delta', content: 'Hel' },
      { type: 'delta', content: 'lo' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('https://llm.example.test/v1/chat/completions', expect.objectContaining({
      body: JSON.stringify({ ...completionRequest, stream: true }),
    }));
  });

  it('throws for failed or bodyless stream responses', async () => {
    mockFetch({ ok: false, status: 500 });
    await expect(async () => {
      for await (const event of streamCompletion(apiConfig, completionRequest)) {
        expect(event).toBeDefined();
      }
    }).rejects.toThrow('Streaming request failed (500)');

    mockFetch({ ok: true, body: null });
    await expect(async () => {
      for await (const event of streamCompletion(apiConfig, completionRequest)) {
        expect(event).toBeDefined();
      }
    }).rejects.toThrow('Streaming response did not include a body');
  });
});
