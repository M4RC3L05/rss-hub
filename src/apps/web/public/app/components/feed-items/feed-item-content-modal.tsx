import { Readability } from "@mozilla/readability";
import { type FC, useState } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { type FeedItemsTable } from "#src/database/types/mod.js";
import requests, { makeRequester, paths } from "../../common/api.js";

type FeedItemContentModalArgs = {
  feedItem: FeedItemsTable;
  show: boolean;
  handleClose: (shouldMutate?: boolean) => unknown;
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
  const [readedRef, setReadedRef] = useState(false);
  const [bookmarkedRef, setBookmarkedRef] = useState(false);
  const [readedState, setReadedState] = useState<boolean | undefined>(
    undefined,
  );
  const [bookmarkedState, setBookmarkedState] = useState<boolean | undefined>(
    undefined,
  );
  const [fullPageContent, setFullPageContent] = useState<string | undefined>();
  const [parsedMode, setParsedMode] = useState<boolean>(false);

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

  const bookmarked =
    bookmarkedRef && typeof bookmarkedState === "boolean"
      ? bookmarkedState
      : !!feedItem.bookmarkedAt;
  const readed =
    readedRef && typeof readedState === "boolean"
      ? readedState
      : !!feedItem.readedAt;

  return (
    <Modal
      show={show}
      onHide={() => handleClose(readedRef || bookmarkedRef)}
      fullscreen
      onExit={() => {
        if (!readed && !readedRef) {
          requests.feedItems
            .markFeedItemsAsRead({
              body: { id: feedItem.id, feedId: feedItem.feedId },
            })
            .then(() => mutate());
        }

        setReadedRef(false);
        setBookmarkedRef(false);
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
                      ${parsedMode ? fullPageContent : feedItem.content}
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
          variant={bookmarked ? "danger" : "primary"}
          size="sm"
          onClick={() => {
            (bookmarked
              ? requests.feedItems.unbookmarkFeedItem({
                  body: { id: feedItem.id, feedId: feedItem.feedId },
                })
              : requests.feedItems.bookmarkFeedItem({
                  body: { id: feedItem.id, feedId: feedItem.feedId },
                })
            ).then(() => {
              setBookmarkedRef(true);
              setBookmarkedState(!bookmarked);
            });
          }}
        >
          <i
            className={
              bookmarked ? "bi bi-bookmark-x-fill" : "bi bi-bookmark-check-fill"
            }
          />
        </Button>
        <span className="mx-1" />
        <Button
          variant={readed ? "danger" : "primary"}
          size="sm"
          onClick={() => {
            (readed
              ? requests.feedItems.markFeedItemAsUnread({
                  body: { id: feedItem.id, feedId: feedItem.feedId },
                })
              : requests.feedItems.markFeedItemsAsRead({
                  body: { id: feedItem.id, feedId: feedItem.feedId },
                })
            ).then(() => {
              setReadedRef(true);
              setReadedState(!readed);
            });
          }}
        >
          <i className={readed ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"} />
        </Button>
        <span className="mx-auto" />
        <Button
          variant={parsedMode ? "warning" : "secondary"}
          onClick={() => {
            setParsedMode((prev) => !prev);

            if (fullPageContent) {
              return;
            }

            setFullPageContent(
              '<p class="text-info">Extracting feed item content</p>',
            );

            makeRequester<string>(
              paths.feedItems.extractFeedItemContents
                .replace(":feedId", encodeURIComponent(feedItem.feedId))
                .replace(":id", encodeURIComponent(feedItem.id)),
            )
              .then((data) => {
                const dom = new DOMParser().parseFromString(data, "text/html");

                for (const element of dom.querySelectorAll("a")) {
                  element.setAttribute("target", "_blank");
                }

                const content = new Readability(dom).parse()?.content;

                setFullPageContent(() =>
                  content && content.trim().length > 0
                    ? content
                    : '<p class="text-danger">No content to show</p>',
                );
              })
              .catch(() => {
                setFullPageContent(
                  '<p class="text-danger">Unable to extract feed item content</p>',
                );
              });
          }}
        >
          <i
            className={parsedMode ? "bi bi-file-code-fill" : "bi bi-file-fill"}
          />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FeedItemContentModal;
