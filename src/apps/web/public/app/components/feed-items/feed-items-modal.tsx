import { type FC, useEffect, useRef, useState } from "react";
import { Button, Col, Image as BSImage, Modal, Row } from "react-bootstrap";
import { useSWRConfig } from "swr";
import useSWRInfinite, { type SWRInfiniteKeyLoader } from "swr/infinite";
import {
  type FeedItemsTable,
  type FeedsTable,
} from "#src/database/types/mod.js";
import requests, { makeRequester, paths } from "../../common/api.js";
import DeleteFeedModal from "../feeds/delete-feed-modal.js";
import UpdateFeedModal from "../feeds/update-feed-modal.js";
import FeedItemPlaceholder from "./feed-item-placeholder.js";
import FeedItem from "./feed-item.js";

const getKey =
  ({
    fetch,
    showAll,
    showBookmarked,
    feedId,
  }: {
    fetch: boolean;
    showAll: boolean;
    feedId: string;
    showBookmarked: boolean;
  }): SWRInfiniteKeyLoader<{
    data: FeedItemsTable[];
    pagination: { nextCursor: string };
  }> =>
  (pageIndex, previousPageData) => {
    let url = `${paths.feedItems.getFeedItems}?feedId=${feedId}&limit=10`;

    if (!showAll) url += "&unread=true";
    if (showBookmarked) url += "&bookmarked=true";

    if (pageIndex === 0) {
      return fetch ? url : null;
    }

    if (!previousPageData?.pagination.nextCursor) return null;

    url += `&nextCursor=${encodeURIComponent(
      previousPageData.pagination.nextCursor,
    )}`;

    return fetch ? url : null;
  };

type FeedItemsModalArgs = {
  show: boolean;
  feed: FeedsTable;
  handleClose: () => unknown;
};

const FeedItemsModal: FC<FeedItemsModalArgs> = ({
  show,
  handleClose,
  feed,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const wasDeletedRef = useRef(false);
  const { mutate } = useSWRConfig();
  const [fetch, setFetch] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const {
    data,
    mutate: feedItemsMutate,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite<{
    data: FeedItemsTable[];
    pagination: { nextCursor: string };
  }>(getKey({ showAll, fetch, showBookmarked, feedId: feed.id }), null, {
    revalidateOnMount: false,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateFirstPage: false,
  });

  useEffect(() => {
    if (show) {
      feedItemsMutate();
    }
  }, [show, feedItemsMutate]);

  return (
    <>
      <UpdateFeedModal
        show={showUpdateModal}
        handleClose={() => {
          setShowUpdateModal(false);
        }}
        toUpdate={feed}
      />
      <DeleteFeedModal
        show={showDeleteModal}
        handleClose={({ deleted }) => {
          wasDeletedRef.current = deleted;
          setShowDeleteModal(false);

          if (deleted) {
            handleClose();
          }
        }}
        toDelete={feed}
      />
      <Modal
        size="xl"
        show={show}
        onHide={handleClose}
        fullscreen="lg-down"
        scrollable
        onEnter={() => {
          setFetch(true);
        }}
        onExited={() => {
          setFetch(false);

          mutate(
            (key) =>
              typeof key === "string" &&
              key.startsWith(paths.feedItems.getFeedItems),
            undefined,
            { revalidate: false },
          );

          if (wasDeletedRef.current) {
            wasDeletedRef.current = false;
            mutate(
              (key) =>
                typeof key === "string" && key.startsWith(paths.feeds.getFeeds),
            );
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <BSImage
              src={`https://icons.duckduckgo.com/ip3/${
                new URL(feed.url).host
              }.ico`}
              style={{ width: "32px", height: "32px" }}
              roundedCircle
            />
            <span className="mx-1" />
            {/* @ts-ignore */}
            <span className="w-100" style={{ wordWrap: "anywhere" }}>
              {feed.name}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row xs={1} lg={2} className="g-4">
            {(data ?? []).flatMap(({ data: feedItems }) =>
              feedItems
                .filter((feedItem) => (showAll ? true : !feedItem.readedAt))
                .map((feedItem) => (
                  <Col key={feedItem.id}>
                    <FeedItem
                      mutate={() => {
                        makeRequester<FeedItemsTable>(
                          paths.feedItems.getFeedItem
                            .replace(
                              ":feedId",
                              encodeURIComponent(feedItem.feedId),
                            )
                            .replace(":id", encodeURIComponent(feedItem.id)),
                        )
                          .then((fiUpdated) => {
                            feedItemsMutate(
                              (current) =>
                                Array.isArray(current)
                                  ? current.map((page) => ({
                                      ...page,
                                      data: page.data.map((fi) =>
                                        fi.id === fiUpdated.id ? fiUpdated : fi,
                                      ) as FeedItemsTable[],
                                    }))
                                  : current,
                              { revalidate: false },
                            );
                          })
                          .catch(() => {});

                        mutate(
                          (key) =>
                            typeof key === "string" &&
                            key.startsWith(paths.feeds.getFeeds),
                        );
                      }}
                      feedItem={feedItem}
                    />
                  </Col>
                )),
            )}
            {(isLoading || isValidating) && (
              <>
                <FeedItemPlaceholder />
                <FeedItemPlaceholder />
              </>
            )}
          </Row>
          <Row className="my-4">
            <Col className="d-flex justify-content-center">
              <Button
                variant="primary"
                onClick={() => setSize((size) => size + 1)}
                disabled={
                  isLoading ||
                  isValidating ||
                  !data?.at(-1)?.pagination?.nextCursor
                }
              >
                Load More
              </Button>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="justify-content-start">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowUpdateModal(true);
            }}
          >
            <i className="bi bi-pencil-square" />
          </Button>
          <span className="mx-1" />
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setShowDeleteModal(true);
            }}
          >
            <i className="bi bi-trash-fill" />
          </Button>
          <span className="mx-1" />
          <Button
            variant="success"
            size="sm"
            onClick={() => {
              if (!data) return;

              requests.feedItems
                .markFeedItemsAsRead({
                  body: {
                    feedId: feed.id,
                    from: btoa(
                      `${
                        (data[0].data[0] as unknown as { rowid: number }).rowid
                      }@@${data[0].data[0].createdAt}`,
                    ),
                  },
                })
                .then(() => {
                  feedItemsMutate();
                  mutate(
                    (key) =>
                      typeof key === "string" &&
                      key.startsWith(`${paths.feeds.getFeeds}?categoryId=`),
                  );
                });
            }}
          >
            <i className="bi bi-check2-all" />
          </Button>
          <span className="mx-auto" />
          <Button
            variant={showAll ? "warning" : "secondary"}
            size="sm"
            onClick={() => {
              setShowAll((previous) => !previous);
            }}
          >
            <i
              className={showAll ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"}
            />
          </Button>
          <span className="mx-1" />
          <Button
            variant={showBookmarked ? "warning" : "secondary"}
            size="sm"
            onClick={() => {
              setShowBookmarked((previous) => !previous);
            }}
          >
            <i
              className={
                showBookmarked
                  ? "bi bi-bookmark-fill"
                  : "bi bi-bookmark-dash-fill"
              }
            />
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FeedItemsModal;
