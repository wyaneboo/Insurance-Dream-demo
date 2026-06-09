import { Injectable, Logger } from '@nestjs/common';

export const NEWS_CATEGORIES = [
  'Compliance Alert',
  'Product Update',
  'Medical / Healthcare',
  'Tax Planning',
  'Retirement Planning',
  'Economic Insight',
  'Investment / Market',
  'Recruitment / Agency Building',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface NormalizedNewsItem {
  title: string;
  source: string;
  url: string;
  publishedDate: Date;
  summary: string;
  category: NewsCategory;
  relevanceScore: number;
  reasonRecommended: string;
  recommended: boolean;
  titleFingerprint: string;
}

export interface NewsSourceResult {
  source: string;
  checkedUrl: string;
  fetched: number;
  error?: string;
}

interface SourceConfig {
  source: string;
  url: () => string;
  hrefIncludes: string[];
  defaultCategory: NewsCategory;
  baseScore: number;
  maxItems?: number;
  kind?: 'html' | 'dataGovArc' | 'rss';
}

interface AnchorCandidate {
  title: string;
  href: string;
  context: string;
}

interface RelevanceHit {
  term: string;
  score: number;
  reason: string;
}

interface DataGovArcRow {
  title_en?: string;
  publication_id?: string;
  release_date?: string;
  publication_type_en?: string;
  frequency?: string;
}

const FETCH_TIMEOUT_MS = 15000;
const RECOMMENDATION_THRESHOLD = 50;

const currentYear = () => new Date().getFullYear();

const SOURCES: SourceConfig[] = [
  {
    source: 'Bank Negara Malaysia',
    url: () => 'https://www.bnm.gov.my/',
    hrefIncludes: ['/-/', '/documents/'],
    defaultCategory: 'Compliance Alert',
    baseScore: 38,
    maxItems: 12,
  },
  {
    source: 'Life Insurance Association of Malaysia',
    url: () => 'https://www.liam.org.my/news/press_statement.aspx?ct=3',
    hrefIncludes: ['/news/press_details.aspx'],
    defaultCategory: 'Compliance Alert',
    baseScore: 48,
    maxItems: 12,
  },
  {
    source: 'Great Eastern Malaysia',
    url: () => 'https://www.greateasternlife.com/my/en/about-us/media-centre/media-releases.html',
    hrefIncludes: ['/my/en/about-us/media-centre/media-releases/', '/content/dam/'],
    defaultCategory: 'Product Update',
    baseScore: 45,
    maxItems: 12,
  },
  {
    source: 'Ministry of Health Malaysia',
    url: () => `https://www.moh.gov.my/en/media-kkm/media-statement/${currentYear()}`,
    hrefIncludes: ['/media-kkm/media-statement/'],
    defaultCategory: 'Medical / Healthcare',
    baseScore: 25,
    maxItems: 12,
  },
  {
    source: 'LHDN',
    url: () => 'https://www.hasil.gov.my/kenyataan-media/',
    hrefIncludes: ['/kenyataan-media-detail/'],
    defaultCategory: 'Tax Planning',
    baseScore: 34,
    maxItems: 12,
  },
  {
    source: 'EPF/KWSP',
    url: () => 'https://www.kwsp.gov.my/en/corporate/news-highlights/highlights',
    hrefIncludes: ['/en/w/news/'],
    defaultCategory: 'Retirement Planning',
    baseScore: 36,
    maxItems: 12,
  },
  {
    source: 'DOSM',
    url: () => 'https://api.data.gov.my/data-catalogue?id=arc_dosm',
    hrefIncludes: [],
    defaultCategory: 'Economic Insight',
    baseScore: 40,
    maxItems: 12,
    kind: 'dataGovArc',
  },
  {
    source: 'Securities Commission Malaysia',
    url: () => 'https://www.sc.com.my/resources/media',
    hrefIncludes: ['/resources/media/media-release/'],
    defaultCategory: 'Investment / Market',
    baseScore: 32,
    maxItems: 12,
  },
  {
    source: 'Bursa Malaysia',
    url: () => 'https://bursa.listedcompany.com/newsroom_rss.html',
    hrefIncludes: [],
    defaultCategory: 'Investment / Market',
    baseScore: 28,
    maxItems: 12,
    kind: 'rss',
  },
];

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  'Compliance Alert': [
    'regulation',
    'guideline',
    'compliance',
    'enforcement',
    'penalty',
    'scam',
    'aml',
    'cft',
    'policy document',
    'requirements',
    'pematuhan',
    'penguatkuasaan',
  ],
  'Product Update': [
    'product',
    'plan',
    'launch',
    'premium',
    'coverage',
    'benefit',
    'rider',
    'protection',
    'protected',
    'programme',
    'medical card',
    'legacy',
    'income',
  ],
  'Medical / Healthcare': [
    'medical',
    'health',
    'healthcare',
    'hospital',
    'claims',
    'private healthcare',
    'mhit',
    'base mhit',
    'health insurance',
    'dengue',
    'disease',
    'kesihatan',
    'perubatan',
  ],
  'Tax Planning': [
    'tax',
    'lhdn',
    'hasil',
    'e-invoice',
    'e-filing',
    'relief',
    'deduction',
    'stamp duty',
    'cukai',
    'duti setem',
  ],
  'Retirement Planning': [
    'epf',
    'kwsp',
    'retirement',
    'dividend',
    'savings',
    'i-legasi',
    'i-emas',
    'akaun',
    'pension',
  ],
  'Economic Insight': [
    'gdp',
    'inflation',
    'labour',
    'employment',
    'income',
    'statistics',
    'economy',
    'economic',
    'trade',
    'producer price',
    'population',
  ],
  'Investment / Market': [
    'capital market',
    'investment',
    'investor',
    'market',
    'securities',
    'bursa',
    'sukuk',
    'fund',
    'equity',
    'digital asset',
    'ipo',
  ],
  'Recruitment / Agency Building': [
    'agent',
    'agency',
    'life planner',
    'career',
    'training',
    'recruitment',
    'advisor',
    'adviser',
  ],
};

