import React, { useState, useEffect } from "react";
import { useWorker } from "@shopify/react-web-worker";
import { createWorkerFactory } from "@shopify/web-worker";

const createWorker = createWorkerFactory(() => import("../webworker/worker"));

const Index = () => {
	const worker = useWorker(createWorker);

	const [audio, setAudio] = useState<Blob | null>(null);
	const [recording, setRecording] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null,
	);
	const [processing, setProcessing] = useState(false);

	const [transcript, setTranscript] = useState("");
	const [translatedText, setTranslatedText] = useState("");

	useEffect(() => {
		if (audio) {
			speech2speech(audio);
		}
	}, [audio]);

	const speech2speech = async (targetAudio: Blob | null) => {
		if (!targetAudio) {
			return;
		}
		setProcessing(true);
		const arrayBuffer = await targetAudio.arrayBuffer();
		const audioContext = new AudioContext({ sampleRate: 16000 });
		const decoded = await audioContext.decodeAudioData(arrayBuffer);
		const decodedAudio = decoded.getChannelData(0);

		try {
			const result = await worker.stt(decodedAudio);
			// @ts-ignore
			setTranscript(result.text);
			const output = await worker.translate(
				// @ts-ignore
				result.text,
				"jpn_Jpan",
				"eng_Latn",
			);
			// @ts-ignore
			setTranslatedText(output[0].translation_text);
			// @ts-ignore
			const res = await worker.tts(output[0].translation_text);
			const audioRes = res.audio;
			const sampleRate = res.sampling_rate;

			const ttsAudioContext = new AudioContext({ sampleRate });
			const audioBuffer = ttsAudioContext.createBuffer(
				1,
				audioRes.length,
				sampleRate,
			);
			const audioBufferSource = ttsAudioContext.createBufferSource();
			audioBuffer.getChannelData(0).set(audioRes);
			audioBufferSource.buffer = audioBuffer;
			audioBufferSource.connect(ttsAudioContext.destination);
			audioBufferSource.start();

			setProcessing(false);
			setAudio(null);
		} catch (err) {
			console.error("Error processing audio data:", err);
		}
	};

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

	const handleButtonClick = () => {
		if (recording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	return (
		<div className="max-w-xl mx-auto p-4 mt-4">
			<div className="mb-4">
				<button
					type="button"
					className={`w-full py-2 rounded font-medium text-white ${
						processing
							? "bg-blue-700"
							: recording
								? "bg-red-500"
								: "bg-blue-700 hover:bg-blue-500"
					}`}
					onClick={handleButtonClick}
				>
					{processing ? (
						<div className="mx-auto animate-spin h-6 w-6 border-4 rounded-full border-t-transparent" />
					) : recording ? (
						"Stop Recording"
					) : (
						"Start Recording"
					)}
				</button>
			</div>

			<div className="mb-4">
				<h2 className="text-lg font-medium mb-1">Transcript</h2>
				<p className="bg-gray-100 p-2 rounded font-light">
					{transcript || "Transcript will appear here..."}
				</p>
			</div>

			<div className="mb-4">
				<h2 className="text-lg font-medium mb-1">Translated Text</h2>
				<p className="bg-gray-100 p-2 rounded font-light">
					{translatedText || "Translated text will appear here..."}
				</p>
			</div>
		</div>
	);
};

export default Index;
