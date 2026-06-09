import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsMonitoringAgent, NormalizedNewsItem } from './news-monitoring.agent';

@Injectable()
export class ContentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContentService.name);
  private newsMonitorTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly newsMonitoringAgent: NewsMonitoringAgent,
  ) {}

  onModuleInit() {
    const intervalHours = Number(process.env.NEWS_MONITOR_INTERVAL_HOURS || 24);
    const enabled = process.env.NEWS_MONITOR_ENABLED !== 'false';

    if (!enabled || !Number.isFinite(intervalHours) || intervalHours <= 0) {
      this.logger.log('Scheduled news monitoring is disabled.');
      return;
    }

    this.newsMonitorTimer = setInterval(
      () => void this.runScheduledNewsCheck(),
      intervalHours * 60 * 60 * 1000,
    );
    this.newsMonitorTimer.unref?.();
    this.logger.log(`Scheduled news monitoring enabled every ${intervalHours} hour(s).`);
  }

  onModuleDestroy() {
    if (this.newsMonitorTimer) clearInterval(this.newsMonitorTimer);
  }

  listTrainings() {
    return this.prisma.training.findMany({ orderBy: { publishDate: 'desc' } });
  }

  listNews() {
    return this.prisma.newsItem.findMany({
      orderBy: [
        { recommended: 'desc' },
        { relevanceScore: 'desc' },
        { publishedDate: 'desc' },
      ],
    });
  }

  async checkLatestNews() {
    const checkedAt = new Date();
    const fetched = await this.newsMonitoringAgent.fetchLatestUpdates();
    const existing = await this.prisma.newsItem.findMany({
      select: { id: true, url: true, title: true, titleFingerprint: true },
    });

    let saved = 0;
    let duplicates = 0;

    for (const item of fetched.items) {
      const duplicate = this.findDuplicate(item, existing);
      if (duplicate) {
        duplicates += 1;
        await this.prisma.newsItem.update({
          where: { id: duplicate.id },
          data: { lastSeenAt: checkedAt },
        });
        continue;
      }

      try {
        const created = await this.prisma.newsItem.create({
          data: {
            title: item.title,
            source: item.source,
            url: item.url,
            publishedDate: item.publishedDate,
            summary: item.summary,
            category: item.category,
            relevanceScore: item.relevanceScore,
            reasonRecommended: item.reasonRecommended,
            recommended: item.recommended,
            titleFingerprint: item.titleFingerprint,
            lastSeenAt: checkedAt,
          },
          select: { id: true, url: true, title: true, titleFingerprint: true },
        });
        existing.push(created);
        saved += 1;
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          duplicates += 1;
          continue;
        }
        throw error;
      }
    }

    return {
      checkedAt,
      fetched: fetched.items.length,
      saved,
      duplicates,
      sources: fetched.sources,
      items: await this.listNews(),
    };
  }

  private async runScheduledNewsCheck() {
    try {
      const result = await this.checkLatestNews();
      this.logger.log(`Scheduled news monitoring saved ${result.saved} new item(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Scheduled news monitoring failed: ${message}`);
    }
  }

  private findDuplicate(
    item: NormalizedNewsItem,
    existing: Array<{ id: string; url: string; title: string; titleFingerprint: string }>,
  ) {
    const itemUrl = this.normalizeUrl(item.url);
    for (const existingItem of existing) {
      if (this.normalizeUrl(existingItem.url) === itemUrl) return existingItem;
      if (existingItem.titleFingerprint === item.titleFingerprint) return existingItem;
      if (this.titleSimilarity(existingItem.title, item.title) >= 0.88) return existingItem;
    }
    return null;
  }

  private normalizeUrl(value: string) {
    try {
      const url = new URL(value);
      url.hash = '';
      return url.toString().replace(/\/$/, '').toLowerCase();
    } catch {
      return value.trim().replace(/\/$/, '').toLowerCase();
    }
  }

  private titleSimilarity(left: string, right: string) {
    const leftTokens = this.titleTokens(left);
    const rightTokens = this.titleTokens(right);
    if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

    const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
    const union = new Set([...leftTokens, ...rightTokens]).size;
    return intersection / union;
  }

  private titleTokens(value: string) {
    return new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2),
    );
  }

  private isUniqueConstraintError(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
  }
}
