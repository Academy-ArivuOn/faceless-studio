// packages/web-intelligence.js
// Real-time web data fetcher for all Pro/Studio agents
// Uses SerpAPI (or fallback to DuckDuckGo scrape) + YouTube Data API v3

// ─── Config ───────────────────────────────────────────────────────────────────
const SERP_API_KEY   = process.env.SERPAPI_KEY;
const YT_API_KEY     = process.env.YOUTUBE_API_KEY;
const TIMEOUT_MS     = 8000;

// ─── Fetch with Timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ─── SerpAPI Search ───────────────────────────────────────────────────────────
async function serpSearch(query, params = {}) {
  if (!SERP_API_KEY) return null;
  try {
    const p = new URLSearchParams({
      api_key: SERP_API_KEY,
      q:       query,
      gl:      'in',
      hl:      'en',
      num:     '10',
      ...params,
    });
    const res  = await fetchWithTimeout(`https://serpapi.com/search?${p}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── DuckDuckGo Fallback (no API key needed) ──────────────────────────────────
async function duckSearch(query) {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetchWithTimeout(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'User-Agent': 'StudioAI/1.0 (content research tool)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      abstract:      data.AbstractText || '',
      source:        data.AbstractSource || '',
      related:       (data.RelatedTopics || []).slice(0, 8).map(t => t.Text).filter(Boolean),
      results:       [],
    };
  } catch {
    return null;
  }
}

// ─── YouTube Data API ─────────────────────────────────────────────────────────

// Search for a channel by name → returns channel info + top videos
export async function fetchYouTubeChannelData(channelName) {
  if (!YT_API_KEY) return null;

  try {
    // 1. Search for channel
    const searchRes = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        key:        YT_API_KEY,
        q:          channelName,
        type:       'channel',
        part:       'snippet',
        maxResults: '3',
      })
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    const channel = searchData.items?.[0];
    if (!channel) return null;

    const channelId = channel.snippet.channelId || channel.id.channelId;

    // 2. Get channel stats
    const statsRes = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/channels?` +
      new URLSearchParams({
        key:  YT_API_KEY,
        id:   channelId,
        part: 'snippet,statistics,brandingSettings',
      })
    );
    const statsData = await statsRes.json();
    const channelInfo = statsData.items?.[0];

    // 3. Get latest 20 videos
    const videosRes = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        key:        YT_API_KEY,
        channelId,
        part:       'snippet',
        order:      'viewCount',
        type:       'video',
        maxResults: '20',
      })
    );
    const videosData = await videosRes.json();

    // 4. Get video IDs for stats
    const videoIds = (videosData.items || []).map(v => v.id.videoId).join(',');

    let videoStats = [];
    if (videoIds) {
      const vstRes = await fetchWithTimeout(
        `https://www.googleapis.com/youtube/v3/videos?` +
        new URLSearchParams({
          key:  YT_API_KEY,
          id:   videoIds,
          part: 'statistics,snippet',
        })
      );
      const vstData = await vstRes.json();
      videoStats = vstData.items || [];
    }

    return {
      channelId,
      name:        channelInfo?.snippet?.title || channelName,
      description: channelInfo?.snippet?.description || '',
      subscribers: channelInfo?.statistics?.subscriberCount || '0',
      totalViews:  channelInfo?.statistics?.viewCount || '0',
      videoCount:  channelInfo?.statistics?.videoCount || '0',
      country:     channelInfo?.snippet?.country || 'IN',
      videos: videoStats.map(v => ({
        id:          v.id,
        title:       v.snippet?.title || '',
        description: (v.snippet?.description || '').slice(0, 300),
        publishedAt: v.snippet?.publishedAt || '',
        views:       parseInt(v.statistics?.viewCount  || 0),
        likes:       parseInt(v.statistics?.likeCount  || 0),
        comments:    parseInt(v.statistics?.commentCount || 0),
        tags:        v.snippet?.tags || [],
        thumbnail:   v.snippet?.thumbnails?.high?.url || '',
      })).sort((a, b) => b.views - a.views),
    };
  } catch (err) {
    console.warn('[web-intelligence] YouTube channel fetch failed:', err.message);
    return null;
  }
}

