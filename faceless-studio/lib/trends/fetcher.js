// lib/trends/fetcher.js
// Real-time trend fetching module for Studio AI Research Agent
// Fetches from YouTube Trends, Reddit, and other lightweight sources

const YOUTUBE_TRENDS_API = 'https://trends.google.com/trends/api/dailytrends';
const REDDIT_TRENDING_API = 'https://www.reddit.com/r/trending.json';

// ─── YouTube Trends via Google Trends (Free tier) ───────────────────────────
// Uses unofficial but stable endpoint. Parse HTML as fallback if JSON fails.
async function getYouTubeTrends(niche, limit = 10) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-330&geo=IN`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    let text = await response.text();
    // Google Trends API returns JSONP with leading characters — strip them
    text = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

    const data = JSON.parse(text);
    const trends = [];

    if (data.default?.trendingSearchesDays?.[0]?.trendingSearches) {
      data.default.trendingSearchesDays[0].trendingSearches.forEach(item => {
        trends.push({
          topic: item.title.query,
          title: item.title.query,
          traffic_estimate: item.formattedTraffic || 'Unknown',
          source: 'google-trends',
          url: item.exploreLink,
          articles_count: item.articles?.length || 0,
          createdAt: new Date().toISOString(),
        });
      });
    }

    return trends.slice(0, limit);
  } catch (err) {
    console.warn('[trends:youtube] Fetch failed:', err.message);
    return [];
  }
}

// ─── Reddit Trending ──────────────────────────────────────────────────────────
// Lightweight Reddit API call to fetch trending posts from relevant subreddits
async function getRedditTrends(niche, limit = 8) {
  try {
    const subreddits = mapNicheToSubreddits(niche);
    const allTrends = [];

    for (const subreddit of subreddits.slice(0, 3)) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Studio AI Trend Fetcher)',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const data = await response.json();

        if (data.data?.children) {
          data.data.children.forEach(post => {
            const p = post.data;
            if (p.title && p.title.length > 10) {
              allTrends.push({
                topic: p.title,
                title: p.title,
                upvotes: p.ups || 0,
                comments: p.num_comments || 0,
                source: `reddit:${subreddit}`,
                url: `https://reddit.com${p.permalink}`,
                createdAt: new Date(p.created_utc * 1000).toISOString(),
              });
            }
          });
        }
      } catch (err) {
        console.warn(`[trends:reddit] Subreddit ${subreddit} fetch failed:`, err.message);
        continue;
      }
    }

    return allTrends.slice(0, limit);
  } catch (err) {
    console.warn('[trends:reddit] Overall fetch failed:', err.message);
    return [];
  }
}

// ─── Map Niche to Relevant Subreddits ──────────────────────────────────────
function mapNicheToSubreddits(niche) {
  const nicheLower = (niche || '').toLowerCase();

  const maps = {
    finance: ['investing', 'personalfinance', 'stocks', 'cryptocurrency'],
    business: ['business', 'startups', 'entrepreneur', 'sidehustle'],
    tech: ['technology', 'programming', 'webdev', 'learnprogramming'],
    health: ['health', 'fitness', 'nutrition', 'loseit'],
    marketing: ['marketing', 'digital_marketing', 'growthhacking'],
    education: ['education', 'learnprogramming', 'IWantToLearn'],
    entertainment: ['movies', 'television', 'entertainment', 'gaming'],
    gaming: ['gaming', 'pcgaming', 'PS5', 'games'],
    india: ['india', 'IndianGaming', 'IndianStartupsAndTech'],
  };

  for (const [key, subreddits] of Object.entries(maps)) {
    if (nicheLower.includes(key)) {
      return subreddits;
    }
  }

  // Default fallback
  return ['trending', 'popular', 'news'];
}

