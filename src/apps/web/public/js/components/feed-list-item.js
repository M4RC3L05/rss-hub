import { ListGroupItem, Badge, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import html from "../common/html.js";

const FeedListItem = ({ feed }) => {
  const navigate = useNavigate();

  return html`
    <${ListGroupItem}
      action
      onClick=${() =>
        navigate(`?feedId=${feed.id}&categoryId=${feed.categoryId}&unread=true&action=view`)}
      className="d-flex align-items-center"
    >
      <${Image}
        src=${`https://s2.googleusercontent.com/s2/favicons?domain=${
          new URL(feed.url).origin
        }&sz=16`}
        style=${{ width: "16px", height: "16px" }}
        roundedCircle
      />
      <span class="mx-1"></span>
      ${feed.name}
      <div class="me-auto"></div>
      <${Badge} bg="primary" pill> ${feed.unreadCount} <//>
    <//>
  `;
};

export default FeedListItem;
