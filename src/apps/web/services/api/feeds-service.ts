import type {
  CreateFeedRequestBodySchema,
  UpdateFeedRequestBodySchema,
} from "#src/apps/api/handlers/feeds/mod.js";
import type { FeedsTable } from "#src/database/types/mod.js";
import { serviceRequester } from "../common/mod.js";

class FeedsService {
  createFeed({ data }: { data: CreateFeedRequestBodySchema }) {
    return serviceRequester("/api/feeds", {
      method: "post",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  getFeedById({ id }: { id: string }) {
    return serviceRequester<FeedsTable>(`/api/feeds/${id}`);
  }

  getFeeds() {
    return serviceRequester<
      (FeedsTable & { unreadCount: number; bookmarkedCount: number })[]
    >("/api/feeds");
  }

  editFeed({ id, data }: { id: string; data: UpdateFeedRequestBodySchema }) {
    return serviceRequester(`/api/feeds/${id}`, {
      method: "patch",
      body: JSON.stringify(data),
      headers: { "content-type": "application/json" },
    });
  }

  deleteFeed({ id }: { id: string }) {
    return serviceRequester(`/api/feeds/${id}`, { method: "delete" });
  }

  verifyUrl({ data }: { data: { url: string } }) {
    return serviceRequester<{ title: string }>("/api/feeds/url", {
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      method: "post",
    });
  }
}

export default FeedsService;
