/* eslint-disable n/file-extension-in-import */
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import htm from "htm";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  StrictMode,
  useLayoutEffect,
} from "react";
import { createRoot } from "react-dom/client";
import Masonry from "masonry-layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image as BSTImage,
  ListGroup,
  ListGroupItem,
  Modal,
  Row,
  Placeholder,
} from "react-bootstrap";
import { useDarkMode, useDebounce } from "usehooks-ts";
import requests, { makeRequester, paths } from "./api.js";

const html = htm.bind(React.createElement);

const DeleteCategoryModal = ({ show, handleClose, toDelete }) => {
  const [canInteract, setCanInteract] = useState(false);
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;

    requests.categories.deleteCategory({ id: toDelete.id }).then(() => {
      mutate(paths.categories.getCategories);
      handleClose();
    });
  };

  const cancel = () => {
    handleClose();
  };

  return html`
    <${Modal}
      show=${show && Boolean(toDelete)}
      onHide=${handleClose}
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Delete category "${toDelete?.name}"<//>
      <//>
      <${Modal.Body}>
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

const CreateCategoryModel = ({ show, handleClose }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState("");
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;

    requests.categories.createCategory({ body: { name } }).then(() => {
      handleClose();
      mutate(paths.categories.getCategories);
    });
  };

  const cancel = () => {
    handleClose();
  };

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

const UpdateCategoryModel = ({ show, handleClose, toUpdate }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState(toUpdate.name);
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;

    requests.categories.updateCategoryName({ body: { name }, id: toUpdate.id }).then(() => {
      handleClose();
      mutate(paths.categories.getCategories);
    });
  };

  const cancel = () => {
    handleClose();
  };

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
        <${Modal.Title}>Edit category "${toUpdate?.name}"<//>
      <//>
      <${Modal.Body}>
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

const CreateFeedModel = ({ show, handleClose, category }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const { mutate } = useSWRConfig();
  const [error, setError] = useState(undefined);
  const [validUrl, setValidUrl] = useState(false);
  const debouncedUrl = useDebounce(url, 200);
  const [checkingUrl, setCheckingUrl] = useState(false);

  const checkForFeed = async (url) => {
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
    checkForFeed(url);
  }, [debouncedUrl]);

  const submit = async () => {
    if (!canInteract || Boolean(error) || !validUrl) return;

    requests.feeds.createFeed({ body: { name, url, categoryId: category.id } }).then(() => {
      handleClose();
      mutate(`${paths.feeds.getFeeds}?categoryId=${category.id}`);
    });
  };

  const cancel = () => {
    handleClose();
  };

  return html`
    <${Modal}
      show=${show}
      onHide=${handleClose}
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      onExited=${() => {
        setName("");
        setUrl("");
      }}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Create feed<//>
      <//>
      <${Modal.Body}>
        ${Boolean(error) && html`<${Alert} variant="danger">${error}<//>`}
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
              disabled=${checkingUrl}
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
              disabled=${checkingUrl}
            />
          <//>
        <//>
      <//>
      <${Modal.Footer}>
        <${Button} variant="primary" onClick=${submit} disabled=${!validUrl}>Create<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

