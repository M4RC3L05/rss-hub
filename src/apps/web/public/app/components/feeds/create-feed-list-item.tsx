import { useState, type FC } from "react";
import { ListGroupItem } from "react-bootstrap";
import { type CategoriesTable } from "../../../../../../database/types/mod.js";
import CreateFeedModal from "./create-feed-modal.js";

type CreateFeedListItemArgs = {
  category: CategoriesTable;
};

const CreateFeedListItem: FC<CreateFeedListItemArgs> = ({ category }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <CreateFeedModal
        show={showCreateModal}
        handleClose={() => {
          setShowCreateModal(false);
        }}
        category={category}
      />
      <ListGroupItem
        action
        style={{ cursor: "pointer" }}
        key="create"
        className="text-center"
        onClick={() => {
          setShowCreateModal(true);
        }}
      >
        <i className="bi bi-plus-lg"></i>
      </ListGroupItem>
    </>
  );
};

export default CreateFeedListItem;
