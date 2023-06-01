import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import html from "../common/html.js";

const CreateCategoryModel = ({ show, handleClose }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState("");
  const fetcher = useFetcher();
  const submittedRef = useRef(false);
  const [error, setError] = useState(undefined);

  const submit = () => {
    if (!canInteract) return;

    setError(undefined);
    submittedRef.current = true;
    fetcher.submit({ entity: "category", name }, { method: "POST" });
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
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      onExited=${() => setName("")}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Create category<//>
      <//>
      <${Modal.Body}>
        ${Boolean(error) && html`<${Alert} variant="danger">Could not create category<//>`}

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
              placeholder="Name for the new category"
              autoFocus
              value=${name}
              onInput=${(event) => setName(event.target.value)}
            />
          <//>
        <//>
      <//>
      <${Modal.Footer}>
        <${Button} variant="primary" onClick=${submit}>Create<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

export default CreateCategoryModel;
