import { Modal, Button, Container, Row, Col, Placeholder } from "react-bootstrap";
import { useRef, useEffect, Suspense } from "react";
import { useFetcher, useAsyncValue, useLoaderData, Await } from "react-router-dom";
import html from "../common/html.js";

const FeedItemContentModalPlaceholder = () => {
  return html`
    <${Modal.Header} closeButton>
      <${Modal.Title} className="w-100"><${Placeholder} xs=${4} size="lg" /><//>
    <//>
    <${Modal.Body}>
      <div class="w-100 h-100 overflow-x-hidden overflow-y-auto render-feed-item-container">
        <${Container}>
          <${Row}>
            <${Col}>
              <${Placeholder} as="p" className="text-muted" animation="wave">
                <${Placeholder} xs=${4} />
              <//>

              <hr />

              <${Placeholder} as="div" style=${{ aspectRatio: 16 / 9 }} animation="wave">
                <${Placeholder} xs=${12} style=${{ height: "100%" }} />
              <//>

              <hr />

              <${Placeholder} as="h1" animation="wave">
                <${Placeholder} xs=${7} />
              <//>

              <${Placeholder} as="p" animation="wave">
                <${Placeholder} xs=${12} />
              <//>
              <${Placeholder} as="p" animation="wave">
                <${Placeholder} xs=${12} />
              <//>
              <${Placeholder} as="p" animation="wave">
                <${Placeholder} xs=${3} />
              <//>
            <//>
          <//>
        <//>
      </div>
    <//>
    <${Modal.Footer} className="justify-content-start">
      <${Placeholder.Button}
        variant="primary"
        size="sm"
        animation="wave"
        style=${{ width: "32px", height: "32px" }}
      />
      <${Placeholder.Button}
        variant="secundary"
        size="sm"
        animation="wave"
        style=${{ width: "32px", height: "32px" }}
      />
    <//>
  `;
};

const FeedItemContentModalSync = ({ selectedFeedItemId, unreadRef, setAsRead }) => {
  const feedItems = useAsyncValue();
  const feedItem = (feedItems ?? []).find(({ id }) => id === selectedFeedItemId);
  const fetcher = useFetcher();
  const markAsReadFetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.data?.ok) {
      unreadRef.current = true;
      fetcher.submit({ action: "reset" }, { method: "POST" });
    }
  }, [fetcher]);

  useEffect(() => {
    setAsRead(markAsRead);
  });

  const enclosureToHtml = (enclosure) => {
    if (
      enclosure?.type?.includes("image") ||
      enclosure?.type?.includes("img") ||
      [".png", ".jpg", ".jpeg", ".gif"].some((end) => enclosure.url.endsWith(end))
    ) {
      return `<img src="${enclosure.url}" />`;
    }

    if (enclosure?.type?.includes("video")) {
      return `<video controls><source src="${enclosure.url}" type=${enclosure.type} /></video>`;
    }

    if (enclosure?.type?.includes("audio")) {
      return `<audio controls><source src="${enclosure.url}" type=${enclosure.type} /></audio>`;
    }

    return "";
  };

  const markAsRead = () => {
    if (!feedItem) return;

    markAsReadFetcher.submit(
      { entity: "feed-items", action: "mark-as-read", id: feedItem.id },
      { method: "PATCH" },
    );
  };

  const uncheckRead =
    Boolean(feedItem?.readedAt) &&
    html`
      <span class="mx-2"></span>
      <${Button}
        variant="secundary"
        size="sm"
        onClick=${() =>
          fetcher.submit(
            { entity: "feed-items", action: "mark-as-unread", id: feedItem.id },
            { method: "PATCH" },
          )}
      >
        <i class="bi bi-circle-fill"></i>
      <//>
    `;

  return html`
    <${Modal.Header} closeButton>
      <${Modal.Title}>${feedItem?.title}<//>
    <//>
    <${Modal.Body}>
      <div class="w-100 h-100 overflow-x-hidden overflow-y-auto render-feed-item-container">
        <${Container}>
          <${Row}>
            <${Col}>
              <div
                class="w-100 h-100"
                dangerouslySetInnerHTML=${{
                  __html: `
                      <div>
                        <div class="text-muted">${new Date(
                          feedItem?.createdAt,
                        ).toLocaleString()}</div>
                      </div>
                      <hr />
                      ${
                        feedItem?.enclosure
                          ? `${JSON.parse(feedItem?.enclosure ?? []).map((enclosure) =>
                              enclosureToHtml(enclosure),
                            )}<hr/>`
                          : ""
                      }
                      ${feedItem?.content}
                    `,
                }}
              ></div>
            <//>
          <//>
        <//>
      </div>
    <//>
    <${Modal.Footer} className="justify-content-start">
      <${Button} variant="primary" size="sm" href=${feedItem?.link} target="__blank">
        <i class="bi bi-box-arrow-up-right"></i>
      <//>
      ${uncheckRead}
    <//>
  `;
};

const FeedItemContentModal = ({ selectedFeedItemId, show, handleClose }) => {
  const {
    data: { feedItems },
  } = useLoaderData();
  const unreadRef = useRef(false);
  const setAsReadRef = useRef();

  return html`
    <${Modal}
      show=${show}
      onHide=${handleClose}
      fullscreen
      onExit=${() => {
        if (unreadRef.current) {
          unreadRef.current = false;
          return;
        }

        setAsReadRef.current?.();
        unreadRef.current = false;
      }}
      centered
    >
      <${Suspense} fallback=${html`<${FeedItemContentModalPlaceholder} />`}>
        <${Await} resolve=${feedItems} errorElement=${html`<p>Error fetching feed items</p>`}>
          <${FeedItemContentModalSync}
            setAsRead=${(fn) => {
              setAsReadRef.current = fn;
            }}
            selectedFeedItemId=${selectedFeedItemId}
            unreadRef=${unreadRef}
          />
        <//>
      <//>
    <//>
  `;
};

export default FeedItemContentModal;
