import { type FC, useState } from "react";
import { Card, Col } from "react-bootstrap";
import { ImportOpmlModal } from "../opml/mod.js";
import { paths } from "../../common/api.js";
import CreateCategoryModel from "./create-category-modal.js";

type CreateCategoryItemArgs = Record<string, unknown>;

const CreateCategoryItem: FC<CreateCategoryItemArgs> = ({ category }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <>
      <CreateCategoryModel
        show={showCreateModal}
        handleClose={() => {
          setShowCreateModal(false);
        }}
      />
      <ImportOpmlModal
        show={showImportModal}
        handleClose={() => {
          setShowImportModal(false);
        }}
      />
      <Col sm="6" lg="4" className="mesonry-item mb-4">
        <Card>
          <Card.Body className="d-flex flex-direction-row justify-content-around">
            <h1
              style={{ cursor: "pointer" }}
              onClick={() => {
                setShowCreateModal(true);
              }}
              className="text-center"
            >
              <i className="bi bi-plus-square"></i>
            </h1>
            <h1
              style={{ cursor: "pointer" }}
              onClick={() => {
                setShowImportModal(true);
              }}
              className="text-center"
            >
              <i className="bi bi-file-earmark-arrow-up"></i>
            </h1>
            <a href={paths.opml.exportOpml} target="_blank" style={{ color: "inherit" }}>
              <h1 style={{ cursor: "pointer" }} className="text-center">
                <i className="bi bi-file-earmark-arrow-down"></i>
              </h1>
            </a>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default CreateCategoryItem;
