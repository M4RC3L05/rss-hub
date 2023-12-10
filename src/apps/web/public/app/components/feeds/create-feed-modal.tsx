import { type FC, useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { useDebounce } from "usehooks-ts";
import { Button, Modal, Form, Alert } from "react-bootstrap";
import { type CategoriesTable } from "../../../../../../database/types/mod.js";
import requests, { paths } from "../../common/api.js";

type CreateFeedModelArgs = {
  show: boolean;
  category: CategoriesTable;
  handleClose: () => unknown;
};

const CreateFeedModal: FC<CreateFeedModelArgs> = ({ show, handleClose, category }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const { mutate } = useSWRConfig();
  const [error, setError] = useState<string | undefined>(undefined);
  const [validUrl, setValidUrl] = useState(false);
  const debouncedUrl = useDebounce(url, 200);
  const [checkingUrl, setCheckingUrl] = useState(false);

  const checkForFeed = async (url: string) => {
    if (url.length <= 0) {
      setError(undefined);
      setValidUrl(false);
      setCheckingUrl(false);
      return;
    }

    setError(undefined);
    setValidUrl(false);
    setCheckingUrl(true);

    try {
      const { title } = await requests.feeds.validateFeedUrl({ url });

      setName(title);
      setValidUrl(true);
    } catch {
      setError("Looks like the url is not a valid feed");
      setValidUrl(false);
    } finally {
      setCheckingUrl(false);
    }
  };

  useEffect(() => {
    void checkForFeed(url);
  }, [debouncedUrl]);

  const submit = async () => {
    if (!canInteract || Boolean(error) || !validUrl) return;

    void requests.feeds.createFeed({ body: { name, url, categoryId: category.id } }).then(() => {
      handleClose();
      void mutate(
        (key) => typeof key === "string" && key.startsWith(`${paths.feeds.getFeeds}?categoryId=`),
      );
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
        setUrl("");
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Create feed</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {Boolean(error) && <Alert variant="danger">{error}</Alert>}
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Feed name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              disabled={checkingUrl}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Url</Form.Label>
            <Form.Control
              type="text"
              placeholder="Feed url"
              autoFocus
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
              }}
              disabled={checkingUrl}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={submit} disabled={!validUrl}>
          Create
        </Button>
        <Button variant="secundary" onClick={cancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateFeedModal;
