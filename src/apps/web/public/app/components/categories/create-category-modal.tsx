import { type ChangeEvent, type FC, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useSWRConfig } from "swr";
import requests, { paths } from "../../common/api.js";

type CreateCategoryModelArgs = {
  show: boolean;
  handleClose: () => unknown;
};

const CreateCategoryModel: FC<CreateCategoryModelArgs> = ({
  show,
  handleClose,
}) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState("");
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;

    requests.categories.createCategory({ body: { name } }).then(() => {
      handleClose();
      mutate(paths.categories.getCategories);
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
        <Modal.Title>Create category</Modal.Title>
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
              placeholder="Name for the new category"
              autoFocus
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setName(event.target.value);
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={submit}>
          Create
        </Button>
        <Button variant="secundary" onClick={cancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateCategoryModel;
