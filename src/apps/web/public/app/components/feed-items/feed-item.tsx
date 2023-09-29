import { type FC, useState } from "react";
import { Badge, Card } from "react-bootstrap";
import { type FeedItemsTable } from "../../../../../../database/types/mod.js";
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
          <Card.Subtitle className="mb-2 text-muted">
            {new Date(feedItem.createdAt).toLocaleString()}
            <br />
            <br />
            <Badge bg={feedItem.readedAt ? "success" : "info"}>
              {feedItem.readedAt ? "Read" : "Unread"}
            </Badge>
          </Card.Subtitle>
        </Card.Body>
      </Card>
    </>
  );
};

export default FeedItem;
