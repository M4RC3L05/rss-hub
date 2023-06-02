import { Col, Container, Row } from "react-bootstrap";
import { useDocumentTitle } from "usehooks-ts";
import { useRef, useEffect } from "react";
import { useLoaderData, defer } from "react-router-dom";
import Masonry from "masonry-layout";
import html from "../common/html.js";
import requests from "../common/request.js";
import ActionModals from "../components/action-modals.js";
import CategoryItem from "../components/category-item.js";
import CreateCategoryItem from "../components/create-category-item.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  const [categories, feeds] = await Promise.all([
    requests.categories.getCategories(),
    requests.feeds.getFeeds(),
  ]);
  let feedItems;

  if (url.searchParams.has("feedId")) {
    const feedId = url.searchParams.get("feedId");
    const unread =
      url.searchParams.get("unread") === "true" ? url.searchParams.get("unread") : undefined;

    feedItems = requests.feedItems
      .getFeedItemsByFeedId({
        feedId,
        unread,
      })
      .then(({ data }) => data);
  }

  return defer({ data: { categories: categories.data, feeds: feeds.data, feedItems } });
};

export const action = async ({ request }) => {
  const body = await request.formData();

  const entity = body.get("entity");
  const action = body.get("action");

  if (action === "reset") {
    return null;
  }

  if (request.method === "DELETE") {
    if (entity === "category") {
      return requests.categories.deleteCategory({ id: body.get("id") });
    }

    if (entity === "feed") {
      return requests.feeds.deleteFeed({ id: body.get("id") });
    }
  }

  if (request.method === "PATCH") {
    if (entity === "category") {
      return requests.categories.updateCategoryName({
        id: body.get("id"),
        body: { name: body.get("name") },
      });
    }

    if (entity === "feed") {
      return requests.feeds.updateFeed({
        body: { categoryId: body.get("categoryId"), name: body.get("name"), url: body.get("url") },
        id: body.get("id"),
      });
    }

    if (entity === "feed-items") {
      if (action === "mark-as-read") {
        return requests.feedItems
          .markFeedItemsAsRead({
            body: { feedId: body.get("feedId") ?? undefined, id: body.get("id") ?? undefined },
          })
          .then(() => ({ data: { ok: true } }));
      }

      if (action === "mark-as-unread") {
        return requests.feedItems
          .markFeedItemAsUnread({
            body: { feedId: body.get("feedId") ?? undefined, id: body.get("id") ?? undefined },
          })
          .then(() => ({ data: { ok: true } }));
      }
    }
  }

  if (request.method === "POST") {
    if (entity === "category") {
      return requests.categories.createCategory({
        body: { name: body.get("name") },
      });
    }

    if (entity === "feed" && action === "verify-url") {
      return requests.feeds.validateFeedUrl({ url: body.get("url") });
    }

    if (entity === "feed") {
      return requests.feeds.createFeed({
        body: { categoryId: body.get("categoryId"), name: body.get("name"), url: body.get("url") },
      });
    }
  }

  return null;
};

export const Component = () => {
  useDocumentTitle("RSS HUB");

  const {
    data: { categories },
  } = useLoaderData();
  const rowRef = useRef();
  const masonryRef = useRef();

  useEffect(() => {
    if (!masonryRef.current) {
      masonryRef.current = new Masonry(rowRef.current, {
        percentPosition: true,
        initLayout: false,
        itemSelector: ".mesonry-item",
      });
    }

    masonryRef.current?.layout();
  }, []);

  useEffect(() => {
    globalThis.requestAnimationFrame(() => {
      masonryRef.current?.reloadItems();
      masonryRef.current?.layout();
    });
  }, [categories]);

  return html`
    <${ActionModals} />
    <${Container} className="py-4">
      <${Row} className="mb-4">
        <${Col} className="text-center">
          <h1 class="display-2">RSS hub</h1>
          <h4>Track and get the latests new</h4>
        <//>
      <//>
      <${Row} ref=${rowRef}>
        <${CreateCategoryItem} />
        ${(categories ?? []).map(
          (category) => html` <${CategoryItem} category=${category} key=${category.id} /> `,
        )}
      <//>
    <//>
  `;
};

Component.displayName = "IndexPage";
