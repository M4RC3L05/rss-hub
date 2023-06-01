import { Modal, Button, Alert } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import html from "../common/html.js";

const DeleteCategoryModal = ({ show, handleClose, category }) => {
  const [canInteract, setCanInteract] = useState(false);
  const fetcher = useFetcher();
  const submittedRef = useRef(false);
  const [error, setError] = useState(undefined);
  const [toDelete, setToDelete] = useState(category ?? {});

  const submit = () => {
    if (!canInteract) return;

    setError(undefined);
    submittedRef.current = true;
    fetcher.submit({ id: toDelete.id, entity: "category" }, { method: "DELETE" });
  };

  useEffect(() => {
    if (submittedRef.current && fetcher.state === "idle") {
      const { data } = fetcher;

      if (data?.error) {
        setError(data.error);
      } else {
        handleClose();
      }
    }
  }, [fetcher]);

  const cancel = () => {
    handleClose();
  };

  return html`
    <${Modal}
      show=${show && Boolean(toDelete)}
      onHide=${handleClose}
      onEnter=${() => setToDelete(category ?? {})}
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      onExited=${() => {
        submittedRef.current = false;
        setError(undefined);
        setToDelete({});
      }}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Delete category "${toDelete.name}"<//>
      <//>
      <${Modal.Body}>
        ${Boolean(error) && html`<${Alert} variant="danger">Could not delete category<//>`}

        <p>
          Are you sure you to delete the category <code>${toDelete?.name}</code> with<span> </span>
          ${toDelete?.feedCount} feed(s)?
        </p>
        <p>This operation will delete all the feed items for all the feeds this category has.</p>
      <//>
      <${Modal.Footer}>
        <${Button} variant="danger" onClick=${submit}>Delete<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

export default DeleteCategoryModal;
