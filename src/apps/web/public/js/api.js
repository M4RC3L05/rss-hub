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
      return undefined;
    }

    return response.json().then(({ data, error }) => {
      if (error) throw error;

      return data;
    });
  });
};

const requests = {
  categories: {
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
      makeRequester(paths.feeds.validateFeedUrl, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify({ url }),
        headers: {
          "content-type": "application/json",
        },
      }),
  },
  feedItems: {
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
  opml: {
    importOpml: ({ cancel, body } = {}) =>
      makeRequester(paths.opml.importOpml, {
        signal: cancel,
        method: "POST",
        body,
      }),
  },
};

export default requests;
