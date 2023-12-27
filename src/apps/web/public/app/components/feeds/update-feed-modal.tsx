import { type FC, useCallback, useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import useSWR, { useSWRConfig } from "swr";
import { useDebounce } from "usehooks-ts";
import {
  type CategoriesTable,
  type FeedsTable,
} from "../../../../../../database/types/mod.js";
import requests, { paths } from "../../common/api.js";

type UpdateFeedModalArgs = {
  show: boolean;
  toUpdate: Pick<FeedsTable, "id" | "name" | "url" | "categoryId">;
  handleClose: () => unknown;
};

const UpdateFeedModal: FC<UpdateFeedModalArgs> = ({
  show,
  handleClose,
  toUpdate,
}) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState(toUpdate?.name);
  const [url, setUrl] = useState(toUpdate?.url);
  const { mutate } = useSWRConfig();
  const [error, setError] = useState<string | undefined>(undefined);
  const [validUrl, setValidUrl] = useState(true);
  const debouncedUrl = useDebounce(url, 200);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [selectedCategory, setSeletectedCategory] = useState(
    toUpdate.categoryId,
  );
  const { data: categories } = useSWR<CategoriesTable[]>(
    paths.categories.getCategories,
  );

  useEffect(() => {
    if (canInteract) {
      setName(toUpdate?.name);
      setUrl(toUpdate?.url);
    }
  }, [canInteract, toUpdate]);

  const checkForFeed = useCallback(async (url: string) => {
    setError(undefined);
    setValidUrl(false);
    setCheckingUrl(true);

    if (url.length <= 0) {
      setCheckingUrl(false);
      return;
    }

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
  }, []);

  useEffect(() => {
    if (!canInteract) return;

    checkForFeed(debouncedUrl);
  }, [debouncedUrl, checkForFeed, canInteract]);

  const submit = async () => {
    if (!canInteract || Boolean(error) || !validUrl) return;

    void requests.feeds
      .updateFeed({
        body: { name, url, categoryId: selectedCategory },
        id: toUpdate.id,
      })
      .then(() => {
        handleClose();
        void mutate(
          (key) =>
            typeof key === "string" &&
            key.startsWith(`${paths.feeds.getFeeds}?categoryId=`),
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
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit category "{toUpdate?.name}"</Modal.Title>
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
              placeholder="New name for the feed"
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              disabled={checkingUrl}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={selectedCategory}
              onChange={(event) => {
                setSeletectedCategory(event.target.value);
              }}
            >
              {(categories ?? []).map((category) => (
                <option value={category.id}>{category.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Url</Form.Label>
            <Form.Control
              type="text"
              placeholder="New url for the feed"
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
          Edit
        </Button>
        <Button variant="secundary" onClick={cancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateFeedModal;