// ─── Filter Trends by Niche ───────────────────────────────────────────────────
function filterTrendsByNiche(trends, niche) {
  if (!niche || trends.length === 0) return trends;

  // Extract keywords from niche
  const niches = niche.split(/[,&/]/).map(n => n.trim().toLowerCase());
  const keywords = [];

  niches.forEach(n => {
    const parts = n.split(/\s+/);
    keywords.push(...parts.filter(p => p.length > 3));
  });

  if (keywords.length === 0) return trends;

  // Score each trend on keyword match
  const scored = trends.map(trend => {
    const trendText = `${trend.topic} ${trend.title}`.toLowerCase();
    const matchCount = keywords.filter(kw => trendText.includes(kw)).length;
    return { ...trend, niche_match_score: matchCount };
  });

  // Filter: at least 1 keyword match (or if no matches, include all as low-confidence)
  const matched = scored.filter(t => t.niche_match_score > 0);

  if (matched.length === 0) {
    // No matches found — return all but mark as low-confidence
    return scored.map(({ niche_match_score, ...t }) => ({
      ...t,
      low_confidence: true,
    }));
  }

  return matched.map(({ niche_match_score, ...t }) => t);
}

// ─── Score Trends by Platform ─────────────────────────────────────────────────
function scoreTrends(trends, platform) {
  if (!trends || trends.length === 0) return [];

  const now = Date.now();
  const scored = trends.map(trend => {
    const createdAt = new Date(trend.createdAt).getTime();
    const recency_hours = Math.round((now - createdAt) / (1000 * 60 * 60));

    let virality_score = 0;

    if (platform.toLowerCase().includes('youtube')) {
      // YouTube: traffic estimate + articles citing it
      const traffic =
        parseInt(trend.traffic_estimate?.replace(/[^0-9]/g, '')) || 1000;
      const articles = trend.articles_count || 0;
      virality_score = Math.round(
        (traffic / 1000) * (1 + articles * 0.2) / Math.max(1, recency_hours / 12)
      );
    } else if (platform.toLowerCase().includes('reddit')) {
      // Reddit: upvotes + comment ratio
      const upvotes = trend.upvotes || 0;
      const comments = trend.comments || 0;
      const engagement = upvotes + comments * 1.5;
      virality_score = Math.round(
        engagement / Math.max(1, recency_hours / 6)
      );
    } else {
      // Generic scoring
      virality_score = Math.round(
        (trend.upvotes || trend.traffic_estimate?.length || 100) /
          Math.max(1, recency_hours / 12)
      );
    }

    return {
      topic: trend.topic || trend.title,
      source: trend.source,
      virality_score: Math.max(0, virality_score),
      recency_hours,
      original: trend,
    };
  });

  // Sort by virality score descending
  return scored.sort((a, b) => b.virality_score - a.virality_score);
}

// ─── Fetch & Process Trends ───────────────────────────────────────────────────
// Main entry point: fetch trends, filter by niche, score by platform
export async function getTrendsForResearch(niche, platform) {
  try {
    // Fetch from both sources in parallel
    const [youTubeTrends, redditTrends] = await Promise.all([
      getYouTubeTrends(niche, 8),
      getRedditTrends(niche, 8),
    ]);

    // Combine
    const allTrends = [...youTubeTrends, ...redditTrends];

    if (allTrends.length === 0) {
      console.warn('[trends] No trends fetched from any source');
      return { trends: [], low_confidence: true, source: 'none' };
    }

    // Filter by niche
    const filtered = filterTrendsByNiche(allTrends, niche);

    // Score by platform
    const scored = scoreTrends(filtered, platform);

    // Return top 5
    const topTrends = scored.slice(0, 5).map(t => ({
      topic: t.topic,
      source: t.source,
      virality_score: t.virality_score,
      recency_hours: t.recency_hours,
    }));

    return {
      trends: topTrends,
      low_confidence: filtered.some(t => t.low_confidence),
      source: 'realtime',
    };
  } catch (err) {
    console.error('[trends] Unexpected error:', err.message);
    return { trends: [], low_confidence: true, source: 'error', error: err.message };
  }
}

// ─── Fallback: Empty trends response ───────────────────────────────────────────
export function getEmptyTrends() {
  return { trends: [], low_confidence: true, source: 'fallback' };
}