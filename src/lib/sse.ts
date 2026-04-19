/**
 * Parse an SSE stream from the chat API, yielding text chunks.
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();

  // Buffer across reads — a single SSE frame (especially the large
  // <project_table> JSON payload) can arrive split across multiple network
  // chunks behind a proxy like Railway's. Process only complete lines
  // (terminated by "\n") and keep any trailing partial line for the next
  // iteration. Without this, large frames silently fail to parse in prod.
  let buffer = "";

  const handleLine = function* (line: string): Generator<string> {
    if (!line.startsWith("data: ")) return;
    const data = line.slice(6);
    if (data === "[DONE]") throw new Error("__SSE_DONE__");
    try {
      const parsed = JSON.parse(data);
      if (parsed.text) yield parsed.text;
    } catch (err) {
      // Surface parse failures in logs so we don't silently lose frames
      // the way we did with the project_table payload pre-fix.
      if (err instanceof Error && err.message === "__SSE_DONE__") throw err;
      console.warn(
        "parseSSEStream: dropped malformed frame",
        { dataLength: data.length, preview: data.slice(0, 120) }
      );
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let nlIdx;
      while ((nlIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nlIdx);
        buffer = buffer.slice(nlIdx + 1);
        try {
          yield* handleLine(line);
        } catch (err) {
          if (err instanceof Error && err.message === "__SSE_DONE__") return;
          throw err;
        }
      }
    }

    // Flush any final line that wasn't newline-terminated.
    if (buffer.length > 0) {
      try {
        yield* handleLine(buffer);
      } catch (err) {
        if (err instanceof Error && err.message === "__SSE_DONE__") return;
        throw err;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
