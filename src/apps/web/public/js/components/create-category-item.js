import { Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import html from "../common/html.js";

const CreateCategoryItem = () => {
  const navigate = useNavigate();

  return html`
    <${Col}
      sm="6"
      lg="4"
      className="mesonry-item mb-4"
      style=${{ cursor: "pointer" }}
      onClick=${() => navigate("?action=create&entity=category")}
    >
      <${Card}>
        <${Card.Body}>
          <h1 class="text-center mb-0">
            <i class="bi bi-plus-square-dotted"></i>
          </h1>
        <//>
      <//>
    <//>
  `;
};

export default CreateCategoryItem;
