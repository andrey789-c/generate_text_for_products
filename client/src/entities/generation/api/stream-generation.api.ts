import type { CreateGenerationDto, StreamingGenerationEvent } from "@/shared/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function streamGeneration(
	data: CreateGenerationDto,
	onEvent: (event: StreamingGenerationEvent) => void,
	signal: AbortSignal,
) {
	const response = await fetch(`${apiUrl}/generations/stream`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
		body: JSON.stringify(data),
		signal,
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as { message?: string } | null;
		throw new Error(payload?.message ?? "Не удалось запустить потоковую генерацию.");
	}
	if (!response.body) throw new Error("API не вернул поток данных.");

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		buffer += decoder.decode(value, { stream: !done });
		const events = buffer.split("\n\n");
		buffer = events.pop() ?? "";
		for (const rawEvent of events) {
			const event = parseEvent(rawEvent);
			if (event) onEvent(event);
		}
		if (done) break;
	}
	const lastEvent = parseEvent(buffer);
	if (lastEvent) onEvent(lastEvent);
}

function parseEvent(rawEvent: string): StreamingGenerationEvent | null {
	const data = rawEvent
		.split("\n")
		.filter((line) => line.startsWith("data:"))
		.map((line) => line.slice(5).trim())
		.join("\n");
	if (!data) return null;
	try {
		const parsed = JSON.parse(data) as StreamingGenerationEvent["data"];
		const type = rawEvent.match(/^event:\s*([^\n]+)/m)?.[1] as
			| StreamingGenerationEvent["type"]
			| undefined;
		return type ? ({ type, data: parsed } as StreamingGenerationEvent) : null;
	} catch {
		return null;
	}
}