const RELEVANCE_KEYWORDS: RelevanceHit[] = [
  { term: 'insurance', score: 20, reason: 'insurance industry impact' },
  { term: 'takaful', score: 18, reason: 'insurance and takaful industry impact' },
  { term: 'life insurance', score: 22, reason: 'life insurance planning impact' },
  { term: 'agent', score: 14, reason: 'agent practice impact' },
  { term: 'agency', score: 12, reason: 'agency development impact' },
  { term: 'policy', score: 10, reason: 'policyholder advisory impact' },
  { term: 'premium', score: 16, reason: 'premium and affordability impact' },
  { term: 'claims', score: 16, reason: 'claims advisory impact' },
  { term: 'medical', score: 16, reason: 'medical insurance advisory impact' },
  { term: 'healthcare', score: 16, reason: 'healthcare cost advisory impact' },
  { term: 'hospital', score: 12, reason: 'medical claims context' },
  { term: 'mhit', score: 22, reason: 'medical and health insurance/takaful relevance' },
  { term: 'retirement', score: 18, reason: 'retirement planning relevance' },
  { term: 'epf', score: 15, reason: 'retirement savings relevance' },
  { term: 'kwsp', score: 15, reason: 'retirement savings relevance' },
  { term: 'tax', score: 16, reason: 'tax planning relevance' },
  { term: 'e-invoice', score: 14, reason: 'business tax compliance relevance' },
  { term: 'relief', score: 10, reason: 'tax relief planning relevance' },
  { term: 'investment', score: 13, reason: 'investment-linked planning relevance' },
  { term: 'capital market', score: 13, reason: 'market advisory relevance' },
  { term: 'bursa', score: 11, reason: 'market movement relevance' },
  { term: 'economic', score: 10, reason: 'client planning context' },
  { term: 'gdp', score: 10, reason: 'macro planning context' },
  { term: 'compliance', score: 16, reason: 'compliance action relevance' },
  { term: 'guideline', score: 14, reason: 'regulatory guidance relevance' },
  { term: 'scam', score: 14, reason: 'client protection relevance' },
  { term: 'enforcement', score: 12, reason: 'regulatory risk relevance' },
  { term: 'perubatan', score: 15, reason: 'medical insurance advisory impact' },
  { term: 'kesihatan', score: 12, reason: 'health advisory context' },
  { term: 'cukai', score: 15, reason: 'tax planning relevance' },
  { term: 'pematuhan', score: 13, reason: 'compliance relevance' },
];

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  januari: 0,
  feb: 1,
  february: 1,
  februari: 1,
  mar: 2,
  march: 2,
  mac: 2,
  apr: 3,
  april: 3,
  may: 4,
  mei: 4,
  jun: 5,
  june: 5,
  junei: 5,
  jul: 6,
  july: 6,
  julai: 6,
  aug: 7,
  august: 7,
  ogos: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oct: 9,
  october: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  dis: 11,
  dec: 11,
  december: 11,
  disember: 11,
};

