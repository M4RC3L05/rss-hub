import { useState, type FC, useRef, useEffect, useLayoutEffect, type RefObject } from "react";
import { useSWRConfig } from "swr";
// eslint-disable-next-line n/file-extension-in-import
import useSWRInfinite, { type SWRInfiniteKeyLoader } from "swr/infinite";
import { Modal, Image as BSImage, Col, Row, Button } from "react-bootstrap";
import { type FeedItemsTable, type FeedsTable } from "../../../../../../database/types/mod.js";
import UpdateFeedModal from "../feeds/update-feed-modal.js";
import DeleteFeedModal from "../feeds/delete-feed-modal.js";
import requests, { paths } from "../../common/api.js";
import FeedItem from "./feed-item.js";
import FeedItemPlaceholder from "./feed-item-placeholder.js";

const getKey =
  ({
    fetch,
    showAll,
    feedId,
  }: {
    fetch: boolean;
    showAll: boolean;
    feedId: string;
  }): SWRInfiniteKeyLoader<FeedItemsTable[]> =>
  (pageIndex, previousPageData) => {
    if (previousPageData && previousPageData.length === 0) return null;

    return fetch
      ? showAll
        ? `${paths.feedItems.feedFeedItems}?feedId=${feedId}&page=${pageIndex}&limit=10`
        : `${paths.feedItems.feedFeedItems}?feedId=${feedId}&unread=true&page=${pageIndex}&limit=10`
      : null;
  };

type FeedItemsModalArgs = {
  show: boolean;
  feed: FeedsTable;
  handleClose: () => unknown;
};

const FeedItemsModal: FC<FeedItemsModalArgs> = ({ show, handleClose, feed }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const wasDeletedRef = useRef(false);
  const { mutate } = useSWRConfig();
  const [fetch, setFetch] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const {
    data,
    mutate: feedItemsMutate,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite<FeedItemsTable[]>(getKey({ showAll, fetch, feedId: feed.id }));
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    if (fetch && progress >= 80 && !isLoading && !isValidating && (data?.[0]?.length ?? 0) > 0) {
      void setSize((s) => s + 1);
    }
  }, [progress, setSize, fetch, isLoading, data?.at(-1)]);

  useLayoutEffect(() => {
    const container = ref.current;
    const listener = ref.current;

    const onScroll = () => {
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const verticalProgress = Number(
        ((scrollTop / (scrollHeight - clientHeight)) * 100).toFixed(2),
      );

      setProgress(verticalProgress);
    };

    listener?.addEventListener("scroll", onScroll);

    return () => {
      listener?.removeEventListener("scroll", onScroll);
    };
  }, [ref.current]);

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
          if (wasDeletedRef.current) {
            wasDeletedRef.current = false;
            void mutate(
              (key) =>
                typeof key === "string" && key.startsWith(`${paths.feeds.getFeeds}?categoryId[]=`),
            );
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <BSImage
              src={`https://icons.duckduckgo.com/ip3/${new URL(feed.url).host}.ico`}
              style={{ width: "32px", height: "32px" }}
              roundedCircle
            />
            <span className="mx-1"></span>
            <span className="w-100" style={{ wordWrap: "anywhere" as any as undefined }}>
              {feed.name}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body ref={ref as any as RefObject<HTMLDivElement>}>
          <Row xs={1} lg={2} className="g-4">
            {(data ?? [[]]).flatMap((feedItems) =>
              feedItems.map((feedItem) => (
                <Col key={feedItem.id}>
                  <FeedItem
                    mutate={() => {
                      void feedItemsMutate();
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
        </Modal.Body>
        <Modal.Footer className="justify-content-start">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowUpdateModal(true);
            }}
          >
            <i className="bi bi-pencil-square"></i>
          </Button>
          <span className="mx-1"></span>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setShowDeleteModal(true);
            }}
          >
            <i className="bi bi-trash-fill"></i>
          </Button>
          <span className="mx-1"></span>
          <Button
            variant="success"
            size="sm"
            onClick={() => {
              void requests.feedItems
                .markFeedItemsAsRead({ body: { feedId: feed.id } })
                .then(() => {
                  void feedItemsMutate();
                  void mutate(
                    (key) =>
                      typeof key === "string" &&
                      key.startsWith(`${paths.feeds.getFeeds}?categoryId[]=`),
                  );
                });
            }}
          >
            <i className="bi bi-check2-all"></i>
          </Button>
          <span className="mx-1"></span>
          <Button
            variant="secundary"
            size="sm"
            onClick={() => {
              setShowAll((previous) => !previous);
            }}
          >
            {showAll ? (
              <i className="bi bi-eye-fill"></i>
            ) : (
              <i className="bi bi-eye-slash-fill"></i>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FeedItemsModal;
