import { Col, Row, Image, Modal, Button, Card, Placeholder, Badge } from "react-bootstrap";
import {
  useNavigate,
  useSearchParams,
  useFetcher,
  useLoaderData,
  useAsyncValue,
  Await,
} from "react-router-dom";
import { useEffect, useCallback, Suspense, useState } from "react";
import html from "../common/html.js";
import FeedItem from "./feed-item.js";

const FeedItemPlaceholder = () => html`
  <${Col}>
    <${Card} className="mx-2 mb-2">
      <${Card.Body}>
        <${Placeholder} as="div" style=${{ aspectRatio: 16 / 9 }} animation="wave">
          <${Placeholder} xs=${12} style=${{ height: "100%" }} />
        <//>
        <${Placeholder} as=${Card.Title} animation="wave">
          <${Placeholder} xs=${6} />
        <//>
        <${Placeholder} as=${Card.Subtitle} className="mb-2 text-muted" animation="wave">
          <${Placeholder} xs=${4} />
        <//>
        <br />
        <br />
        <${Placeholder} as=${Badge} bg="info" animation="wave">
          <${Placeholder} xs=${4} style=${{ width: "40px" }} />
        <//>
      <//>
    <//>
  <//>
`;

const FeedItemsRender = ({ selectedFeedItemId }) => {
  const feedItems = useAsyncValue();
  const [items, setItems] = useState();
  const [toView, setToView] = useState(selectedFeedItemId);

  useEffect(() => {
    if (feedItems) setItems(feedItems);
  }, [feedItems]);

  useEffect(() => {
    if (selectedFeedItemId) setToView(selectedFeedItemId);
  }, [selectedFeedItemId]);

  const scrollIntoViewRef = useCallback(
    (node) => {
      if (Boolean(selectedFeedItemId) && Boolean(node)) {
        node.scrollIntoView({ block: "center" });
      }
    },
    [toView],
  );

  return html`${(items ?? []).map(
    (feedItem) =>
      html`
        <${Col} key=${feedItem?.id} ref=${feedItem.id === toView ? scrollIntoViewRef : null}>
          <${FeedItem} feedItem=${feedItem} />
        <//>
      `,
  )}`;
};

const FeedItemsModal = ({ show, handleClose, feed, onOpen, onClose, selectedFeedItemId }) => {
  const {
    data: { feedItems },
  } = useLoaderData();
  const [searchParameters] = useSearchParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const showUnreadOnly = searchParameters.get("unread") === "true";

  return html`
    <${Modal}
      size="xl"
      show=${show}
      onHide=${handleClose}
      fullscreen="lg-down"
      scrollable
      centered
      onEnter=${() => onOpen()}
      onExit=${() => onClose()}
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
          <${Suspense}
            fallback=${html`
              <${FeedItemPlaceholder} />
              <${FeedItemPlaceholder} />
              <${FeedItemPlaceholder} />
              <${FeedItemPlaceholder} />
            `}
          >
            <${Await} resolve=${feedItems} errorElement=${html`<p>Error fetching feed items</p>`}>
              <${FeedItemsRender} selectedFeedItemId=${selectedFeedItemId} />
            <//>
          <//>
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
