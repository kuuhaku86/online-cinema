import axios from 'axios';
import { HateSpeechDetectorService } from './hate-speech-detector.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HateSpeechDetectorService', () => {
  let service: HateSpeechDetectorService;

  const mockApiUrl = 'http://detector:5000';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HATE_SPEECH_DETECTOR_URL = mockApiUrl;
    service = new HateSpeechDetectorService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if HATE_SPEECH_DETECTOR_URL is not set', () => {
    delete process.env.HATE_SPEECH_DETECTOR_URL;
    expect(() => new HateSpeechDetectorService()).toThrow(
      'HATE_SPEECH_DETECTOR_URL environment variable is not set.',
    );
  });

  describe('detect', () => {
    it('should return isHate: false for clean text', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { message: 'ok', isHate: false },
      });

      const result = await service.detect('hello there');

      expect(mockedAxios.post).toHaveBeenCalledWith(mockApiUrl + '/analyze', {
        text: 'hello there',
      });
      expect(result).toEqual({ message: 'ok', isHate: false });
    });

    it('should return isHate: true for hate speech', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { message: 'hate detected', isHate: true },
      });

      const result = await service.detect('hateful text');

      expect(result).toEqual({ message: 'hate detected', isHate: true });
    });

    it('should throw on network error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(service.detect('any text')).rejects.toThrow(
        'Failed to get hate speech detection result.',
      );
    });
  });
});
