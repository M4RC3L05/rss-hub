import { type FC, useState } from "react";
import { ListGroupItem, Image as BSImage, Badge } from "react-bootstrap";
import { type FeedsTable } from "../../../../../../database/types/mod.js";
import FeedItemsModal from "../feed-items/feed-items-modal.js";

type FeedListItemArgs = {
  feed: FeedsTable & { unreadCount: number };
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
        <span className="mx-1"></span>
        {feed.name}
        <div className="me-auto"></div>
        <Badge bg="primary" pill>
          {" "}
          {feed.unreadCount}{" "}
        </Badge>
      </ListGroupItem>
    </>
  );
};

export default FeedListItem;
