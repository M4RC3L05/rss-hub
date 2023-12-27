import { type FC, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useSWRConfig } from "swr";
import requests, { paths } from "../../common/api.js";

type ImportOpmlModalArgs = {
  show: boolean;
  handleClose: () => unknown;
};

const ImportOpmlModal: FC<ImportOpmlModalArgs> = ({ show, handleClose }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [opml, setOpml] = useState<File | undefined>(undefined);
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;
    if (!opml) return;

    const formData = new FormData();
    formData.set("opml", opml);

    void requests.opml.importOpml({ body: formData }).then(() => {
      handleClose();
      void mutate(paths.categories.getCategories);
      void mutate(
        (key) =>
          typeof key === "string" && key.startsWith(paths.feeds.getFeeds),
        undefined,
        {
          revalidate: true,
        },
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
        setOpml(undefined);
      }}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Import opml</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Form.Group className="mb-3">
            <Form.Label>File</Form.Label>
            <Form.Control
              placeholder="OPML file"
              autoFocus
              type="file"
              onChange={(event) => {
                setOpml(
                  (event.target as unknown as { files: File[] }).files[0],
                );
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={submit}>
          Import
        </Button>
        <Button variant="secundary" onClick={cancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportOpmlModal;
