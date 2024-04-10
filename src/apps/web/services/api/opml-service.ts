import { BaseService } from "#src/apps/web/services/common/mod.ts";

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
        body,
        method: "post",
        headers: headers,
      },
    });
  }

  export({ signal }: { signal: AbortSignal }) {
    return this.request({
      path: "/api/opml/export",
      init: { signal },
      sendResponse: true,
    });
  }
}

export default OpmlService;
