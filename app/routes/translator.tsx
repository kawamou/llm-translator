import { useState, useRef } from "react";

const Index = () => {
	const [isRecording, setIsRecording] = useState(false);
	const [transcript, setTranscript] = useState("");
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const [audioChunks, setAudioChuks] = useState<Blob[]>([]);

	const startRecording = async () => {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorderRef.current = new MediaRecorder(stream);

		mediaRecorderRef.current.ondataavailable = (e) => {
			setAudioChuks((chunks) => [...chunks, e.data]);
		};

		mediaRecorderRef.current.onstop = async () => {
			const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
			setAudioChuks([]);

			const arrayBuffer = await audioBlob.arrayBuffer();
			const buffer = new Uint8Array(arrayBuffer);

			const response = await fetch("/upload", {
				method: "POST",
				headers: { "Content-Type": "application/octet-stream" },
				body: buffer,
			});

			const result = await response.json();
			setTranscript(result.transcription);

			console.log(result);
		};

		mediaRecorderRef.current.start();
		setIsRecording(true);
	};

	const stopRecording = () => {
		mediaRecorderRef.current?.stop();
		setIsRecording(false);
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Audio Recorder</h1>
			<button
				type="button"
				className={`px-4 py-2 rounded ${
					isRecording ? "bg-red-500" : "bg-blue-500"
				} text-white`}
				onClick={isRecording ? stopRecording : startRecording}
			>
				{isRecording ? "Stop" : "Record"}
			</button>
			{transcript && <p className="mt-4">Transcription: {transcript}</p>}
		</div>
	);
};

export default Index;
