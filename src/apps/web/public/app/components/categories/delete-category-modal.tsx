import { type FC, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useSWRConfig } from "swr";
import { type CategoriesTable } from "#src/database/types/mod.js";
import requests, { paths } from "../../common/api.js";

type DeleteCategoryModalArgs = {
  show: boolean;
  toDelete?: Pick<CategoriesTable, "id" | "name"> & { feedCount: number };
  handleClose: () => unknown;
};

const DeleteCategoryModal: FC<DeleteCategoryModalArgs> = ({
  show,
  handleClose,
  toDelete,
}) => {
  const [canInteract, setCanInteract] = useState(false);
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;
    if (!toDelete) return;

    requests.categories.deleteCategory({ id: toDelete.id }).then(() => {
      handleClose();
      mutate(paths.categories.getCategories);
    });
  };

  const cancel = () => {
    handleClose();
  };

  return (
    <Modal
      show={show && Boolean(toDelete)}
      onHide={handleClose}
      onEntered={() => {
        setCanInteract(true);
      }}
      onExit={() => {
        setCanInteract(false);
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Delete category "{toDelete?.name}"</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you to delete the category <code>{toDelete?.name}</code>{" "}
          with<span> </span>
          {toDelete?.feedCount} feed(s)?
        </p>
        <p>
          This operation will delete all the feed items for all the feeds this
          category has.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={submit}>
          Delete
        </Button>
        <Button variant="secundary" onClick={cancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteCategoryModal;
