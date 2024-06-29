import { pipeline } from "@xenova/transformers";
import type {
	PipelineType,
	TranslationPipeline,
	AutomaticSpeechRecognitionPipeline,
	TextToAudioPipeline,
} from "@xenova/transformers";

export const hello = async (name: string) => {
	return `Hello, ${name}!`;
};

let translationPipelineInstance: TranslationPipeline | null = null;
let sttPipelineInstance: AutomaticSpeechRecognitionPipeline | null = null;
let ttsPipelineInstance: TextToAudioPipeline | null = null;

export const getTranslationPipelineSingleton = async (
	progress_callback: () => void,
): Promise<TranslationPipeline> => {
	if (translationPipelineInstance === null) {
		const pipelineInstance = await pipeline(
			"translation",
			"Xenova/nllb-200-distilled-600M",
			{
				progress_callback,
				config: {},
			},
		);
		translationPipelineInstance = pipelineInstance as TranslationPipeline;
	}
	return translationPipelineInstance;
};

export const translate = async (
	text: string,
	src_lang: string,
	tgt_lang: string,
) => {
	const translator = await getTranslationPipelineSingleton(() => {});

	const output = await translator(text, {
		// @ts-ignore
		tgt_lang,
		src_lang,
	});
	return output;
};

export const getSTTPipelineSingleton = async (
	progress_callback: (progress: number) => void,
): Promise<AutomaticSpeechRecognitionPipeline> => {
	if (sttPipelineInstance === null) {
		const pipelineInstance = await pipeline(
			"automatic-speech-recognition",
			"Xenova/whisper-small",
			{
				progress_callback,
			},
		);
		sttPipelineInstance =
			pipelineInstance as AutomaticSpeechRecognitionPipeline;
	}
	return sttPipelineInstance;
};

export const stt = async (audio: Float32Array) => {
	const stt = await getSTTPipelineSingleton(() => {});
	const result = await stt(audio, {
		language: "ja",
		task: "transcribe",
	});
	return result;
};

export const getTTSPipelineSingleton = async (
	progress_callback: (progress: number) => void,
): Promise<TextToAudioPipeline> => {
	if (ttsPipelineInstance === null) {
		const pipelineInstance = await pipeline(
			"text-to-audio",
			"Xenova/speecht5_tts",
			{
				progress_callback,
				quantized: false, // これまじで大事
			},
		);

		ttsPipelineInstance = pipelineInstance as TextToAudioPipeline;
	}
	return ttsPipelineInstance;
};

export const tts = async (text: string) => {
	const tts = await getTTSPipelineSingleton(() => {});
	const speaker_embeddings =
		"https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin";
	const result = await tts(
		"Many people got together to talk about manga culture. こんにちは！よろしくね",
		{
			speaker_embeddings,
		},
	);
	return result;
};
