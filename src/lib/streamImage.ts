import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";
import { APP_TOKEN, APP_TOKEN_HEADER } from "./app-token";

type ImageEventPayload =
  | { type: "image_generation.partial_image"; b64_json: string; partial_image_index: number; created_at: number }
  | { type: "image_generation.completed"; b64_json: string; created_at: number };

export async function streamImage(
  endpoint: string,
  body: Record<string, unknown>,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [APP_TOKEN_HEADER]: APP_TOKEN,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    // محاولة قراءة رسالة الخطأ الودية من الـ JSON اللي يرجعه السيرفر
    let friendly = "تعذّر توليد الصورة الآن، حاول مرة أخرى بعد قليل.";
    try {
      const data = await res.json();
      if (data?.error && typeof data.error === "string") friendly = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(friendly);
  }


  let sawCompleted = false;
  const parser = createParser({
    onEvent(event) {
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed"
      ) return;
      let payload: ImageEventPayload;
      try { payload = JSON.parse(event.data) as ImageEventPayload; } catch { return; }
      const isFinal = event.event === "image_generation.completed";
      flushSync(() => {
        onFrame(`data:image/png;base64,${payload.b64_json}`, isFinal);
      });
      if (isFinal) sawCompleted = true;
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  if (!sawCompleted) throw new Error("لم تكتمل الصورة — أعد المحاولة");
}
