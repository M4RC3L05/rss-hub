import { type FC, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { type FeedsTable } from "#src/database/types/mod.js";
import requests from "../../common/api.js";

type DeleteFeedModalArgs = {
  show: boolean;
  handleClose: (args: { deleted: boolean }) => unknown;
  toDelete: Pick<FeedsTable, "id" | "name">;
};

const DeleteFeedModal: FC<DeleteFeedModalArgs> = ({
  show,
  handleClose,
  toDelete,
}) => {
  const [canInteract, setCanInteract] = useState(false);
  const okRef = useRef(false);

  const submit = () => {
    if (!canInteract) return;

    requests.feeds.deleteFeed({ id: toDelete.id }).then(() => {
      okRef.current = true;
      handleClose({ deleted: true });
    });
  };

  const cancel = () => {
    handleClose({ deleted: false });
  };

  return (
    <Modal
      show={show && Boolean(toDelete)}
      onHide={() => handleClose({ deleted: false })}
      onEntered={() => {
        setCanInteract(true);
      }}
      onExit={() => {
        setCanInteract(false);
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Delete feed "{toDelete?.name}"</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you to delete the feed <code>{toDelete?.name}</code>
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

export default DeleteFeedModal;
