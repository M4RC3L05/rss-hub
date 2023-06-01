import { Modal, Button, Container, Row, Col } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import html from "../common/html.js";

const FeedItemContentModal = ({ feedItem: feedItemOut, show, handleClose }) => {
  const [feedItem, setFeedItem] = useState(feedItemOut);
  const unreadRef = useRef(false);
  const fetcher = useFetcher();
  const markAsReadFetcher = useFetcher();

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

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.data?.ok) {
      unreadRef.current = true;
      fetcher.submit({ action: "reset" }, { method: "POST" });
    }
  }, [fetcher]);

  useEffect(() => {
    if (feedItemOut) setFeedItem(feedItemOut);
  }, [feedItemOut]);

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
    <${Modal}
      show=${show}
      onHide=${handleClose}
      fullscreen
      onExit=${() => {
        if (unreadRef.current) {
          unreadRef.current = false;
          return;
        }

        markAsReadFetcher.submit(
          { entity: "feed-items", action: "mark-as-read", id: feedItem.id },
          { method: "PATCH" },
        );
        setFeedItem(undefined);
        unreadRef.current = false;
      }}
      centered
    >
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
    <//>
  `;
};

export default FeedItemContentModal;