// Search YouTube videos for a topic
export async function fetchYouTubeVideoData(videoTitle, channelName = '') {
  if (!YT_API_KEY) return null;
  try {
    const query = channelName ? `${videoTitle} ${channelName}` : videoTitle;
    const res   = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        key:        YT_API_KEY,
        q:          query,
        type:       'video',
        part:       'snippet',
        maxResults: '5',
        order:      'viewCount',
      })
    );
    if (!res.ok) return null;
    const data = await res.json();
    const ids  = (data.items || []).map(i => i.id.videoId).join(',');
    if (!ids) return null;

    const statsRes  = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/videos?` +
      new URLSearchParams({ key: YT_API_KEY, id: ids, part: 'statistics,snippet' })
    );
    const statsData = await statsRes.json();

    return (statsData.items || []).map(v => ({
      id:          v.id,
      title:       v.snippet?.title || '',
      channelName: v.snippet?.channelTitle || '',
      description: (v.snippet?.description || '').slice(0, 400),
      publishedAt: v.snippet?.publishedAt || '',
      views:       parseInt(v.statistics?.viewCount   || 0),
      likes:       parseInt(v.statistics?.likeCount   || 0),
      comments:    parseInt(v.statistics?.commentCount || 0),
      tags:        v.snippet?.tags || [],
    }));
  } catch {
    return null;
  }
}

// Get trending videos in a niche
export async function fetchTrendingVideos(niche, platform = 'YouTube') {
  if (!YT_API_KEY) return [];
  try {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        key:                YT_API_KEY,
        q:                  niche,
        type:               'video',
        part:               'snippet',
        order:              'viewCount',
        publishedAfter:     new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults:         '15',
        relevanceLanguage:  'en',
        regionCode:         'IN',
      })
    );
    if (!res.ok) return [];
    const data = await res.json();
    const ids  = (data.items || []).map(i => i.id.videoId).join(',');
    if (!ids) return [];

    const statsRes  = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/videos?` +
      new URLSearchParams({ key: YT_API_KEY, id: ids, part: 'statistics,snippet' })
    );
    const statsData = await statsRes.json();

    return (statsData.items || [])
      .map(v => ({
        title:       v.snippet?.title || '',
        channel:     v.snippet?.channelTitle || '',
        views:       parseInt(v.statistics?.viewCount || 0),
        likes:       parseInt(v.statistics?.likeCount || 0),
        comments:    parseInt(v.statistics?.commentCount || 0),
        publishedAt: v.snippet?.publishedAt || '',
        tags:        (v.snippet?.tags || []).slice(0, 8),
        description: (v.snippet?.description || '').slice(0, 200),
      }))
      .sort((a, b) => b.views - a.views);
  } catch {
    return [];
  }
}

// ─── SerpAPI: Google Trends / News ────────────────────────────────────────────
export async function fetchNicheTrends(niche, platform) {
  const results = { googleTrends: [], news: [], relatedQueries: [] };

  // Google Trends via SerpAPI
  if (SERP_API_KEY) {
    try {
      const data = await serpSearch(`${niche} trending YouTube 2025 India`, {
        tbm: 'nws',
        num: '10',
      });
      if (data?.news_results) {
        results.news = data.news_results.slice(0, 8).map(n => ({
          title:   n.title,
          snippet: n.snippet,
          date:    n.date,
          source:  n.source,
        }));
      }
      if (data?.organic_results) {
        results.googleTrends = data.organic_results.slice(0, 6).map(r => ({
          title:   r.title,
          snippet: r.snippet,
        }));
      }
    } catch {}

    // Related searches
    try {
      const relData = await serpSearch(`${niche} content ideas YouTube India`);
      if (relData?.related_searches) {
        results.relatedQueries = relData.related_searches.slice(0, 8).map(r => r.query);
      }
    } catch {}
  }

  return results;
}

// ─── Fetch competitor web presence ───────────────────────────────────────────
export async function fetchCompetitorWebData(channelName, niche) {
  const results = { aboutPage: '', socialBio: '', recentCoverage: [] };
  if (!SERP_API_KEY) return results;

  try {
    // Search for the creator's broader web presence
    const data = await serpSearch(`"${channelName}" YouTube ${niche} creator India`);
    if (data?.organic_results) {
      results.recentCoverage = data.organic_results.slice(0, 5).map(r => ({
        title:   r.title,
        snippet: r.snippet,
        link:    r.link,
      }));
    }
    if (data?.knowledge_graph) {
      results.aboutPage = JSON.stringify(data.knowledge_graph).slice(0, 600);
    }
  } catch {}

  return results;
}

