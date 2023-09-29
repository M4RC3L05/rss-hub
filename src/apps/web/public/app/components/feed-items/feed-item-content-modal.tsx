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
      [".png", ".jpg", ".jpeg", ".gif"].some((end) => enclosure.url.endsWith(end))
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
      <span className="mx-2"></span>
      <Button
        variant="secundary"
        size="sm"
        onClick={async () =>
          requests.feedItems.markFeedItemAsUnread({ body: { id: feedItem.id } }).then(() => {
            unreadRef.current = true;
            mutate();
          })
        }
      >
        <i className="bi bi-circle-fill"></i>
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

        void requests.feedItems
          .markFeedItemsAsRead({ body: { id: feedItem.id } })
          .then(() => mutate());
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>{feedItem.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="w-100 h-100 overflow-x-hidden overflow-y-auto render-feed-item-container">
          <Container>
            <Row>
              <Col>
                <div
                  className="w-100 h-100"
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
                          ? `${(JSON.parse(feedItem.enclosure) as FeedItemEnclosure[])
                              .map((enclosure) => enclosureToHtml(enclosure))
                              .join("")}<hr/>`
                          : ""
                      }
                      ${feedItem.content}
                    `,
                  }}
                ></div>
              </Col>
            </Row>
          </Container>
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-start">
        <Button variant="primary" size="sm" href={feedItem.link} target="__blank">
          <i className="bi bi-box-arrow-up-right"></i>
        </Button>
        {uncheckRead}
      </Modal.Footer>
    </Modal>
  );
};

export default FeedItemContentModal;