const DeleteFeedModal = ({ show, handleClose, toDelete }) => {
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

  return html`
    <${Modal}
      show=${show && Boolean(toDelete)}
      onHide=${() => handleClose({ deleted: false })}
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Delete feed "${toDelete?.name}"<//>
      <//>
      <${Modal.Body}>
        <p>Are you sure you to delete the feed <code>${toDelete?.name}</code></p>
      <//>
      <${Modal.Footer}>
        <${Button} variant="danger" onClick=${submit}>Delete<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

const UpdateFeedModal = ({ show, handleClose, toUpdate }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [name, setName] = useState(toUpdate?.name);
  const [url, setUrl] = useState(toUpdate?.url);
  const { mutate } = useSWRConfig();
  const [error, setError] = useState(undefined);
  const [validUrl, setValidUrl] = useState(true);
  const debouncedUrl = useDebounce(url, 200);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [selectedCategory, setSeletectedCategory] = useState(toUpdate.categoryId);
  const { data: categories } = useSWR(paths.categories.getCategories);

  useEffect(() => {
    if (canInteract) {
      setName(toUpdate?.name);
      setUrl(toUpdate?.url);
    }
  }, [canInteract]);

  const checkForFeed = async (url) => {
    if (!canInteract) return;

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
  };

  useEffect(() => {
    checkForFeed(url);
  }, [debouncedUrl]);

  const submit = async () => {
    if (!canInteract || Boolean(error) || !validUrl) return;

    requests.feeds
      .updateFeed({ body: { name, url, categoryId: selectedCategory }, id: toUpdate.id })
      .then(() => {
        handleClose();
        mutate(`${paths.feeds.getFeeds}?categoryId=${toUpdate.categoryId}`);

        if (toUpdate.categoryId !== selectedCategory) {
          mutate(`${paths.feeds.getFeeds}?categoryId=${selectedCategory}`);
        }
      });
  };

  const cancel = () => {
    handleClose();
  };

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
        <${Modal.Title}>Edit category "${toUpdate?.name}"<//>
      <//>
      <${Modal.Body}>
        ${Boolean(error) && html`<${Alert} variant="danger">${error}<//>`}
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
              value=${selectedCategory}
              onChange=${(event) => setSeletectedCategory(event.target.value)}
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
        <${Button} variant="primary" onClick=${submit} disabled=${!validUrl}>Edit<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

const FeedItemContentModal = ({ feedItem, show, handleClose, mutate }) => {
  const unreadRef = useRef(false);

  const enclosureToHtml = (enclosure) => {
    if (
      enclosure?.type?.includes("image") ||
      enclosure?.type?.includes("img") ||
      [".png", ".jpg", ".jpeg", ".gif"].some((end) => enclosure.url.endsWith(end))
    ) {
      return `<img src="${enclosure.url}" />`;
    }

    if (enclosure?.type?.includes("video")) {
      return `<video controls><source src="${enclosure.url}" type=${enclosure.type} /></video>`;
    }

    if (enclosure?.type?.includes("audio")) {
      return `<audio controls><source src="${enclosure.url}" type=${enclosure.type} /></audio>`;
    }

    return "";
  };

  const uncheckRead =
    Boolean(feedItem.readedAt) &&
    html`
      <span class="mx-2"></span>
      <${Button}
        variant="secundary"
        size="sm"
        onClick=${() =>
          requests.feedItems.markFeedItemAsUnread({ body: { id: feedItem.id } }).then(() => {
            unreadRef.current = true;
            mutate();
          })}
      >
        <i class="bi bi-circle-fill"></i>
      <//>
    `;

  return html`
    <${Modal}
      show=${show}
      onHide=${handleClose}
      fullscreen
      onExit=${() => {
        if (unreadRef.current) {
          unreadRef.current = false;
          return;
        }

        requests.feedItems.markFeedItemsAsRead({ body: { id: feedItem.id } }).then(() => mutate());
      }}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>${feedItem.title}<//>
      <//>
      <${Modal.Body}>
        <div class="w-100 h-100 overflow-x-hidden overflow-y-auto render-feed-item-container">
          <${Container}>
            <${Row}>
              <${Col}>
                <div
                  class="w-100 h-100"
                  dangerouslySetInnerHTML=${{
                    __html: `
                      <div>
                        <div class="text-muted">${new Date(
                          feedItem.createdAt,
                        ).toLocaleString()}</div>
                      </div>
                      <hr />
                      ${
                        feedItem.enclosure
                          ? `${JSON.parse(feedItem.enclosure).map((enclosure) =>
                              enclosureToHtml(enclosure),
                            )}<hr/>`
                          : ""
                      }
                      ${feedItem.content}
                    `,
                  }}
                ></div>
              <//>
            <//>
          <//>
        </div>
      <//>
      <${Modal.Footer} className="justify-content-start">
        <${Button} variant="primary" size="sm" href=${feedItem.link} target="__blank">
          <i class="bi bi-box-arrow-up-right"></i>
        <//>
        ${uncheckRead}
      <//>
    <//>
  `;
};

const FeedItem = ({ feedItem, mutate }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  return html`
    <${FeedItemContentModal}
      show=${showDetailModal}
      feedItem=${feedItem}
      mutate=${mutate}
      handleClose=${() => setShowDetailModal(false)}
    />
    <${Card} className="mx-2 mb-2" onClick=${() => setShowDetailModal(true)}>
      <${Card.Img} variant="top" src=${feedItem.img} />
      <${Card.Body}>
        <${Card.Title}>${feedItem.title}<//>
        <${Card.Subtitle} className="mb-2 text-muted">
          ${new Date(feedItem.createdAt).toLocaleString()}
          <br />
          <br />
          <${Badge} bg=${feedItem.readedAt ? "success" : "info"}>
            ${feedItem.readedAt ? "Read" : "Unread"}
          <//>
        <//>
      <//>
    <//>
  `;
};

const getKey =
  ({ fetch, showAll, feedId }) =>
  (pageIndex, previousPageData) => {
    if (previousPageData && previousPageData.length === 0) return null;

    return fetch
      ? showAll
        ? `${paths.feedItems.feedFeedItems}?feedId=${feedId}&page=${pageIndex}&limit=10`
        : `${paths.feedItems.feedFeedItems}?feedId=${feedId}&unread=true&page=${pageIndex}&limit=10`
      : null;
  };

const FeedItemPlaceholder = () => {
  return html`
    <${Col}>
      <${Card} className="mx-2 mb-2">
        <${Card.Body}>
          <${Placeholder} as="div" style=${{ aspectRatio: 16 / 9 }} animation="wave">
            <${Placeholder} xs=${12} style=${{ height: "100%" }} />
          <//>
          <${Placeholder} as=${Card.Title} animation="wave">
            <${Placeholder} xs=${6} />
          <//>
          <${Placeholder} as=${Card.Subtitle} className="mb-2 text-muted" animation="wave">
            <${Placeholder} xs=${4} />
          <//>
          <br />
          <br />
          <${Placeholder} as=${Badge} bg="info" animation="wave">
            <${Placeholder} xs=${4} style=${{ width: "40px" }} />
          <//>
        <//>
      <//>
    <//>
  `;
};

const FeedItemsModal = ({ show, handleClose, feed }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const wasDeletedRef = useRef(false);
  const { mutate } = useSWRConfig();
  const [fetch, setFetch] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const {
    data,
    mutate: feedItemsMutate,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(getKey({ showAll, fetch, feedId: feed.id }));
  const ref = useRef();

  useEffect(() => {
    if (fetch && progress >= 80 && !isLoading && !isValidating && data?.at(-1)?.length > 0) {
      setSize((s) => s + 1);
    }
  }, [progress, setSize, fetch, isLoading, data?.at(-1)]);

  useLayoutEffect(() => {
    const container = ref.current;
    const listener = ref.current;

    const foo = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const getProgress = (scrollPos, scrollSize, clientSize) =>
        Number(((scrollPos / (scrollSize - clientSize)) * 100).toFixed(2));
      const verticalProgress = getProgress(scrollTop, scrollHeight, clientHeight);

      setProgress(verticalProgress);
    };

    listener?.addEventListener("scroll", foo);

    return () => {
      listener?.removeEventListener("scroll", foo);
    };
  }, [ref.current]);

  return html`
    <${UpdateFeedModal}
      show=${showUpdateModal}
      handleClose=${() => setShowUpdateModal(false)}
      toUpdate=${feed}
    />
    <${DeleteFeedModal}
      show=${showDeleteModal}
      handleClose=${({ deleted }) => {
        wasDeletedRef.current = deleted;
        setShowDeleteModal(false);

        if (deleted) {
          handleClose();
        }
      }}
      toDelete=${feed}
    />
    <${Modal}
      size="xl"
      show=${show}
      onHide=${handleClose}
      fullscreen="lg-down"
      scrollable
      onEnter=${() => {
        setFetch(true);
      }}
      onExited=${() => {
        setFetch(false);
        if (wasDeletedRef.current) {
          wasDeletedRef.current = false;
          mutate(`${paths.feeds.getFeeds}?categoryId=${feed.categoryId}`);
        }
      }}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title} className="d-flex align-items-center">
          <${BSTImage}
            src=${`https://icons.duckduckgo.com/ip3/${new URL(feed.url).host}.ico`}
            style=${{ width: "32px", height: "32px" }}
            roundedCircle
          />
          <span class="mx-1"></span>
          <span class="w-100" style=${{ wordWrap: "anywhere" }}>${feed.name}</span>
        <//>
      <//>
      <${Modal.Body} ref=${ref}>
        <${Row} xs=${1} lg=${2} className="g-4">
          ${(data ?? [[]]).flatMap((feedItems) =>
            feedItems.map(
              (feedItem) => html`
                <${Col} key=${feedItem.id}>
                  <${FeedItem}
                    mutate=${() => {
                      feedItemsMutate();
                      mutate(`${paths.feeds.getFeeds}?categoryId=${feed.categoryId}`);
                    }}
                    feedItem=${feedItem}
                  />
                <//>
              `,
            ),
          )}
          ${(isLoading || isValidating) &&
          html`
            <${FeedItemPlaceholder} />
            <${FeedItemPlaceholder} />
          `}
        <//>
      <//>
      <${Modal.Footer} className="justify-content-start">
        <${Button} variant="primary" size="sm" onClick=${() => setShowUpdateModal(true)}>
          <i class="bi bi-pencil-square"></i>
        <//>
        <span class="mx-1"></span>
        <${Button} variant="danger" size="sm" onClick=${() => setShowDeleteModal(true)}>
          <i class="bi bi-trash-fill"></i>
        <//>
        <span class="mx-1"></span>
        <${Button}
          variant="success"
          size="sm"
          onClick=${() => {
            requests.feedItems.markFeedItemsAsRead({ body: { feedId: feed.id } }).then(() => {
              feedItemsMutate();
              mutate(`${paths.feeds.getFeeds}?categoryId=${feed.categoryId}`);
            });
          }}
        >
          <i class="bi bi-check2-all"></i>
        <//>
        <span class="mx-1"></span>
        <${Button}
          variant="secundary"
          size="sm"
          onClick=${() => setShowAll((previous) => !previous)}
        >
          ${showAll
            ? html`<i class="bi bi-eye-fill"></i>`
            : html`<i class="bi bi-eye-slash-fill"></i>`}
        <//>
      <//>
    <//>
  `;
};

const ImportOpmlModel = ({ show, handleClose }) => {
  const [canInteract, setCanInteract] = useState(false);
  const [opml, setOpml] = useState(undefined);
  const { mutate } = useSWRConfig();

  const submit = () => {
    if (!canInteract) return;

    const formData = new FormData();
    formData.set("opml", opml);

    requests.opml.importOpml({ body: formData }).then(() => {
      handleClose();
      mutate(paths.categories.getCategories);
      mutate((key) => typeof key === "string" && key.startsWith(paths.feeds.getFeeds), undefined, {
        revalidate: true,
      });
    });
  };

  const cancel = () => {
    handleClose();
  };

  return html`
    <${Modal}
      show=${show}
      onHide=${handleClose}
      onEntered=${() => setCanInteract(true)}
      onExit=${() => setCanInteract(false)}
      onExited=${() => setOpml(undefined)}
      centered
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>Import opml<//>
      <//>
      <${Modal.Body}>
        <${Form}
          onSubmit=${(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <${Form.Group} className="mb-3">
            <${Form.Label}>File<//>
            <${Form.Control}
              type="text"
              placeholder="Name for the new category"
              autoFocus
              type="file"
              onInput=${(event) => setOpml(event.target.files[0])}
            />
          <//>
        <//>
      <//>
      <${Modal.Footer}>
        <${Button} variant="primary" onClick=${submit}>Import<//>
        <${Button} variant="secundary" onClick=${cancel}>Cancel<//>
      <//>
    <//>
  `;
};

const CreateCategoryItem = ({ category }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  return html`
    <${CreateCategoryModel}
      category=${category}
      show=${showCreateModal}
      handleClose=${() => setShowCreateModal(false)}
    />
    <${ImportOpmlModel} show=${showImportModal} handleClose=${() => setShowImportModal(false)} />
    <${Col} sm="6" lg="4" className="mesonry-item mb-4">
      <${Card}>
        <${Card.Body} className="d-flex flex-direction-row justify-content-around">
          <h1
            style=${{ cursor: "pointer" }}
            onClick=${() => setShowCreateModal(true)}
            class="text-center"
          >
            <i class="bi bi-plus-square"></i>
          </h1>
          <h1
            style=${{ cursor: "pointer" }}
            onClick=${() => setShowImportModal(true)}
            class="text-center"
          >
            <i class="bi bi-file-earmark-arrow-up"></i>
          </h1>
          <a href=${paths.opml.exportOpml} target="_blank" style=${{ color: "inherit" }}>
            <h1 style=${{ cursor: "pointer" }} class="text-center">
              <i class="bi bi-file-earmark-arrow-down"></i>
            </h1>
          </a>
        <//>
      <//>
    <//>
  `;
};

const CreateFeedListItem = ({ category }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return html`
    <${CreateFeedModel}
      show=${showCreateModal}
      handleClose=${() => setShowCreateModal(false)}
      category=${category}
    />
    <${ListGroupItem}
      action
      style=${{ cursor: "pointer" }}
      key=${"create"}
      className="text-center"
      onClick=${() => setShowCreateModal(true)}
    >
      <i class="bi bi-plus-lg"></i>
    <//>
  `;
};

const FeedListItem = ({ feed }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return html`
    <${FeedItemsModal}
      show=${showDetailsModal}
      handleClose=${() => setShowDetailsModal(false)}
      feed=${feed}
    />
    <${ListGroupItem}
      action
      onClick=${() => setShowDetailsModal(true)}
      className="d-flex align-items-center"
    >
      <${BSTImage}
        src=${`https://icons.duckduckgo.com/ip3/${new URL(feed.url).host}.ico`}
        style=${{ width: "16px", height: "16px" }}
        roundedCircle
      />
      <span class="mx-1"></span>
      ${feed.name}
      <div class="me-auto"></div>
      <${Badge} bg="primary" pill> ${feed.unreadCount} <//>
    <//>
  `;
};

const CategoryItem = ({ category, relayoutMesonry }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const {
    data: feeds,
    isLoading,
    isValidating,
  } = useSWR(`${paths.feeds.getFeeds}?categoryId=${category.id}`, { refreshInterval: 10_000 });

  useEffect(() => {
    if (!isLoading) {
      relayoutMesonry();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isValidating) {
      relayoutMesonry();
    }
  }, [isValidating]);

  return html`
    <${DeleteCategoryModal}
      show=${showDeleteModal}
      handleClose=${() => setShowDeleteModal(false)}
      toDelete=${category}
    />
    <${UpdateCategoryModel}
      show=${showUpdateModal}
      handleClose=${() => setShowUpdateModal(false)}
      toUpdate=${category}
    />
    <${Col} sm="6" lg="4" className="mesonry-item mb-4">
      <${Card} className="shadow-sm">
        <${Card.Header}><h4 className="mb-0">${category.name}</h1><//>
        <${ListGroup} variant="flush">
          <${CreateFeedListItem} category=${category} />
          ${(feeds ?? []).map((feed) => html`<${FeedListItem} key=${feed.id} feed=${feed} />`)}
        <//>
        <${Card.Body}>
          <${Card.Link}
            style=${{ cursor: "pointer" }}
            onClick=${() => setShowDeleteModal(true)}
          >Delete<//>
          <${Card.Link}
            style=${{ cursor: "pointer" }}
            onClick=${() => setShowUpdateModal(true)}
          >Edit<//>
        <//>
      <//>
    <//>
  `;
};

const App = () => {
  const { data: categories } = useSWR(paths.categories.getCategories);
  const rowRef = useRef();
  const masonryRef = useRef();

  useEffect(() => {
    if (!masonryRef.current) {
      masonryRef.current = new Masonry(rowRef.current, {
        percentPosition: true,
        initLayout: false,
        itemSelector: ".mesonry-item",
      });
    }
  }, []);

  useEffect(() => {
    masonryRef.current?.reloadItems();
    masonryRef.current?.layout();
  }, [categories]);

  const relayoutMesonry = useCallback(() => {
    masonryRef.current?.layout();
  }, []);

  return html`
    <${Container} className="py-4">
      <${Row} className="mb-4">
        <${Col} className="text-center">
          <h1 class="display-2">RSS hub</h1>
          <h4>Track and get the latests new</h4>
        <//>
      <//>
      <${Row} ref=${rowRef}>
        <${CreateCategoryItem} />
        ${(categories ?? []).map(
          (category) =>
            html`
              <${CategoryItem}
                category=${category}
                key=${category.id}
                relayoutMesonry=${relayoutMesonry}
              />
            `,
        )}
      <//>
    <//>
  `;
};

const Root = () => {
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    document.documentElement.dataset.bsTheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  return html`
    <${SWRConfig} value=${{ fetcher: makeRequester }}>
      <${App} />
    <//>
  `;
};

createRoot(document.querySelector("#app")).render(html`
  <${StrictMode}>
    <${Root} />
  <//>
`);