// ─── Fetch affiliate programs for niche ───────────────────────────────────────
export async function fetchAffiliateData(niche, location = 'India') {
  if (!SERP_API_KEY) return [];
  try {
    const data = await serpSearch(`best affiliate programs ${niche} ${location} 2025 commission`);
    if (!data?.organic_results) return [];
    return data.organic_results.slice(0, 6).map(r => ({
      title:   r.title,
      snippet: r.snippet,
      link:    r.link,
    }));
  } catch {
    return [];
  }
}

// ─── Fetch sponsorship/brand deals data ──────────────────────────────────────
export async function fetchSponsorshipData(niche) {
  if (!SERP_API_KEY) return [];
  try {
    const data = await serpSearch(`${niche} YouTube channel sponsorship brands India 2025`);
    if (!data?.organic_results) return [];
    return data.organic_results.slice(0, 5).map(r => ({
      title:   r.title,
      snippet: r.snippet,
    }));
  } catch {
    return [];
  }
}

// ─── Fetch CPM data for niche ─────────────────────────────────────────────────
export async function fetchCPMData(niche) {
  if (!SERP_API_KEY) return null;
  try {
    const data = await serpSearch(`${niche} YouTube CPM RPM India 2025`);
    if (!data?.organic_results) return null;
    return data.organic_results.slice(0, 4).map(r => ({
      title:   r.title,
      snippet: r.snippet,
    }));
  } catch {
    return null;
  }
}

// ─── Viral video analysis ──────────────────────────────────────────────────────
export async function fetchViralVideoContext(videoTitle, channelName, niche) {
  const context = { videoData: null, niche_performance: [], related_content: [] };

  // Find the video on YouTube
  const ytData = await fetchYouTubeVideoData(videoTitle, channelName);
  if (ytData?.length > 0) context.videoData = ytData[0];

  // Get niche comparison data
  if (YT_API_KEY) {
    const nicheVideos = await fetchTrendingVideos(niche);
    context.niche_performance = nicheVideos.slice(0, 8);
  }

  return context;
}

// ─── Build real data block for prompt injection ───────────────────────────────
export function buildRealDataBlock(label, data) {
  if (!data) return '';
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return `
═══ REAL-TIME DATA: ${label.toUpperCase()} ═══
${str.slice(0, 4000)}
═══ END REAL-TIME DATA ═══
`.trim();
}

// ─── Format YouTube channel for prompt ───────────────────────────────────────
export function formatChannelDataForPrompt(channelData) {
  if (!channelData) return '';

  const topVideos = channelData.videos.slice(0, 10);
  const avgViews  = topVideos.length > 0
    ? Math.round(topVideos.reduce((s, v) => s + v.views, 0) / topVideos.length)
    : 0;

  const titlePatterns = topVideos.map(v => v.title);
  const allTags       = [...new Set(topVideos.flatMap(v => v.tags))].slice(0, 20);

  return `
CHANNEL: ${channelData.name}
SUBSCRIBERS: ${parseInt(channelData.subscribers || 0).toLocaleString('en-IN')}
TOTAL VIEWS: ${parseInt(channelData.totalViews || 0).toLocaleString('en-IN')}
TOTAL VIDEOS: ${channelData.videoCount}
COUNTRY: ${channelData.country}

TOP 10 VIDEOS BY VIEWS:
${topVideos.map((v, i) =>
  `${i + 1}. "${v.title}"
   Views: ${v.views.toLocaleString('en-IN')} | Likes: ${v.likes.toLocaleString('en-IN')} | Comments: ${v.comments.toLocaleString('en-IN')}
   Published: ${v.publishedAt?.slice(0, 10) || 'N/A'}`
).join('\n\n')}

AVERAGE VIEWS (top 10): ${avgViews.toLocaleString('en-IN')}

COMMONLY USED TAGS: ${allTags.join(', ') || 'Not available'}

CHANNEL DESCRIPTION EXCERPT:
${channelData.description?.slice(0, 400) || 'Not available'}
`.trim();
}

// ─── Format trending videos for prompt ────────────────────────────────────────
export function formatTrendingDataForPrompt(videos) {
  if (!videos?.length) return '';
  return `
TRENDING VIDEOS IN THIS NICHE (last 7 days, sorted by views):
${videos.slice(0, 10).map((v, i) =>
  `${i + 1}. "${v.title}" by ${v.channel}
   Views: ${v.views.toLocaleString('en-IN')} | Published: ${v.publishedAt?.slice(0, 10) || 'N/A'}
   Tags: ${(v.tags || []).join(', ') || 'none'}`
).join('\n\n')}
`.trim();
}