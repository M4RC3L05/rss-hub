import { useMemo, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import html from "../common/html.js";
import FeedItemsModal from "../components/feed-items-modal.js";
import FeedItemContentModal from "./feed-item-content-modal.js";
import DeleteCategoryModal from "./delete-category-modal.js";
import UpdateCategoryModel from "./update-category-modal.js";
import CreateCategoryModel from "./create-category-modal.js";
import CreateFeedModal from "./create-feed-modal.js";
import UpdateFeedModal from "./update-feed-modal.js";
import DeleteFeedModal from "./delete-feed-modal.js";

const ActionModals = () => {
  const {
    data: { categories, feeds },
  } = useLoaderData();
  const navigate = useNavigate();
  const [searchParameters] = useSearchParams();
  const [feedItemsModalOpen, setFeedItemsModalOpen] = useState();

  const selectedCategoryId = searchParameters.get("categoryId");
  const selectedFeedId = searchParameters.get("feedId");
  const selectedAction = searchParameters.get("action");
  const selectedEntity = searchParameters.get("entity");
  const selectedFeedItemId = searchParameters.get("feedItemId");

  const category = useMemo(
    () => (categories ?? []).find(({ id }) => id === selectedCategoryId),
    [selectedCategoryId, categories],
  );
  const feed = useMemo(
    () => (feeds ?? []).find(({ id }) => id === selectedFeedId),
    [selectedFeedId],
  );

  return html`
    <${FeedItemContentModal}
      show=${selectedCategoryId &&
      selectedFeedId &&
      selectedFeedItemId &&
      selectedAction === "view" &&
      feedItemsModalOpen}
      selectedFeedItemId=${selectedFeedItemId}
      handleClose=${() => {
        const s = new URLSearchParams(searchParameters);
        s.delete("feedItemId");
        navigate(`?${s.toString()}`);
      }}
    />
    <${FeedItemsModal}
      onOpen=${() => setFeedItemsModalOpen(true)}
      onClose=${() => setFeedItemsModalOpen(false)}
      show=${selectedCategoryId && selectedFeedId && selectedAction === "view"}
      feed=${feed}
      handleClose=${() => navigate("/")}
      selectedFeedItemId=${selectedFeedItemId}
    />
    <${DeleteCategoryModal}
      show=${selectedAction === "delete" && Boolean(category) && !feed}
      handleClose=${() => navigate("/")}
      category=${category}
    />
    <${UpdateCategoryModel}
      show=${selectedAction === "update" && Boolean(category)}
      handleClose=${() => navigate("/")}
      category=${category}
    />
    <${CreateCategoryModel}
      show=${selectedAction === "create" && selectedEntity === "category"}
      handleClose=${() => navigate("/")}
    />
    <${CreateFeedModal}
      show=${selectedAction === "create" && selectedEntity === "feed" && Boolean(category)}
      handleClose=${() => navigate("/")}
      category=${category}
    />
    <${UpdateFeedModal}
      show=${selectedAction === "update" && Boolean(feed)}
      handleClose=${() => {
        const s = new URLSearchParams(searchParameters);
        s.set("action", "view");
        navigate(`?${s.toString()}`);
      }}
      feed=${feed}
      categories=${categories}
    />
    <${DeleteFeedModal}
      show=${selectedAction === "delete" && Boolean(feed)}
      handleClose=${({ wasDeleted } = {}) => {
        if (wasDeleted) {
          navigate("/");
        } else {
          const s = new URLSearchParams(searchParameters);
          s.set("action", "view");
          navigate(`?${s.toString()}`);
        }
      }}
      feed=${feed}
    />
  `;
};

export default ActionModals;
