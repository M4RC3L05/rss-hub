import { type FC, useRef } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { type FeedItemsTable } from "../../../../../../database/types/mod.js";
import requests from "../../common/api.js";

type FeedItemContentModalArgs = {
  feedItem: FeedItemsTable;
  show: boolean;
  handleClose: () => unknown;
  mutate: () => unknown;
};

type FeedItemEnclosure = {
  type?: string;
  url: string;
};

const FeedItemContentModal: FC<FeedItemContentModalArgs> = ({
  feedItem,
  show,
  handleClose,
  mutate,
}) => {
  const unreadRef = useRef(false);

  const enclosureToHtml = (enclosure: FeedItemEnclosure) => {
    if (
      enclosure.type?.includes("image") ??
      enclosure.type?.includes("img") ??
      [".png", ".jpg", ".jpeg", ".gif"].some((end) =>
        enclosure.url.endsWith(end),
      )
    ) {
      return `<img src="${enclosure.url}" />`;
    }

    if (enclosure.type?.includes("video")) {
      return `<video controls><source src="${enclosure.url}" type=${enclosure.type} /></video>`;
    }

    if (enclosure.type?.includes("audio")) {
      return `<audio controls><source src="${enclosure.url}" type=${enclosure.type} /></audio>`;
    }

    return "";
  };

  const uncheckRead = Boolean(feedItem.readedAt) && (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          requests.feedItems
            .markFeedItemAsUnread({
              body: { id: feedItem.id, feedId: feedItem.feedId },
            })
            .then(() => {
              unreadRef.current = true;
              mutate();
            });
        }}
      >
        <i className={"bi bi-eye-slash-fill"} />
      </Button>
    </>
  );

  return (
    <Modal
      show={show}
      onHide={handleClose}
      fullscreen
      onExit={() => {
        if (unreadRef.current) {
          unreadRef.current = false;
          return;
        }

        if (!feedItem.readedAt) {
          requests.feedItems
            .markFeedItemsAsRead({
              body: { id: feedItem.id, feedId: feedItem.feedId },
            })
            .then(() => mutate());
        }
      }}
      centered
    >
      <Modal.Header closeButton>
        {/* @ts-ignore */}
        <Modal.Title style={{ wordWrap: "anywhere" }}>
          {feedItem.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="w-100 h-100 overflow-x-hidden overflow-y-auto render-feed-item-container">
          <Container>
            <Row>
              <Col>
                <div
                  className="w-100 h-100"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: This is ok
                  dangerouslySetInnerHTML={{
                    __html: `
                      <div>
                        <div class="text-muted">${new Date(
                          feedItem.createdAt,
                        ).toLocaleString()}</div>
                      </div>
                      <hr />
                      ${
                        feedItem.enclosure
                          ? `${(
                              JSON.parse(
                                feedItem.enclosure,
                              ) as FeedItemEnclosure[]
                            )
                              .map((enclosure) => enclosureToHtml(enclosure))
                              .join("")}<hr/>`
                          : ""
                      }
                      ${feedItem.content}
                    `,
                  }}
                />
              </Col>
            </Row>
          </Container>
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-start">
        <Button
          variant="primary"
          size="sm"
          href={feedItem.link}
          target="__blank"
        >
          <i className="bi bi-box-arrow-up-right" />
        </Button>
        <span className="mx-1" />
        <Button
          variant={feedItem.bookmarkedAt ? "danger" : "primary"}
          size="sm"
          onClick={() => {
            (feedItem.bookmarkedAt
              ? requests.feedItems.unbookmarkFeedItem({
                  body: { id: feedItem.id, feedId: feedItem.feedId },
                })
              : requests.feedItems.bookmarkFeedItem({
                  body: { id: feedItem.id, feedId: feedItem.feedId },
                })
            ).then(() => {
              mutate();
            });
          }}
        >
          <i
            className={
              feedItem.bookmarkedAt
                ? "bi bi-bookmark-x-fill"
                : "bi bi-bookmark-check-fill"
            }
          />
        </Button>
        <span className="mx-1" />
        {uncheckRead}
      </Modal.Footer>
    </Modal>
  );
};

export default FeedItemContentModal;
