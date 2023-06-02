import { Col, Card, ListGroup } from "react-bootstrap";
import { useNavigate, useLoaderData } from "react-router-dom";
import html from "../common/html.js";
import FeedListItem from "../components/feed-list-item.js";
import CreateFeedListItem from "./create-feed-list-item.js";

const CategoryItem = ({ category }) => {
  const navigate = useNavigate();
  const {
    data: { feeds },
  } = useLoaderData();

  return html`
    <${Col} sm="6" lg="4" className="mesonry-item mb-4">
      <${Card} className="shadow-sm">
        <${Card.Header}><h4 className="mb-0">${category.name}</h1><//>
        <${ListGroup} variant="flush">
          <${CreateFeedListItem} category=${category} />
          ${(feeds.filter(({ categoryId }) => categoryId === category.id) ?? []).map(
            (feed) => html`<${FeedListItem} key=${feed.id} feed=${feed} />`,
          )}
        <//>
        <${Card.Body}>
         <${Card.Link}
           style=${{ cursor: "pointer" }}
           onClick=${() => navigate(`?action=delete&categoryId=${category.id}`)}
         >
           Delete
         <//>
         <${Card.Link}
           style=${{ cursor: "pointer" }}
           onClick=${() => navigate(`?action=update&categoryId=${category.id}`)}
         >
           Edit
         <//>
       <//>
      <//>
    <//>
  `;
};

export default CategoryItem;
