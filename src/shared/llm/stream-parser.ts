import { LlmStreamEvent } from '../../types';

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

export class LlmStreamParser {
  private buffer = '';

  pushChunk(chunk: string): LlmStreamEvent[] {
    this.buffer += chunk;

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    return this.parseLines(lines);
  }

  flush(): LlmStreamEvent[] {
    if (!this.buffer.trim()) {
      this.buffer = '';
      return [];
    }

    const lines = [this.buffer];
    this.buffer = '';
    return this.parseLines(lines);
  }

  private parseLines(lines: string[]): LlmStreamEvent[] {
    const events: LlmStreamEvent[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) {
        continue;
      }

      const payload = trimmed.slice(6);
      if (payload === '[DONE]') {
        events.push({ type: 'done' });
        continue;
      }

      try {
        const parsed = JSON.parse(payload) as StreamChunk;
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          events.push({ type: 'delta', content });
        }
      } catch {
        // Ignore malformed chunks; stream should continue.
      }
    }

    return events;
  }
}
