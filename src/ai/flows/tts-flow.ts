'use server';
/**
 * @fileOverview A flow to convert text to speech.
 *
 * - textToSpeech - Converts a string of text into playable audio data.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const TTSOutputSchema = z.object({
  audio: z.string().describe("Base64 encoded WAV audio data URI."),
});
export type TTSOutput = z.infer<typeof TTSOutputSchema>;

export async function textToSpeech(text: string): Promise<TTSOutput> {
  return ttsFlow(text);
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: z.string(),
    outputSchema: TTSOutputSchema,
  },
  async (query) => {
    if (!query.trim()) {
        return { audio: "" };
    }
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(audioBuffer);
    return {
      audio: 'data:audio/wav;base64,' + wavData,
    };
  }
);
