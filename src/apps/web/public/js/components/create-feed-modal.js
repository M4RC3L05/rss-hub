import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import { useDebounce } from "usehooks-ts";
import html from "../common/html.js";

const CreateFeedModal = ({ show, handleClose, category }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [createError, setCreateError] = useState(undefined);
  const [verifyError, setVerifyError] = useState(undefined);
  const [validUrl, setValidUrl] = useState(false);
  const debouncedUrl = useDebounce(url, 200);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const fetcher = useFetcher();
  const submittedRef = useRef(false);

  const checkForFeed = async (url) => {
    if (url.length <= 0 || !canInteract || checkingUrl) return;

    setVerifyError(undefined);
    setCheckingUrl(true);
    fetcher.submit({ entity: "feed", action: "verify-url", url }, { method: "POST" });
  };

  const submit = async () => {
    if (!canInteract || Boolean(verifyError) || !validUrl || submittedRef.current) return;

    submittedRef.current = true;
    setCreateError(undefined);
    fetcher.submit({ entity: "feed", url, name, categoryId: category.id }, { method: "POST" });
  };

  const cancel = () => {
    handleClose();
  };

  useEffect(() => {
    checkForFeed(url);
  }, [debouncedUrl]);

  useEffect(() => {
    if (fetcher.state === "idle" && checkingUrl) {
      setCheckingUrl(false);
      if (fetcher.data?.error) {
        setValidUrl(false);
        setVerifyError(fetcher.data.error);
      } else {
        setValidUrl(true);
        setName(fetcher.data.data?.title ?? "");
      }
    }

    if (fetcher.state === "idle" && submittedRef.current) {
      if (fetcher.data?.error) {
        setCreateError(fetcher.data?.error);
      } else {
        handleClose();
      }
    }
  }, [fetcher, checkingUrl]);

  return html`
    <${Modal}
      show=${show}
      onHide=${handleClose}
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      onExited=${() => {
        setName("");
        setUrl("");
        submittedRef.current = false;
        setValidUrl(false);
        setCreateError(undefined);
        setCheckingUrl(false);
        setVerifyError(undefined);
      }}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Create feed<//>
      <//>
      <${Modal.Body}>
        ${Boolean(verifyError) &&
        html`<${Alert} variant="danger">Unable too verify or invalid feed url<//>`}
        ${Boolean(createError) && html`<${Alert} variant="danger">Could not create feed<//>`}

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
              placeholder="Feed name"
              value=${name}
              onInput=${(event) => setName(event.target.value)}
            />
          <//>
          <${Form.Group} className="mb-3">
            <${Form.Label}>Url<//>
            <${Form.Control}
              type="text"
              placeholder="Feed url"
              autoFocus
              value=${url}
              onInput=${(event) => setUrl(event.target.value)}
            />
          <//>
        <//>
      <//>
      <${Modal.Footer}>
        <${Button} variant="primary" onClick=${submit} disabled=${!validUrl || checkingUrl}>
          Create
        <//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

export default CreateFeedModal;
