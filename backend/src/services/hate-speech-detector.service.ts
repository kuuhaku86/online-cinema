import axios, { AxiosError } from 'axios';

export interface HateSpeechDetectionResult {
  message: string;
  isHate: boolean;
}

export class HateSpeechDetectorService {
  private readonly apiUrl: string | undefined;

  constructor() {
    this.apiUrl = process.env.HATE_SPEECH_DETECTOR_URL;

    if (!this.apiUrl) {
      throw new Error(
        'HATE_SPEECH_DETECTOR_URL environment variable is not set.',
      );
    }
  }

  public async detect(text: string): Promise<HateSpeechDetectionResult> {
    try {
      const response = await axios.post<HateSpeechDetectionResult>(
        this.apiUrl,
        { text },
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error calling Hate Speech Detector API:',
        (error as AxiosError).message,
      );
      throw new Error('Failed to get hate speech detection result.');
    }
  }
}
