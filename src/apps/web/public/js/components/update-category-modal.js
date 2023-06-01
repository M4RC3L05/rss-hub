import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import html from "../common/html.js";

const UpdateCategoryModel = ({ show, handleClose, category }) => {
  const [canInteract, setCanInteract] = useState(false);
  const fetcher = useFetcher();
  const submittedRef = useRef(false);
  const [error, setError] = useState(undefined);
  const [toUpdate, setToUpdate] = useState(category ?? {});
  const [name, setName] = useState(toUpdate.name);

  const submit = () => {
    if (!canInteract) return;

    setError(undefined);
    submittedRef.current = true;
    fetcher.submit({ entity: "category", name, id: toUpdate.id }, { method: "PATCH" });
  };

  const cancel = () => {
    handleClose();
  };

  useEffect(() => {
    if (submittedRef.current && fetcher.state === "idle" && fetcher.data) {
      const { data } = fetcher;

      if (data?.error) {
        setError(data.error);
      } else {
        handleClose();
      }
    }
  }, [fetcher]);

  return html`
    <${Modal}
      show=${show}
      onHide=${handleClose}
      onEnter=${() => {
        setName(category?.name);
        setToUpdate(category ?? {});
      }}
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      onExited=${() => {
        setName("");
        setError(undefined);
        setToUpdate({});
        submittedRef.current = false;
      }}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Edit category "${toUpdate?.name}"<//>
      <//>
      <${Modal.Body}>
        ${Boolean(error) && html`<${Alert} variant="danger">Could not update category<//>`}

        <${Form}
          onSubmit=${(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <${Form.Group} className="mb-3">
            <${Form.Label}>Name<//>
            <${Form.Control}
              type="text"
              placeholder="New name for the category"
              autoFocus
              value=${name}
              onInput=${(event) => setName(event.target.value)}
            />
          <//>
        <//>
      <//>
      <${Modal.Footer}>
        <${Button} variant="primary" onClick=${submit}>Edit<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

export default UpdateCategoryModel;
