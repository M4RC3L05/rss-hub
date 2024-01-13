import { type FC, useState } from "react";
import { Badge, Image as BSImage, ListGroupItem } from "react-bootstrap";
import { type FeedsTable } from "../../../../../../database/types/mod.js";
import FeedItemsModal from "../feed-items/feed-items-modal.js";

type FeedListItemArgs = {
  feed: FeedsTable & { unreadCount: number; bookmarkedCount: number };
};

const FeedListItem: FC<FeedListItemArgs> = ({ feed }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <>
      <FeedItemsModal
        show={showDetailsModal}
        handleClose={() => {
          setShowDetailsModal(false);
        }}
        feed={feed}
      />
      <ListGroupItem
        action
        onClick={() => {
          setShowDetailsModal(true);
        }}
        className="d-flex align-items-center"
      >
        <BSImage
          src={`https://icons.duckduckgo.com/ip3/${new URL(feed.url).host}.ico`}
          style={{ width: "16px", height: "16px" }}
          roundedCircle
        />
        <span className="mx-1" />
        {/* @ts-ignore */}
        <p style={{ wordWrap: "anywhere" }} className="mb-0">
          {feed.name}
        </p>
        <div className="me-auto" />
        <Badge bg="primary" pill>
          {feed.unreadCount}
        </Badge>
        <span className="mx-1" />
        <Badge bg="light" text="dark" pill className="mx-1">
          {feed.bookmarkedCount}
        </Badge>
      </ListGroupItem>
    </>
  );
};

export default FeedListItem;
