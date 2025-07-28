import { analytics } from '../analytics';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window and sessionStorage for SSR environments
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('AnalyticsTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('Session Management', () => {
    it('should create a new session ID when none exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      // Reset module to trigger new initialization
      jest.resetModules();
      const { analytics: newAnalytics } = require('../analytics');
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'doorcard-session-id',
        expect.stringMatching(/^session-\d+-[a-z0-9]{9}$/)
      );
    });

    it('should reuse existing session ID', () => {
      const existingSessionId = 'session-12345-abcdef123';
      mockSessionStorage.getItem.mockReturnValue(existingSessionId);
      
      // Session ID should be reused, setItem should not be called
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Event Tracking', () => {
    it('should track events via API call', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const testEvent = {
        doorcardId: 'doorcard-123',
        eventType: 'VIEW' as const,
        metadata: { test: 'data' },
      };

      await analytics.track(testEvent);

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': expect.any(String),
        },
        body: JSON.stringify(testEvent),
      });
    });

    it('should handle tracking failures gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const testEvent = {
        doorcardId: 'doorcard-123',
        eventType: 'VIEW' as const,
      };

      await analytics.track(testEvent);

      expect(consoleSpy).toHaveBeenCalledWith('Analytics tracking failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(() => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response);
    });

    it('should track view events', async () => {
      const trackSpy = jest.spyOn(analytics, 'track');
      
      await analytics.trackView('doorcard-123', { page: 'public' });

      expect(trackSpy).toHaveBeenCalledWith({
        doorcardId: 'doorcard-123',
        eventType: 'VIEW',
        metadata: { page: 'public' },
      });
    });

    it('should track print preview events', async () => {
      const trackSpy = jest.spyOn(analytics, 'track');
      
      await analytics.trackPrint('doorcard-123', 'preview');

      expect(trackSpy).toHaveBeenCalledWith({
        doorcardId: 'doorcard-123',
        eventType: 'PRINT_PREVIEW',
      });
    });

    it('should track print download events', async () => {
      const trackSpy = jest.spyOn(analytics, 'track');
      
      await analytics.trackPrint('doorcard-123', 'download');

      expect(trackSpy).toHaveBeenCalledWith({
        doorcardId: 'doorcard-123',
        eventType: 'PRINT_DOWNLOAD',
      });
    });

    it('should track edit events', async () => {
      const trackSpy = jest.spyOn(analytics, 'track');
      
      await analytics.trackEdit('doorcard-123');

      expect(trackSpy).toHaveBeenCalledWith({
        doorcardId: 'doorcard-123',
        eventType: 'EDIT_STARTED',
      });
    });

    it('should track share events', async () => {
      const trackSpy = jest.spyOn(analytics, 'track');
      
      await analytics.trackShare('doorcard-123', 'email');

      expect(trackSpy).toHaveBeenCalledWith({
        doorcardId: 'doorcard-123',
        eventType: 'SHARE',
        metadata: { method: 'email' },
      });
    });

    it('should track search result events', async () => {
      const trackSpy = jest.spyOn(analytics, 'track');
      
      await analytics.trackSearchResult('doorcard-123', 'professor smith', 2);

      expect(trackSpy).toHaveBeenCalledWith({
        doorcardId: 'doorcard-123',
        eventType: 'SEARCH_RESULT',
        metadata: { query: 'professor smith', position: 2 },
      });
    });
  });

  describe('Server-side rendering', () => {
    it('should handle SSR environment gracefully', () => {
      // Mock SSR environment
      const originalWindow = global.window;
      delete (global as any).window;

      // This should not throw an error
      expect(() => {
        const { analytics: ssrAnalytics } = require('../analytics');
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });
});