import { type CategoriesTable, type FeedsTable } from "../../../../../database/types/mod.js";
import config from "./config.js";

export const paths = {
  categories: {
    getCategories: `${config.api.url}/api/categories`,
    updateCategoryName: `${config.api.url}/api/categories/:id/name`,
    deleteCategory: `${config.api.url}/api/categories/:id`,
    createCategory: `${config.api.url}/api/categories`,
  },
  feeds: {
    getFeeds: `${config.api.url}/api/feeds`,
    createFeed: `${config.api.url}/api/feeds`,
    validateFeedUrl: `${config.api.url}/api/feeds/url`,
    deleteFeed: `${config.api.url}/api/feeds/:id`,
    updateFeed: `${config.api.url}/api/feeds/:id`,
  },
  feedItems: {
    feedFeedItems: `${config.api.url}/api/feed-items`,
    markFeedItemAsRead: `${config.api.url}/api/feed-items/readed`,
    markFeedItemAsUnread: `${config.api.url}/api/feed-items/unread`,
  },
  opml: {
    exportOpml: `${config.api.url}/api/opml/export`,
    importOpml: `${config.api.url}/api/opml/import`,
  },
};

export class RequestError extends Error {
  constructor(error: Record<string, unknown>) {
    super("Request error", { cause: error });
  }
}

export const makeRequester = async <T>(input: string, options: RequestInit = {}): Promise<T> => {
  const url = new URL(input, config.api.url);
  return fetch(url.toString(), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Basic ${window.btoa(`${config.api.auth.name}:${config.api.auth.pass}`)}`,
    },
  }).then(async (response) => {
    if (response.status === 204) {
      return undefined;
    }

    return response.json().then(({ data, error }) => {
      if (error) throw new RequestError(error as Record<string, unknown>);

      return data as T;
    });
  }) as Promise<T>;
};

const requests = {
  categories: {
    deleteCategory: async ({ cancel, id }: { cancel?: AbortSignal; id: string }) =>
      makeRequester<void>(paths.categories.deleteCategory.replace(":id", id), {
        signal: cancel,
        method: "DELETE",
      }),
    createCategory: async ({
      cancel,
      body,
    }: {
      cancel?: AbortSignal;
      body: Record<string, unknown>;
    }) =>
      makeRequester<CategoriesTable>(paths.categories.createCategory, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    updateCategoryName: async ({
      cancel,
      body,
      id,
    }: {
      cancel?: AbortSignal;
      id: string;
      body: Record<string, unknown>;
    }) =>
      makeRequester<CategoriesTable>(paths.categories.updateCategoryName.replace(":id", id), {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
  },
  feeds: {
    updateFeed: async ({
      cancel,
      body,
      id,
    }: {
      cancel?: AbortSignal;
      id: string;
      body: Record<string, unknown>;
    }) =>
      makeRequester<FeedsTable>(paths.feeds.updateFeed.replace(":id", id), {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    createFeed: async ({ cancel, body }: { cancel?: AbortSignal; body: Record<string, unknown> }) =>
      makeRequester<FeedsTable>(paths.feeds.createFeed, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    deleteFeed: async ({ cancel, id }: { cancel?: AbortSignal; id: string }) =>
      makeRequester<void>(paths.feeds.deleteFeed.replace(":id", id), {
        signal: cancel,
        method: "DELETE",
      }),
    validateFeedUrl: async ({ cancel, url }: { cancel?: AbortSignal; url: string }) =>
      makeRequester<{ title: string }>(paths.feeds.validateFeedUrl, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify({ url }),
        headers: {
          "content-type": "application/json",
        },
      }),
  },
  feedItems: {
    markFeedItemsAsRead: async ({
      cancel,
      body,
    }: {
      cancel?: AbortSignal;
      body: Record<string, unknown>;
    }) =>
      makeRequester<void>(paths.feedItems.markFeedItemAsRead, {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    markFeedItemAsUnread: async ({
      cancel,
      body,
    }: {
      cancel?: AbortSignal;
      body: Record<string, unknown>;
    }) =>
      makeRequester<void>(paths.feedItems.markFeedItemAsUnread, {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
  },
  opml: {
    importOpml: async ({ cancel, body }: { cancel?: AbortSignal; body: FormData }) =>
      makeRequester<void>(paths.opml.importOpml, {
        signal: cancel,
        method: "POST",
        body,
      }),
  },
};

export default requests;