@Injectable()
export class NewsMonitoringAgent {
  private readonly logger = new Logger(NewsMonitoringAgent.name);

  async fetchLatestUpdates(): Promise<{ items: NormalizedNewsItem[]; sources: NewsSourceResult[] }> {
    const sourceResults = await Promise.all(SOURCES.map((source) => this.fetchSource(source)));
    const seen = new Set<string>();
    const items: NormalizedNewsItem[] = [];

    for (const result of sourceResults) {
      for (const item of result.items) {
        const key = `${item.source}:${item.titleFingerprint}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(item);
      }
    }

    return {
      items: items
        .filter((item) => item.recommended)
        .sort((a, b) => b.relevanceScore - a.relevanceScore || b.publishedDate.getTime() - a.publishedDate.getTime()),
      sources: sourceResults.map(({ source, checkedUrl, items: sourceItems, error }) => ({
        source,
        checkedUrl,
        fetched: sourceItems.length,
        error,
      })),
    };
  }

  private async fetchSource(
    config: SourceConfig,
  ): Promise<NewsSourceResult & { items: NormalizedNewsItem[] }> {
    const checkedUrl = config.url();
    try {
      if (config.kind === 'dataGovArc') {
        return await this.fetchDataGovArcSource(config, checkedUrl);
      }
      if (config.kind === 'rss') {
        return await this.fetchRssSource(config, checkedUrl);
      }

      const response = await fetch(checkedUrl, {
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-MY,en;q=0.9,ms;q=0.8',
          'user-agent':
            'DreamAgencyNewsMonitor/1.0 (+https://localhost; insurance agent news monitoring)',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const anchors = this.extractAnchors(html, checkedUrl);
      const items: NormalizedNewsItem[] = [];
      const seenUrls = new Set<string>();

      for (const anchor of anchors) {
        if (items.length >= (config.maxItems || 10)) break;
        if (!this.shouldUseAnchor(anchor, config)) continue;
        if (seenUrls.has(anchor.href)) continue;

        const item = this.normalizeCandidate(anchor, config);
        if (!item) continue;

        seenUrls.add(anchor.href);
        items.push(item);
      }

      return { source: config.source, checkedUrl, fetched: items.length, items };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to fetch ${config.source}: ${message}`);
      return { source: config.source, checkedUrl, fetched: 0, items: [], error: message };
    }
  }

