import type { FeedItemsTable } from "#src/database/types/mod.js";
import { serviceRequester } from "../common/mod.js";

class FeedItemsService {
  getFeedItems({
    feedId,
    filters,
    pagination,
  }: {
    feedId: string;
    filters?: { bookmarked?: boolean; unread?: boolean };
    pagination?: { limit?: number; page?: number };
  }) {
    return serviceRequester<FeedItemsTable[]>(
      `/api/feed-items?feedId=${feedId}${
        filters?.unread ? "&unread=true" : ""
      }${filters?.bookmarked ? "&bookmarked=true" : ""}${
        pagination?.page ? `&page=${pagination.page}` : ""
      }${pagination?.limit ? `&limit=${pagination.limit}` : ""}`,
    );
  }

  getFeedItemById({ feedId, id }: { feedId: string; id: string }) {
    return serviceRequester<FeedItemsTable>(
      `/api/feed-items/${encodeURIComponent(id)}/${feedId}`,
    );
  }

  feedItemReadability({ feedId, id }: { feedId: string; id: string }) {
    return serviceRequester<string>(
      `/api/feed-items/${encodeURIComponent(id)}/${feedId}/extract-content`,
    );
  }

  markFeedItemAsReaded({
    data,
  }: {
    data: { ids: { id: string; feedId: string }[] } | { feedId: string };
  }) {
    return serviceRequester("/api/feed-items/read", {
      method: "patch",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  markFeedItemAsUnreaded({
    data,
  }: {
    data: { ids: { id: string; feedId: string }[] } | { feedId: string };
  }) {
    return serviceRequester("/api/feed-items/unread", {
      method: "patch",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  markFeedItemAsBookmarked({
    data,
  }: {
    data: { id: string; feedId: string };
  }) {
    return serviceRequester("/api/feed-items/bookmark", {
      method: "patch",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  markFeedItemAsUnbookmarked({
    data,
  }: {
    data: { id: string; feedId: string };
  }) {
    return serviceRequester("/api/feed-items/unbookmark", {
      method: "patch",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  }
}

export default FeedItemsService;
