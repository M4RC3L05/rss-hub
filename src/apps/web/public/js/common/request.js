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
    getFeedItems: `${config.api.url}/api/feed-items`,
    markFeedItemAsRead: `${config.api.url}/api/feed-items/readed`,
    markFeedItemAsUnread: `${config.api.url}/api/feed-items/unread`,
  },
};

/**
 * @param {Parameters<typeof fetch>[0]} input
 * @param {Parameters<typeof fetch>[1]} options
 */
export const makeRequester = async (input, options = {}) => {
  const url = new URL(input, config.api.url);
  return fetch(url.toString(), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Basic ${window.btoa(`${config.api.auth.name}:${config.api.auth.pass}`)}`,
    },
  }).then((response) => {
    if (response.status === 204) {
      return null;
    }

    return response.json();
  });
};

const requests = {
  categories: {
    getCategories: ({ cancel } = {}) => makeRequester(paths.categories.getCategories, { cancel }),
    deleteCategory: ({ cancel, id } = {}) =>
      makeRequester(paths.categories.deleteCategory.replace(":id", id), {
        signal: cancel,
        method: "DELETE",
      }),
    createCategory: ({ cancel, body } = {}) =>
      makeRequester(paths.categories.createCategory, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    updateCategoryName: ({ cancel, body, id } = {}) =>
      makeRequester(paths.categories.updateCategoryName.replace(":id", id), {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
  },
  feeds: {
    getFeeds: ({ cancel } = {}) => makeRequester(paths.feeds.getFeeds, { cancel }),
    updateFeed: ({ cancel, body, id } = {}) =>
      makeRequester(paths.feeds.updateFeed.replace(":id", id), {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    createFeed: ({ cancel, body } = {}) =>
      makeRequester(paths.feeds.createFeed, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    deleteFeed: ({ cancel, id } = {}) =>
      makeRequester(paths.feeds.deleteFeed.replace(":id", id), {
        signal: cancel,
        method: "DELETE",
      }),
    validateFeedUrl: ({ cancel, url } = {}) =>
      makeRequester(`${paths.feeds.validateFeedUrl}`, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify({ url }),
        headers: {
          "content-type": "application/json",
        },
      }),
  },
  feedItems: {
    getFeedItemsByFeedId({ cancel, feedId, unread } = {}) {
      const url = new URL(paths.feedItems.getFeedItems);

      url.searchParams.set("feedId", feedId);

      if (unread) url.searchParams.set("unread", true);

      return makeRequester(url.toString(), { cancel });
    },
    markFeedItemsAsRead: ({ cancel, body } = {}) =>
      makeRequester(paths.feedItems.markFeedItemAsRead, {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    markFeedItemAsUnread: ({ cancel, body } = {}) =>
      makeRequester(paths.feedItems.markFeedItemAsUnread, {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
  },
};

export default requests;
