import { Card, Badge } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import html from "../common/html.js";

const FeedItem = ({ feedItem }) => {
  const navigate = useNavigate();
  const [searchParameters] = useSearchParams();

  return html`
    <${Card}
      className="mx-2 mb-2"
      onClick=${() => {
        const s = new URLSearchParams(searchParameters);
        s.set("feedItemId", feedItem.id);
        navigate(`/?${s.toString()}`);
      }}
    >
      <${Card.Img} variant="top" src=${feedItem?.img} />
      <${Card.Body}>
        <${Card.Title}>${feedItem?.title}<//>
        <${Card.Subtitle} className="mb-2 text-muted">
          ${new Date(feedItem?.createdAt).toLocaleString()}
          <br />
          <br />
          <${Badge} bg=${feedItem?.readedAt ? "success" : "info"}>
            ${feedItem?.readedAt ? "Read" : "Unread"}
          <//>
        <//>
      <//>
    <//>
  `;
};

export default FeedItem;
