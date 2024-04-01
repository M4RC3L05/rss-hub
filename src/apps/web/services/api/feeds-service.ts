import { BaseService } from "../common/mod.ts";

class FeedsService extends BaseService {
  createFeed(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/feeds",
      init: {
        signal,
        method: "POST",
        body: JSON.stringify(data),
        headers: { "content-type": "application/json" },
      },
    });
  }

  getFeedById({ id, signal }: { id: string; signal: AbortSignal }) {
    return this.request({ path: `/api/feeds/${id}`, init: { signal } });
  }

  getFeeds({ signal }: { signal: AbortSignal }) {
    return this.request({ path: "/api/feeds", init: { signal } });
  }

  editFeed(
    { id, data, signal }: {
      id: string;
      data: Record<string, unknown>;
      signal: AbortSignal;
    },
  ) {
    return this.request({
      path: `/api/feeds/${id}`,
      init: {
        signal,
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "content-type": "application/json" },
      },
    });
  }

  deleteFeed({ id, signal }: { id: string; signal: AbortSignal }) {
    return this.request({
      path: `/api/feeds/${id}`,
      init: { method: "DELETE", signal },
    });
  }

  verifyUrl(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/feeds/verify-url",
      init: {
        signal,
        body: JSON.stringify(data),
        headers: { "content-type": "application/json" },
      },
    });
  }
}

export default FeedsService;
