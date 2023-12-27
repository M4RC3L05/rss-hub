import { type ChangeEvent, type FC, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useSWRConfig } from "swr";
import { type CategoriesTable } from "../../../../../../database/types/mod.js";
import requests, { paths } from "../../common/api.js";

type UpdateCategoryModelArgs = {
  show: boolean;
  toUpdate: Pick<CategoriesTable, "id" | "name">;
  handleClose: () => unknown;
};

const UpdateCategoryModel: FC<UpdateCategoryModelArgs> = ({
  show,
  handleClose,
  toUpdate,
}) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState(toUpdate.name);
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;

    void requests.categories
      .updateCategoryName({ body: { name }, id: toUpdate.id })
      .then(() => {
        handleClose();
        void mutate(paths.categories.getCategories);
      });
  };

  const cancel = () => {
    handleClose();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      onEntered={() => {
        setCanInteract(true);
      }}
      onExit={() => {
        setCanInteract(false);
      }}
      onExited={() => {
        setName("");
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit category "{toUpdate?.name}"</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="New name for the category"
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={submit}>
          Edit
        </Button>
        <Button variant="secundary" onClick={cancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateCategoryModel;
