import React, { useState, useEffect } from "react";
import { useWorker } from "@shopify/react-web-worker";
import { createWorkerFactory } from "@shopify/web-worker";

const createWorker = createWorkerFactory(() => import("./worker"));

const Index = () => {
	const worker = useWorker(createWorker);
	const [ready, setReady] = useState(null);
	const [disabled, setDisabled] = useState(false);

	const [modelInitialized, setModelInitialized] = useState(false);
	const [progressItems, setProgressItems] = useState([]);

	const [input, setInput] = useState("I love walking my dog.");
	const [output, setOutput] = useState("");

	const [audio, setAudio] = useState<Blob | null>(null);
	const [recording, setRecording] = useState(false);
	const [transcription, setTranscription] = useState("");
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null,
	);

	const useAutoSendAudio = (audio: Blob | null) => {
		useEffect(() => {
			if (audio) {
				const sendDataToServer = async () => {
					// https://github.com/xenova/transformers.js/blob/1f4ad161427ea878024708e999d9df2ab5c8b7d6/examples/webgpu-whisper/src/App.jsx#L171
					const arrayBuffer = await audio.arrayBuffer();
					const audioContext = new AudioContext({ sampleRate: 16000 * 30 });
					const decoded = await audioContext.decodeAudioData(arrayBuffer);
					const decodedAudio = decoded.getChannelData(0);

					try {
						const url =
							"https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/french-audio.mp3";
						const result = await worker.stt(decodedAudio);
						console.log(audio);
						console.log(result);
						// @ts-ignore
						setTranscription(result.text);
					} catch (err) {
						console.error("Error sending audio data:", err);
					}
				};

				sendDataToServer();

				setAudio(null);
			}
		}, [audio]);
	};

	useAutoSendAudio(audio);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const recorder = new MediaRecorder(stream);
			const audioChunks: BlobPart[] = [];

			recorder.ondataavailable = (e) => {
				audioChunks.push(e.data);
			};

			recorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
				setAudio(audioBlob);
			};

			recorder.start();
			setMediaRecorder(recorder);
			setRecording(true);
		} catch (err) {
			console.error("Error accessing microphone:", err);
		}
	};

	const stopRecording = () => {
		mediaRecorder?.stop();
		setRecording(false);
	};

	return (
		<div className="max-w-3xl mx-auto p-4">
			<div className="flex items-center mb-4">
				<button
					type="button"
					className={`px-4 py-2 rounded font-semibold text-white min-w-40 ${
						recording ? "bg-red-500" : "bg-blue-500 hover:bg-blue-400"
					}`}
					onClick={recording ? stopRecording : startRecording}
				>
					{recording ? "Stop Recording" : "Start Recording"}
				</button>
				<p className="ml-4">
					{transcription || "Translation will appear here..."}
				</p>
			</div>

			<div className="mb-4">
				<button
					type="button"
					className={`px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded min-w-40 ${
						disabled ? "opacity-50 cursor-not-allowed" : ""
					}`}
					onClick={async () => {
						const output = await worker.translate(
							input,
							"jpn_Jpan",
							"eng_Latn",
						);
						console.log(output);
						// @ts-ignore
						setOutput(output[0].translation_text);
					}}
				>
					Translate
				</button>
			</div>

			<div>
				<button
					className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 font-semibold rounded min-w-40"
					type="button"
					onClick={async () => {
						const res = await worker.tts("こんにちは");
						const audioRes = res.audio;
						const sampleRate = res.sampling_rate;

						const audioContext = new AudioContext({ sampleRate });
						const audioBuffer = audioContext.createBuffer(
							1,
							audioRes.length,
							sampleRate,
						);
						const audioBufferSource = audioContext.createBufferSource();
						audioBuffer.getChannelData(0).set(audioRes);
						audioBufferSource.buffer = audioBuffer;
						audioBufferSource.connect(audioContext.destination);
						audioBufferSource.start();

						console.log(res);
					}}
				>
					Tts
				</button>
			</div>
		</div>
	);
};

export default Index;
