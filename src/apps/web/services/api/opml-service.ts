import { BaseService } from "../common/mod.ts";

class OpmlService extends BaseService {
  import({
    body,
    headers,
    signal,
  }: {
    body: ReadableStream;
    headers: { "content-type": string; "content-length": string };
    signal: AbortSignal;
  }) {
    return this.request({
      path: "/api/opml/import",
      init: {
        signal,
        body: body,
        method: "post",
        headers: headers,
      },
    });
  }

  export({ signal }: { signal: AbortSignal }) {
    return this.request({ path: "/api/opml/export", init: { signal } });
  }
}

export default OpmlService;
