import { ApiConfig, LlmCompletionRequest, LlmStreamEvent } from '../../types';
import { LlmStreamParser } from './stream-parser';

type LlmCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function buildHeaders(apiConfig: ApiConfig): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiConfig.apiKey}`,
  };
}

export async function requestCompletion(
  apiConfig: ApiConfig,
  request: LlmCompletionRequest,
  signal?: AbortSignal,
): Promise<LlmCompletionResponse> {
  const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(apiConfig),
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Completion request failed (${response.status})`);
  }

  return (await response.json()) as LlmCompletionResponse;
}

export async function requestCompletionText(
  apiConfig: ApiConfig,
  request: LlmCompletionRequest,
  signal?: AbortSignal,
): Promise<string> {
  const data = await requestCompletion(apiConfig, request, signal);
  return data.choices?.[0]?.message?.content ?? '';
}

export async function* streamCompletion(
  apiConfig: ApiConfig,
  request: Omit<LlmCompletionRequest, 'stream'>,
  signal?: AbortSignal,
): AsyncGenerator<LlmStreamEvent> {
  const response = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(apiConfig),
    body: JSON.stringify({ ...request, stream: true }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Streaming request failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error('Streaming response did not include a body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new LlmStreamParser();

  let isDone = false;
  while (!isDone) {
    const { done, value } = await reader.read();
    isDone = done;

    if (!value) {
      continue;
    }

    const chunk = decoder.decode(value, { stream: !done });
    const events = parser.pushChunk(chunk);
    for (const event of events) {
      yield event;
    }
  }

  const remaining = parser.flush();
  for (const event of remaining) {
    yield event;
  }
}