  private async fetchDataGovArcSource(
    config: SourceConfig,
    checkedUrl: string,
  ): Promise<NewsSourceResult & { items: NormalizedNewsItem[] }> {
    const response = await fetch(checkedUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'DreamAgencyNewsMonitor/1.0 (+https://localhost; insurance agent news monitoring)',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rows = (await response.json()) as DataGovArcRow[];
    const now = Date.now();
    const items: NormalizedNewsItem[] = [];

    for (const row of rows
      .filter((item) => item.title_en && item.release_date && new Date(item.release_date).getTime() <= now)
      .sort((left, right) => new Date(right.release_date || '').getTime() - new Date(left.release_date || '').getTime())) {
      if (items.length >= (config.maxItems || 10)) break;

      const title = this.cleanTitle(row.title_en || '');
      const publicationId = row.publication_id || this.titleFingerprint(title);
      const context = `${title} ${row.publication_type_en || ''} ${row.frequency || ''} ${row.release_date || ''}`;
      const item = this.normalizeCandidate(
        {
          title,
          href: `https://open.dosm.gov.my/publications/${encodeURIComponent(publicationId)}`,
          context,
        },
        config,
      );

      if (item) items.push(item);
    }

    return { source: config.source, checkedUrl, fetched: items.length, items };
  }

  private async fetchRssSource(
    config: SourceConfig,
    checkedUrl: string,
  ): Promise<NewsSourceResult & { items: NormalizedNewsItem[] }> {
    const response = await fetch(checkedUrl, {
      headers: {
        accept: 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'DreamAgencyNewsMonitor/1.0 (+https://localhost; insurance agent news monitoring)',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const items: NormalizedNewsItem[] = [];
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && items.length < (config.maxItems || 10)) {
      const block = match[1];
      const title = this.cleanTitle(this.extractXmlTag(block, 'title'));
      const link = this.extractXmlTag(block, 'link');
      const published = this.extractXmlTag(block, 'pubDate');
      const description = this.cleanText(this.stripHtml(this.extractXmlTag(block, 'description')));
      if (!title || !link) continue;

      const item = this.normalizeCandidate(
        {
          title,
          href: this.decodeEntities(link),
          context: `${title} ${description} ${published}`,
        },
        config,
      );

      if (item) items.push(item);
    }

    return { source: config.source, checkedUrl, fetched: items.length, items };
  }

  private extractAnchors(html: string, baseUrl: string): AnchorCandidate[] {
    const anchors: AnchorCandidate[] = [];
    const anchorRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(html)) !== null) {
      const rawHref = this.decodeEntities(match[2] || '').trim();
      const rawTitle = match[3] || '';
      const title = this.cleanTitle(this.stripHtml(rawTitle));
      if (!rawHref || !title) continue;

      try {
        const href = new URL(rawHref, baseUrl).toString();
        const contextStart = Math.max(0, match.index - 500);
        const contextEnd = Math.min(html.length, match.index + match[0].length + 500);
        const context = this.cleanText(this.stripHtml(html.slice(contextStart, contextEnd)));
        anchors.push({ title, href, context });
      } catch {
        continue;
      }
    }

    return anchors;
  }

  private shouldUseAnchor(anchor: AnchorCandidate, config: SourceConfig) {
    if (this.isIgnoredTitle(anchor.title)) return false;
    const href = anchor.href.toLowerCase();
    if (!config.hrefIncludes.some((fragment) => href.includes(fragment.toLowerCase()))) return false;
    if (anchor.title.length < 12) return false;
    return true;
  }

  private normalizeCandidate(anchor: AnchorCandidate, config: SourceConfig): NormalizedNewsItem | null {
    const title = this.cleanTitle(anchor.title);
    const text = this.cleanText(`${title} ${anchor.context}`);
    const publishedDate = this.parseDate(text) || new Date();
    const category = this.categorize(text, config.defaultCategory);
    const scoring = this.scoreRelevance(text, config.baseScore);
    const relevanceScore = Math.min(100, scoring.score);
    const recommended = relevanceScore >= RECOMMENDATION_THRESHOLD;
    const summary = this.buildSummary(title, anchor.context, config.source, category);

    if (!title || this.isIgnoredTitle(title)) return null;

    return {
      title,
      source: config.source,
      url: anchor.href,
      publishedDate,
      summary,
      category,
      relevanceScore,
      reasonRecommended: this.buildReason(category, config.source, scoring.reasons),
      recommended,
      titleFingerprint: this.titleFingerprint(title),
    };
  }

  private categorize(text: string, fallback: NewsCategory): NewsCategory {
    const lower = text.toLowerCase();
    const scores = new Map<NewsCategory, number>();

    for (const category of NEWS_CATEGORIES) {
      scores.set(category, category === fallback ? 2 : 0);
      for (const keyword of CATEGORY_KEYWORDS[category]) {
        if (lower.includes(keyword)) {
          scores.set(category, (scores.get(category) || 0) + keyword.length);
        }
      }
    }

    return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  private scoreRelevance(text: string, baseScore: number) {
    const lower = text.toLowerCase();
    const reasons = new Set<string>();
    let score = baseScore;

    for (const keyword of RELEVANCE_KEYWORDS) {
      if (!lower.includes(keyword.term)) continue;
      score += keyword.score;
      reasons.add(keyword.reason);
    }

    return { score, reasons: [...reasons].slice(0, 3) };
  }

  private buildSummary(title: string, _context: string, source: string, category: NewsCategory) {
    const label = category.endsWith('Update') ? category.toLowerCase() : `${category.toLowerCase()} update`;
    return this.truncate(`${source} published this ${label}: ${title}.`, 260);
  }

  private buildReason(category: NewsCategory, source: string, reasons: string[]) {
    const reasonText = reasons.length > 0 ? reasons.join(', ') : `${category.toLowerCase()} relevance`;
    return `Recommended from ${source} because it has ${reasonText} for Malaysian insurance agents.`;
  }

  private parseDate(text: string): Date | null {
    const compact = this.cleanText(text);

    const dayMonthYear = compact.match(
      /\b(\d{1,2})[\s-]+([A-Za-z]+)[\s,-]+(\d{4})\b/,
    );
    if (dayMonthYear) {
      const month = MONTHS[dayMonthYear[2].toLowerCase()];
      if (month !== undefined) {
        return new Date(Number(dayMonthYear[3]), month, Number(dayMonthYear[1]));
      }
    }

    const yearMonthDay = compact.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
    if (yearMonthDay) {
      return new Date(Number(yearMonthDay[1]), Number(yearMonthDay[2]) - 1, Number(yearMonthDay[3]));
    }

    const numericDayMonthYear = compact.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
    if (numericDayMonthYear) {
      return new Date(
        Number(numericDayMonthYear[3]),
        Number(numericDayMonthYear[2]) - 1,
        Number(numericDayMonthYear[1]),
      );
    }

    return null;
  }

  private cleanTitle(value: string) {
    return this.cleanText(value)
      .replace(/^\d{1,2}\s+[A-Za-z]+\s+\d{4}\s*/i, '')
      .replace(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}\s*/i, '')
      .replace(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}\s*/i, '')
      .replace(/\s+\|\s+.*$/, '')
      .trim();
  }

