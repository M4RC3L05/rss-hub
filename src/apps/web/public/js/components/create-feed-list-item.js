import { ListGroupItem } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import html from "../common/html.js";

const CreateFeedListItem = ({ category }) => {
  const navigate = useNavigate();

  return html`
    <${ListGroupItem}
      action
      style=${{ cursor: "pointer" }}
      key=${"create"}
      className="text-center"
      onClick=${() => navigate(`?action=create&entity=feed&categoryId=${category.id}`)}
    >
      <i class="bi bi-plus-lg"></i>
    <//>
  `;
};

export default CreateFeedListItem;
