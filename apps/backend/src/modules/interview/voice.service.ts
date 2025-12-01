import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Voice Service for speech-to-text and text-to-speech operations
 * Integrates with OpenAI Whisper for transcription and TTS
 */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly openaiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
  }

  /**
   * Transcribe audio to text using Whisper API
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      this.logger.log('Transcribing audio with Whisper API');

      const formData = new FormData();
      const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      this.logger.error(`Audio transcription failed: ${(error as Error).message}`);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   */
  async synthesizeSpeech(text: string, voice: string = 'alloy'): Promise<Buffer> {
    try {
      this.logger.log('Synthesizing speech with OpenAI TTS');

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(`Speech synthesis failed: ${(error as Error).message}`);
      throw new Error('Failed to synthesize speech. Please try again.');
    }
  }

  /**
   * Validate audio file format
   */
  isValidAudioFormat(mimeType: string): boolean {
    const validFormats = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/ogg',
    ];
    return validFormats.includes(mimeType);
  }

  /**
   * Get maximum audio file size (25MB for Whisper)
   */
  getMaxAudioSize(): number {
    return 25 * 1024 * 1024; // 25MB
  }
}
