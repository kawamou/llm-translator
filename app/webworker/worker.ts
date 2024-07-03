import { env, pipeline } from "@xenova/transformers";
import type {
	TranslationPipeline,
	AutomaticSpeechRecognitionPipeline,
	TextToAudioPipeline,
} from "@xenova/transformers";

let translationPipelineInstance: TranslationPipeline | null = null;
let sttPipelineInstance: AutomaticSpeechRecognitionPipeline | null = null;
let ttsPipelineInstance: TextToAudioPipeline | null = null;

export const getTranslationPipelineSingleton = async (
	progress_callback: () => void,
): Promise<TranslationPipeline> => {
	if (translationPipelineInstance === null) {
		const pipelineInstance = await pipeline(
			"translation",
			// "Xenova/nllb-200-distilled-600M", これデカすぎるかも？
			"Xenova/opus-mt-ja-en",
			{
				progress_callback,
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

	// const output = await translator(text, {
	// 	// @ts-ignore
	// 	tgt_lang,
	// 	src_lang,
	// });
	const output = await translator(text);
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
		language: "ja", // nullでも自動検知らしい
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
	const result = await tts(text, {
		speaker_embeddings,
	});
	return result;
};
