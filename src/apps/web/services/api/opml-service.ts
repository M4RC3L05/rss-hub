import type { Readable } from "node:stream";
import config from "config";
import { client, serviceRequester } from "../common/mod.js";

const { url } = config.get<{ url: string }>("apps.web.services.api");

class OpmlService {
  import({
    body,
    headers,
  }: {
    body: Readable;
    headers: { "content-type": string; "content-length": string };
  }) {
    return serviceRequester(`${url}/api/opml/import`, {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      body: body as any,
      method: "post",
      headers: headers,
    });
  }

  async export() {
    return client.api.opml.export.$get();
  }
}

export default OpmlService;
