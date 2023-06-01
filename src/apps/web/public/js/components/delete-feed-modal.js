import { Modal, Button, Alert } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router-dom";
import html from "../common/html.js";

const DeleteFeedModal = ({ show, handleClose, feed }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [toDelete, setToDelete] = useState(feed ?? {});
  const fetcher = useFetcher();
  const submittedRef = useRef(false);
  const [error, setError] = useState(undefined);

  const submit = () => {
    if (!canInteract) return;

    setError(undefined);
    submittedRef.current = true;
    fetcher.submit({ entity: "feed", id: toDelete?.id }, { method: "DELETE" });
  };

  const cancel = () => {
    handleClose();
  };

  useEffect(() => {
    if (submittedRef.current && fetcher.state === "idle") {
      const { data } = fetcher;

      if (data?.error) {
        setError(data.error);
      } else {
        handleClose({ wasDeleted: true });
      }
    }
  }, [fetcher]);

  return html`
    <${Modal}
      show=${show && Boolean(toDelete)}
      onHide=${handleClose}
      onEnter=${() => setToDelete(feed ?? {})}
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
        <${Modal.Title}>Delete feed "${toDelete?.name}"<//>
      <//>
      <${Modal.Body}>
        ${Boolean(error) && html`<${Alert} variant="danger">Could not delete feed<//>`}

        <p>Are you sure you to delete the feed <code>${toDelete?.name}</code></p>
      <//>
      <${Modal.Footer}>
        <${Button} variant="danger" onClick=${submit}>Delete<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

export default DeleteFeedModal;
