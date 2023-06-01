import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import { useDebounce } from "usehooks-ts";
import html from "../common/html.js";

const UpdateFeedModal = ({ show, handleClose, feed, categories }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [toUpdate, setToUpdate] = useState(feed ?? {});
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
    if (
      !canInteract ||
      (Boolean(verifyError) && url !== toUpdate?.url) ||
      (!validUrl && url !== toUpdate?.url) ||
      submittedRef.current
    )
      return;

    submittedRef.current = true;
    setCreateError(undefined);
    fetcher.submit(
      { entity: "feed", url: validUrl ? url : toUpdate?.url, name, categoryId, id: toUpdate.id },
      { method: "PATCH" },
    );
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
      onEnter=${() => {
        setName(feed?.name);
        setUrl(feed?.url);
        setCategoryId(feed?.categoryId);
        setToUpdate(feed ?? {});
      }}
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
        <${Modal.Title}>Edit category "${toUpdate?.name}"<//>
      <//>
      <${Modal.Body}>
        ${Boolean(verifyError) &&
        html`<${Alert} variant="danger">Unable too verify or invalid feed url<//>`}
        ${Boolean(createError) && html`<${Alert} variant="danger">Could not update feed<//>`}

        <${Form}
          onSubmit=${(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <${Form.Group} className="mb-3">
            <${Form.Label}>Name<//>
            <${Form.Control}
              type="email"
              placeholder="New name for the feed"
              autoFocus
              value=${name}
              onInput=${(event) => setName(event.target.value)}
              disabled=${checkingUrl}
            />
          <//>

          <${Form.Group} className="mb-3">
            <${Form.Label}>Category<//>
            <${Form.Select}
              value=${categoryId}
              onChange=${(event) => setCategoryId(event.target.value)}
            >
              ${(categories ?? []).map(
                (category) => html`<option value=${category.id}>${category.name}</option>`,
              )}
            <//>
          <//>

          <${Form.Group} className="mb-3">
            <${Form.Label}>Url<//>
            <${Form.Control}
              type="text"
              placeholder="New url for the feed"
              autoFocus
              value=${url}
              onInput=${(event) => setUrl(event.target.value)}
              disabled=${checkingUrl}
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

export default UpdateFeedModal;
