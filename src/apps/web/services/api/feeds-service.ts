import type { InferRequestType } from "hono";
import { client } from "../common/mod.js";

class FeedsService {
  async createFeed({
    data,
  }: { data: InferRequestType<typeof client.api.feeds.$post>["json"] }) {
    const response = await client.api.feeds.$post({ json: data });

    return response.json();
  }

  async getFeedById({ id }: { id: string }) {
    const response = await client.api.feeds[":id"].$get({ param: { id } });

    return response.json();
  }

  async getFeeds() {
    const response = await client.api.feeds.$get();

    return response.json();
  }

  async editFeed({
    id,
    data,
  }: {
    id: string;
    data: InferRequestType<(typeof client.api.feeds)[":id"]["$patch"]>["json"];
  }) {
    const response = await client.api.feeds[":id"].$patch({
      param: { id },
      json: data,
    });

    return response.json();
  }

  async deleteFeed({ id }: { id: string }) {
    const response = await client.api.feeds[":id"].$delete({ param: { id } });

    return response.json();
  }

  async verifyUrl({ data }: { data: { url: string } }) {
    const response = await client.api.feeds.url.$post({ json: data });

    return response.json();
  }
}

export default FeedsService;
