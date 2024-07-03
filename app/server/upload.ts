import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const execFileAsync = promisify(execFile);

// Whisper.cpp が 16kHz の wav ファイルのみを受け付けるため変換する
async function convertToWav(input: string, output: string) {
	return new Promise<void>((resolve, reject) => {
		ffmpeg(input)
			.outputOptions(["-ar 16000", "-ac 1"])
			.toFormat("wav")
			.on("end", () => {
				resolve();
			})
			.on("error", (error) => {
				reject(error);
			})
			.save(output);
	});
}

export const action: ActionFunction = async ({ request }) => {
	if (!request.body) {
		return { status: 400, body: "No file uploaded" };
	}

	const buffer = await request.arrayBuffer();
	const tempWebmFilePath = path.join(".", `${Date.now()}.webm`);
	const tempWavFilePath = path.join(".", `${Date.now()}.wav`);
	await writeFile(tempWebmFilePath, Buffer.from(buffer));

	await convertToWav(tempWebmFilePath, tempWavFilePath);

	const { stdout, stderr } = await execFileAsync(
		path.resolve(__dirname, "../../stt/whisper.cpp/main"),
		[
			"-m",
			path.resolve(__dirname, "../../stt/whisper.cpp/models/ggml-base.bin"),
			"-f",
			tempWavFilePath,
			"-nt",
			"-l",
			"ja",
		],
	);

	console.log("transcription: ", stdout, stderr);

	await unlink(tempWebmFilePath);
	await unlink(tempWavFilePath);

	return json({ stdout });
};
