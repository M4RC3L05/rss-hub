import type { InferRequestType } from "hono/client";
import { client } from "../common/mod.js";

class FeedItemsService {
  async getFeedItems({
    feedId,
    filters,
    pagination,
  }: {
    feedId: string;
    filters?: { bookmarked?: boolean; unread?: boolean };
    pagination?: { limit?: number; page?: number };
  }) {
    const query: InferRequestType<
      (typeof client.api)["feed-items"]["$get"]
    >["query"] = { feedId };

    if (filters?.bookmarked) query.bookmarked = "true";
    if (filters?.unread) query.unread = "true";

    if (pagination?.limit) query.limit = String(pagination.limit);
    if (pagination?.page) query.page = String(pagination.page);

    const response = await client.api["feed-items"].$get({ query });

    return response.json();
  }

  async getFeedItemById({ feedId, id }: { feedId: string; id: string }) {
    const response = await client.api["feed-items"][":id"][":feedId"].$get({
      param: { feedId, id: encodeURIComponent(id) },
    });

    return response.json();
  }

  async feedItemReadability({ feedId, id }: { feedId: string; id: string }) {
    const response = await client.api["feed-items"][":id"][":feedId"][
      "extract-content"
    ].$get({ param: { feedId, id: encodeURIComponent(id) } });

    return response.json() as Promise<{ data: string }>;
  }

  markFeedItemAsReaded({
    data,
  }: {
    data: { ids: { id: string; feedId: string }[] } | { feedId: string };
  }) {
    console.log("data", data);
    return client.api["feed-items"].read.$patch(
      { json: data },
      { headers: { "content-type": "application/json" } },
    );
  }

  markFeedItemAsUnreaded({
    data,
  }: {
    data: { ids: { id: string; feedId: string }[] } | { feedId: string };
  }) {
    return client.api["feed-items"].unread.$patch({ json: data });
  }

  markFeedItemAsBookmarked({
    data,
  }: {
    data: { id: string; feedId: string };
  }) {
    return client.api["feed-items"].bookmark.$patch({ json: data });
  }

  markFeedItemAsUnbookmarked({
    data,
  }: {
    data: { id: string; feedId: string };
  }) {
    return client.api["feed-items"].unbookmark.$patch({ json: data });
  }
}

export default FeedItemsService;
