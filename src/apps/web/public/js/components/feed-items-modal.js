import { Col, Row, Image, Modal, Button } from "react-bootstrap";
import { useNavigate, useSearchParams, useFetcher } from "react-router-dom";
import { useEffect, useState } from "react";
import html from "../common/html.js";
import FeedItem from "./feed-item.js";

const FeedItemsModal = ({ show, handleClose, feed }) => {
  const [searchParameters] = useSearchParams();
  const [feedItems, setFeedItems] = useState(feed?.feedItems ?? []);
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const showUnreadOnly = searchParameters.get("unread") === "true";

  useEffect(() => {
    if (feed?.feedItems) setFeedItems(feed?.feedItems);
  }, [feed?.feedItems]);

  return html`
    <${Modal}
      size="xl"
      show=${show}
      onHide=${handleClose}
      fullscreen="lg-down"
      scrollable
      centered
      onExited=${() => setFeedItems([])}
    >
      <${Modal.Header} closeButton>
        <${Modal.Title} className="d-flex align-items-center">
          <${Image}
            src=${`https://s2.googleusercontent.com/s2/favicons?domain=${
              feed?.url ? new URL(feed?.url).origin : feed?.url
            }&sz=32`}
            style=${{ width: "32px", height: "32px" }}
            roundedCircle
          />
          <span class="mx-1"></span>
          <span class="w-100" style=${{ wordWrap: "anywhere" }}>${feed?.name}</span>
        <//>
      <//>
      <${Modal.Body}>
        <${Row} xs=${1} lg=${2} className="g-4">
          ${feedItems.map(
            (feedItem) =>
              html`
                <${Col} key=${feedItem?.id}>
                  <${FeedItem} feedItem=${feedItem} />
                <//>
              `,
          )}
        <//>
      <//>
      <${Modal.Footer} className="justify-content-start">
        <${Button}
          variant="primary"
          size="sm"
          onClick=${() => {
            const s = new URLSearchParams(searchParameters);
            s.set("action", "update");
            navigate(`?${s.toString()}`);
          }}
        >
          <i class="bi bi-pencil-square"></i>
        <//>
        <span class="mx-1"></span>
        <${Button}
          variant="danger"
          size="sm"
          onClick=${() => {
            const s = new URLSearchParams(searchParameters);
            s.set("action", "delete");
            navigate(`?${s.toString()}`);
          }}
        >
          <i class="bi bi-trash-fill"></i>
        <//>
        <span class="mx-1"></span>
        <${Button}
          variant="success"
          size="sm"
          onClick=${() =>
            fetcher.submit(
              { entity: "feed-items", action: "mark-as-read", feedId: feed.id },
              { method: "PATCH" },
            )}
        >
          <i class="bi bi-check2-all"></i>
        <//>
        <span class="mx-1"></span>
        <${Button}
          variant="secundary"
          size="sm"
          onClick=${() => {
            const s = new URLSearchParams(searchParameters);
            s.set("unread", !showUnreadOnly);
            navigate(`?${s.toString()}`);
          }}
        >
          ${showUnreadOnly
            ? html`<i class="bi bi-eye-slash-fill"></i>`
            : html`<i class="bi bi-eye-fill"></i>`}
        <//>
      <//>
    <//>
  `;
};

export default FeedItemsModal;
