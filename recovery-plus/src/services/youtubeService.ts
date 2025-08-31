import { videoLogger } from './logger';

// Use React Native's global fetch and URL polyfill
declare const fetch: any;
declare const URLSearchParams: any;

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  embedUrl: string;
  fallbackUrl?: string;
}

export interface VideoSearchParams {
  query: string;
  exerciseName: string;
  targetMuscles: string[];
  level: string;
  maxResults?: number;
}

export interface VideoQuality {
  label: string;
  value: string;
  bandwidth?: number;
}

class YouTubeService {
  private readonly YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
  private readonly apiKey: string | undefined;
  private readonly videoCache = new Map<string, YouTubeVideo[]>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private cacheTimestamps = new Map<string, number>();

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    videoLogger.warn('Failed to extract video ID from URL', { url });
    return null;
  }

  /**
   * Generate YouTube embed URL with quality and performance optimizations
   */
  getEmbedUrl(videoId: string, quality: string = 'hd720'): string {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      controls: '1',
      showinfo: '0',
      autoplay: '0',
      playsinline: '1',
      vq: quality,
      iv_load_policy: '3',
      fs: '0',
      disablekb: '1',
      cc_load_policy: '0',
      loop: '0',
      enablejsapi: '0',
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  /**
   * Search for exercise-related YouTube videos
   */
  async searchVideos(params: VideoSearchParams): Promise<YouTubeVideo[]> {
    const cacheKey = this.generateCacheKey(params);

    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.videoCache.get(cacheKey);
      if (cached) {
        videoLogger.info('Returning cached video search results', {
          query: params.query,
        });
        return cached;
      }
    }

    if (!this.apiKey) {
      videoLogger.warn(
        'YouTube API key not configured, falling back to manual search'
      );
      return this.generateFallbackVideos(params);
    }

    try {
      const searchQuery = this.buildSearchQuery(params);
      const maxResults = params.maxResults || 5;

      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: maxResults.toString(),
        order: 'relevance',
        videoCaption: 'closedCaption',
        videoDuration: 'medium',
        key: this.apiKey,
      });

      const searchUrl = `${this.YOUTUBE_API_BASE}/search?${searchParams.toString()}`;

      videoLogger.info('Searching YouTube videos', {
        query: searchQuery,
        maxResults,
      });

      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(
          `YouTube API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        videoLogger.warn('No YouTube videos found for query', {
          query: searchQuery,
        });
        return this.generateFallbackVideos(params);
      }

      const videos = await this.processSearchResults(data.items);

      // Cache the results
      this.videoCache.set(cacheKey, videos);
      this.cacheTimestamps.set(cacheKey, Date.now());

      videoLogger.info('YouTube video search completed', {
        resultsCount: videos.length,
        query: searchQuery,
      });

      return videos;
    } catch (error) {
      videoLogger.error('YouTube video search failed', { error, params });
      return this.generateFallbackVideos(params);
    }
  }

  /**
   * Get video details for multiple video IDs
   */
  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
    if (!this.apiKey || videoIds.length === 0) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        id: videoIds.join(','),
        key: this.apiKey,
      });

      const url = `${this.YOUTUBE_API_BASE}/videos?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processVideoDetails(data.items || []);
    } catch (error) {
      videoLogger.error('Failed to get video details', { error, videoIds });
      return [];
    }
  }

  /**
   * Build optimized search query for exercise videos
   */
  private buildSearchQuery(params: VideoSearchParams): string {
    const { exerciseName, targetMuscles, level } = params;

    const queryParts = [exerciseName, 'exercise', 'workout', 'proper form'];

    // Add muscle groups for better targeting
    if (targetMuscles.length > 0) {
      queryParts.push(targetMuscles.join(' '));
    }

    // Add level-specific terms
    if (level === 'BEGINNER') {
      queryParts.push('beginner', 'tutorial');
    } else if (level === 'ADVANCED') {
      queryParts.push('advanced', 'technique');
    }

    return queryParts.join(' ').toLowerCase();
  }

  /**
   * Process YouTube search results into our video format
   */
  private async processSearchResults(items: any[]): Promise<YouTubeVideo[]> {
    return items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url,
      duration: 'Unknown', // Will be filled by getVideoDetails if needed
      channelTitle: item.snippet.channelTitle,
      embedUrl: this.getEmbedUrl(item.id.videoId),
      fallbackUrl: `https://youtube.com/watch?v=${item.id.videoId}`,
    }));
  }

  /**
   * Process detailed video information
   */
  private processVideoDetails(items: any[]): YouTubeVideo[] {
    return items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url,
      duration: this.formatDuration(item.contentDetails?.duration),
      channelTitle: item.snippet.channelTitle,
      embedUrl: this.getEmbedUrl(item.id),
      fallbackUrl: `https://youtube.com/watch?v=${item.id}`,
    }));
  }

  /**
   * Format ISO 8601 duration to readable format
   */
  private formatDuration(isoDuration?: string): string {
    if (!isoDuration) return 'Unknown';

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Generate fallback video suggestions when API is unavailable
   */
  private generateFallbackVideos(params: VideoSearchParams): YouTubeVideo[] {
    const { exerciseName } = params;

    // Common exercise video IDs for fallback
    const fallbackVideos: Record<string, string[]> = {
      'push up': ['IODxDxX7oi4', '_l3ySVKYVJ8'],
      'wall push-ups': ['IODxDxX7oi4', '_l3ySVKYVJ8'],
      squat: ['aclHkVaku9U', 'YaXPRqUwItQ'],
      plank: ['TvxNkmjdhMM', 'pvIjsG5Svck'],
      burpee: ['dZgVxmf6jVA', 'TU8QYVW0gDU'],
      lunges: ['3XDriUn0udo', 'MxfTNXSFiYI'],
      'cat-cow': ['X3-gKhDWmhU', 'QeZwayTELnw'],
      'cat cow': ['X3-gKhDWmhU', 'QeZwayTELnw'],
      'gentle cat-cow stretch': ['X3-gKhDWmhU', 'QeZwayTELnw'],
      'bird dog': ['wiFNA3sqjCA', 'YQf4xuhZIGs'],
      'dead bug': ['jBpWqaFTu7E', 'AeZOe6zSK1g'],
      'wall sit': ['y-wV4Venusw', '3QpPMZKHrw4'],
      'knee to chest': ['bEaWPCrEOv4', 'FmF9f3q7Q8I'],
      'pelvic tilt': ['yJsxShkxHuE', '1lGfFE3DchU'],
    };

    const exerciseKey = exerciseName.toLowerCase();

    // Try direct match first
    let videoIds = fallbackVideos[exerciseKey];

    // If no direct match, try partial matches
    if (!videoIds) {
      for (const [key, videos] of Object.entries(fallbackVideos)) {
        if (exerciseKey.includes(key) || key.includes(exerciseKey)) {
          videoIds = videos;
          break;
        }
      }
    }

    // Default to a basic stretching video instead of push-ups
    if (!videoIds) {
      videoIds = ['X3-gKhDWmhU', 'QeZwayTELnw']; // Cat-cow stretch as default
      videoLogger.info('Using default fallback videos for exercise', {
        exerciseName,
        exerciseKey,
      });
    } else {
      videoLogger.info('Found fallback videos for exercise', {
        exerciseName,
        exerciseKey,
        videoCount: videoIds.length,
      });
    }

    return videoIds.map((videoId, index) => ({
      id: videoId,
      title: `${exerciseName} - Exercise Tutorial ${index + 1}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: '5:00',
      channelTitle: 'Fitness Channel',
      embedUrl: this.getEmbedUrl(videoId),
      fallbackUrl: `https://youtube.com/watch?v=${videoId}`,
    }));
  }

  /**
   * Generate cache key for search parameters
   */
  private generateCacheKey(params: VideoSearchParams): string {
    return `${params.exerciseName}-${params.level}-${params.targetMuscles.join('-')}`.toLowerCase();
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache(cacheKey: string): boolean {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;

    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp >= this.CACHE_DURATION) {
        this.videoCache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  /**
   * Get available video qualities
   */
  getAvailableQualities(): VideoQuality[] {
    return [
      { label: '720p HD', value: 'hd720', bandwidth: 2500 },
      { label: '480p', value: 'large', bandwidth: 1000 },
      { label: '360p', value: 'medium', bandwidth: 500 },
      { label: '240p', value: 'small', bandwidth: 250 },
      { label: 'Auto', value: 'auto' },
    ];
  }

  /**
   * Select optimal quality based on connection
   */
  selectOptimalQuality(): string {
    // In a real implementation, you might check network conditions
    // For now, default to 720p
    return 'hd720';
  }

  /**
   * Check if a video is available and not region-blocked
   */
  async checkVideoAvailability(videoId: string): Promise<boolean> {
    try {
      const embedUrl = this.getEmbedUrl(videoId);
      const response = await fetch(embedUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const youtubeService = new YouTubeService();
