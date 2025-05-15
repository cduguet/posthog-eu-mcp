export async function extractDataFromSSEStream(
	stream: ReadableStream<Uint8Array>,
): Promise<string> {
	const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
	const dataLines: string[] = [];
	let currentData = "";
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				// If stream ends and there's data in currentData (e.g. stream didn't end with \n\n properly)
				if (currentData !== "") {
					dataLines.push(currentData);
				}
				break;
			}
			buffer += value;

			let eolIndex: number;
			// Process buffer line by line
			while ((eolIndex = buffer.indexOf("\n")) >= 0) {
				const line = buffer.substring(0, eolIndex).trimEnd(); // Keep leading spaces for data, trim trailing newline
				buffer = buffer.substring(eolIndex + 1);

				if (line.startsWith("data:")) {
					// Append data, handling potential multi-line data fields by adding newline if currentData is not empty
					if (currentData !== "") {
						currentData += `\n${line.substring(5).trimStart()}`;
					} else {
						currentData += line.substring(5).trimStart();
					}
				} else if (line === "" && currentData !== "") {
					// Empty line means the end of an event's data
					dataLines.push(currentData);
					currentData = "";
				} else if (
					line.startsWith("event:") ||
					line.startsWith("id:") ||
					line.startsWith(":")
				) {
					// Ignore event, id, comments for simple data extraction
					// If an event, id, or comment line appears and we have accumulated data, treat it as end of current data block
					if (currentData !== "") {
						dataLines.push(currentData);
						currentData = "";
					}
				}
			}
		}
	} catch (error) {
		console.error("Error reading SSE stream:", error);
		throw new Error("Failed to read or parse SSE stream");
	} finally {
		reader.releaseLock();
	}
	return dataLines.join("\n---\n");
}
