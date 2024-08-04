import { BaseService } from "#src/apps/web/services/common/mod.ts";

class FeedItemsService extends BaseService {
  getFeedItems({
    feedId,
    filters,
    pagination,
    signal,
  }: {
    feedId?: string;
    filters?: { bookmarked?: boolean; unread?: boolean };
    pagination?: { limit?: number; page?: number };
    signal: AbortSignal;
  }) {
    const query: Record<string, string> = {};

    if (feedId) query.feedId = feedId;
    if (filters?.bookmarked) query.bookmarked = "true";
    if (filters?.unread) query.unread = "true";

    if (pagination?.limit) query.limit = String(pagination.limit);
    if (pagination?.page) query.page = String(pagination.page);

    return this.request({
      path: `/api/feed-items?${new URLSearchParams(query).toString()}`,
      init: { signal },
    });
  }

  getFeedItemById(
    { feedId, id, signal }: { feedId: string; id: string; signal: AbortSignal },
  ) {
    return this.request({
      path: `/api/feed-items/${encodeURIComponent(id)}/${feedId}`,
      init: { signal },
    });
  }

  feedItemReadability(
    { feedId, id, signal }: { feedId: string; id: string; signal: AbortSignal },
  ) {
    return this.request({
      path: `/api/feed-items/${
        encodeURIComponent(id)
      }/${feedId}/extract-content`,
      init: { signal },
    });
  }

  markFeedItemAsReaded(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/feed-items/read",
      init: {
        body: JSON.stringify(data),
        method: "PATCH",
        signal,
        headers: { "content-type": "application/json" },
      },
    });
  }

  markFeedItemAsUnreaded(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/feed-items/unread",
      init: {
        body: JSON.stringify(data),
        method: "PATCH",
        signal,
        headers: { "content-type": "application/json" },
      },
    });
  }

  markFeedItemAsBookmarked(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/feed-items/bookmark",
      init: {
        body: JSON.stringify(data),
        method: "PATCH",
        signal,
        headers: { "content-type": "application/json" },
      },
    });
  }

  markFeedItemAsUnbookmarked(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/feed-items/unbookmark",
      init: {
        body: JSON.stringify(data),
        method: "PATCH",
        signal,
        headers: { "content-type": "application/json" },
      },
    });
  }
}

export default FeedItemsService;
