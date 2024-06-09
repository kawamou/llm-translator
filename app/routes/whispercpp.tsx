import React, { useState, useEffect } from "react";

const Index = () => {
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
					const formData = new FormData();
					formData.append("audio", audio, "audio.webm");

					try {
						const response = await fetch("/upload", {
							method: "POST",
							headers: {
								"Content-Type": "audio/webm",
							},
							body: audio,
						});

						if (!response.ok) {
							throw new Error("Network response was not ok.");
						}
						const result = await response.json();
						setTranscription(result.stdout);
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
		<div className="text-center">
			<button
				type="button"
				className={`px-4 py-2 rounded text-white ${
					recording ? "bg-red-500" : "bg-blue-500 hover:bg-blue-400"
				}`}
				onClick={recording ? stopRecording : startRecording}
			>
				{recording ? "Stop Recording" : "Start Recording"}
			</button>
			<p className="mt-4">
				{transcription || "Translation will appear here..."}
			</p>
		</div>
	);
};

export default Index;
