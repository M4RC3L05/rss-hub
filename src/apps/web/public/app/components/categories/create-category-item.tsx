import { type FC, useState } from "react";
import { Card, Col } from "react-bootstrap";
import { paths } from "../../common/api.js";
import { ImportOpmlModal } from "../opml/mod.js";
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
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <h1
              style={{ cursor: "pointer", margin: 0 }}
              onClick={() => {
                setShowCreateModal(true);
              }}
            >
              <i className="bi bi-plus-square" />
            </h1>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <h1
              style={{ cursor: "pointer", margin: 0 }}
              onClick={() => {
                setShowImportModal(true);
              }}
            >
              <i className="bi bi-file-earmark-arrow-up" />
            </h1>
            <a
              href={paths.opml.exportOpml}
              target="_blank"
              style={{ color: "inherit" }}
              rel="noreferrer"
            >
              <h1 style={{ cursor: "pointer", margin: 0 }}>
                <i className="bi bi-file-earmark-arrow-down" />
              </h1>
            </a>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default CreateCategoryItem;