  private cleanText(value: string) {
    return this.decodeEntities(value).replace(/\s+/g, ' ').trim();
  }

  private stripHtml(value: string) {
    return value
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  }

  private extractXmlTag(block: string, tag: string) {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (!match) return '';
    return this.decodeEntities(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim();
  }

  private decodeEntities(value: string) {
    return value
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&rsquo;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&ldquo;/gi, '"')
      .replace(/&rdquo;/gi, '"')
      .replace(/&ndash;/gi, '-')
      .replace(/&mdash;/gi, '-')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
  }

  private isIgnoredTitle(title: string) {
    const lower = title.toLowerCase();
    if (
      [
        'home',
        'more',
        'view more',
        'read more',
        'media centre',
        'news & highlights',
        'contact us',
        'terms and conditions',
        'privacy policy',
        'sitemap',
      ].includes(lower)
    ) {
      return true;
    }

    return lower.startsWith('image') || lower.includes('skip to') || lower.length > 260;
  }

  private isMostlyNavigation(text: string) {
    const lower = text.toLowerCase();
    const navHits = ['menu', 'search', 'contact us', 'privacy', 'copyright', 'login'].filter((term) =>
      lower.includes(term),
    ).length;
    return navHits >= 3;
  }

  private truncate(value: string, maxLength: number) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1).trim()}...`;
  }

  private titleFingerprint(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .sort()
      .join(' ');
  }
}
