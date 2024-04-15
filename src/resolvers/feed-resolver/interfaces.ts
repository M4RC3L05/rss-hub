export type FeedResolver = {
  resolveFeed: (
    data: Record<string, unknown>,
  ) => Record<string, unknown> | undefined;
  resolveFeedTitle: (data: Record<string, unknown>) => string | undefined;
  resolveFeedItems: (
    data: Record<string, unknown>,
  ) => Record<string, unknown>[];

  resolveFeedItemGuid: (
    feedItem: Record<string, unknown>,
  ) => string | undefined;
  resolveFeedItemLink: (
    feedItem: Record<string, unknown>,
  ) => string | undefined;
  resolveFeedItemTitle: (
    feedItem: Record<string, unknown>,
  ) => string | undefined;
  resolveFeedItemEnclosures: (
    feedItem: Record<string, unknown>,
  ) => { url: string; type?: string }[];
  resolveFeedItemImage: (
    feedItem: Record<string, unknown>,
  ) => string | undefined;
  resolveFeedItemContent: (
    feedItem: Record<string, unknown>,
  ) => string | undefined;
  resolveFeedItemPubDate: (
    feedItem: Record<string, unknown>,
  ) => Date | undefined;
  resolveUpdatedAt: (feedItem: Record<string, unknown>) => Date | undefined;
};
