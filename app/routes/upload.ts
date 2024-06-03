import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { unlink, writeFile } from "node:fs/promises";
import { pipeline, Readable } from "node:stream";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

export const action: ActionFunction = async ({ request }) => {
	const buffer = await request.arrayBuffer();
	const tempFilePath = path.join(tmpdir(), `${Date.now()}.webm`);
	await writeFile(tempFilePath, Buffer.from(buffer));

	try {
		// const { stdout } = await execFileAsync("./whisper", [
		// 	"-m",
		// 	"models/ggml-base.bin",
		// 	"-f",
		// 	tempFilePath,
		// ]);
		// const transcription = stdout.trim();

		// 一時ファイルを削除
		await unlink(tempFilePath);

		// return json({ transcription });
		return json({ hoge: "hoge" });
	} catch (error) {
		console.error(`Error processing audio file: ${error}`);
		return json({ error: "Failed to process audio file" }, { status: 500 });
	}
};
