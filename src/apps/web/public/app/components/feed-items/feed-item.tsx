import { type FC, useState } from "react";
import { Badge, Button, Card } from "react-bootstrap";
import { type FeedItemsTable } from "../../../../../../database/types/mod.js";
import requests from "../../common/api.js";
import FeedItemContentModal from "./feed-item-content-modal.js";

type FeedItemArgs = {
  feedItem: FeedItemsTable;
  mutate: () => unknown;
};

const FeedItem: FC<FeedItemArgs> = ({ feedItem, mutate }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  return (
    <>
      <FeedItemContentModal
        show={showDetailModal}
        feedItem={feedItem}
        mutate={mutate}
        handleClose={() => {
          setShowDetailModal(false);
        }}
      />
      <Card
        className="mx-2 mb-2"
        onClick={() => {
          setShowDetailModal(true);
        }}
      >
        <Card.Img variant="top" src={feedItem.img} />
        <Card.Body>
          <Card.Title>{feedItem.title}</Card.Title>
          <Card.Subtitle className="mb-4 text-muted">
            {new Date(feedItem.createdAt).toLocaleString()}
            <br />
            <br />
            {feedItem.bookmarkedAt && (
              <>
                <Badge bg="light" text="dark">
                  Bookmarked
                </Badge>
                <span className="mx-1" />
              </>
            )}

            <Badge bg={feedItem.readedAt ? "success" : "info"}>
              {feedItem.readedAt ? "Read" : "Unread"}
            </Badge>
          </Card.Subtitle>
          <Button
            variant={feedItem.bookmarkedAt ? "danger" : "primary"}
            onClick={(e) => {
              e.stopPropagation();

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
                  : "bi bi-bookmark-plus-fill"
              }
            />
          </Button>
          <span className="mx-1" />
          <Button
            variant={feedItem.readedAt ? "danger" : "primary"}
            onClick={(e) => {
              e.stopPropagation();

              (feedItem.readedAt
                ? requests.feedItems.markFeedItemAsUnread({
                    body: { id: feedItem.id, feedId: feedItem.feedId },
                  })
                : requests.feedItems.markFeedItemsAsRead({
                    body: { id: feedItem.id, feedId: feedItem.feedId },
                  })
              ).then(() => {
                mutate();
              });
            }}
          >
            <i
              className={
                feedItem.readedAt ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"
              }
            />
          </Button>
        </Card.Body>
      </Card>
    </>
  );
};

export default FeedItem;
