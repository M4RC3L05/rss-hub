import { type FC, useState } from "react";
import { Card, Col, ListGroup } from "react-bootstrap";
import {
  type CategoriesTable,
  type FeedsTable,
} from "#src/database/types/mod.js";
import { CreateFeedListItem, FeedListItem } from "../feeds/mod.js";
import DeleteCategoryModal from "./delete-category-modal.js";
import UpdateCategoryModel from "./update-category-modal.js";

type CategoryItemArgs = {
  category: CategoriesTable & { feedCount: number };
  feeds: Array<FeedsTable & { unreadCount: number; bookmarkedCount: number }>;
};

const CategoryItem: FC<CategoryItemArgs> = ({ category, feeds }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  return (
    <>
      <DeleteCategoryModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
        }}
        toDelete={category}
      />
      <UpdateCategoryModel
        show={showUpdateModal}
        handleClose={() => {
          setShowUpdateModal(false);
        }}
        toUpdate={category}
      />
      <Col sm="6" lg="4" className="mesonry-item mb-4">
        <Card className="shadow-sm">
          <Card.Header>
            <h4 className="mb-0">{category.name}</h4>
          </Card.Header>
          <ListGroup variant="flush">
            <CreateFeedListItem category={category} />
            {(feeds ?? []).map((feed) => (
              <FeedListItem key={feed.id} feed={feed} />
            ))}
          </ListGroup>
          <Card.Body>
            <Card.Link
              style={{ cursor: "pointer" }}
              onClick={() => {
                setShowDeleteModal(true);
              }}
            >
              Delete
            </Card.Link>
            <Card.Link
              style={{ cursor: "pointer" }}
              onClick={() => {
                setShowUpdateModal(true);
              }}
            >
              Edit
            </Card.Link>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default CategoryItem;
