import type { Readable } from "node:stream";
import type { Response } from "node-fetch";
import { serviceRequester } from "../common/mod.js";

class OpmlService {
  import({
    body,
    headers,
  }: {
    body: Readable;
    headers: { "content-type": string; "content-length": string };
  }) {
    return serviceRequester("/api/opml/import", {
      body,
      method: "post",
      headers: headers,
    });
  }

  export() {
    return serviceRequester<Response>("/api/opml/export");
  }
}

export default OpmlService;
