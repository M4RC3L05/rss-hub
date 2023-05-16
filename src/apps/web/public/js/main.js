/* eslint-disable n/file-extension-in-import */
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import htm from "htm";
import React, { useState, useEffect, useCallback, useRef, StrictMode } from "react";
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
  Image,
  ListGroup,
  ListGroupItem,
  Modal,
  Row,
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
              type="email"
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
      const { title } = await requests.feeds.validateFeedUrl({ url: encodeURIComponent(url) });

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

    if (url.length <= 0) return;

    try {
      const { title } = await requests.feeds.validateFeedUrl({ url: encodeURIComponent(url) });

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
    >
      <${Modal.Header} closeButton>
        <${Modal.Title}>${feedItem.title}<//>
        <span class="mx-2"></span>
        <${Button} variant="primary" size="sm" href=${feedItem.link} target="__blank">
          <i class="bi bi-box-arrow-up-right"></i>
        <//>
        ${uncheckRead}
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
    <${Card} className="mx-2 mb-4" onClick=${() => setShowDetailModal(true)}>
      <${Card.Img} variant="top" src=${feedItem.img} />
      <${Card.Body}>
        <${Card.Title}>${feedItem.title}<//>
        <${Card.Subtitle} className="mb-2 text-muted">
          ${new Date(feedItem.createdAt).toLocaleString()}
          <br />
          <br />
          <${Badge} bg="primary">${feedItem.readedAt ? "Read" : "Unread"}<//>
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
  const { data, mutate: feedItemsMutate } = useSWR(
    fetch
      ? showAll
        ? `${paths.feedItems.feedFeedItems}?feedId=${feed.id}`
        : `${paths.feedItems.feedFeedItems}?feedId=${feed.id}&unread=true`
      : null,
  );

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
    >
      <${Modal.Header} closeButton>
        <${Modal.Title} className="d-flex align-items-center">
          <${Image}
            src=${`https://s2.googleusercontent.com/s2/favicons?domain=${
              new URL(feed.url).origin
            }&sz=32`}
            style=${{ width: "32px", height: "32px" }}
            roundedCircle
          />
          <span class="mx-1"></span>
          ${feed.name}
          <span class="mx-2"></span>
          <${Button} variant="primary" size="sm" onClick=${() => setShowUpdateModal(true)}>
            <i class="bi bi-pencil-square"></i>
          <//>
          <span class="mx-2"></span>
          <${Button} variant="danger" size="sm" onClick=${() => setShowDeleteModal(true)}>
            <i class="bi bi-trash-fill"></i>
          <//>
          <span class="mx-2"></span>
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
          <span class="mx-2"></span>
          <${Button}
          variant="secundary"
          size="sm"
          onClick=${() => setShowAll((previous) => !previous)}>
            ${
              showAll
                ? html`<i class="bi bi-eye-fill"></i>`
                : html`<i class="bi bi-eye-slash-fill"></i>`
            }
          <//>
        <//>
      <//>
      <${Modal.Body}>
        <${Row} xs=${1} lg=${2} className="g-4">
          ${(data ?? []).map(
            (feedItem) =>
              html`
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
          )}
        <//>
      <//>
    </${Modal}>
  `;
};

const CreateCategoryItem = ({ category }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return html`
    <${CreateCategoryModel}
      category=${category}
      show=${showCreateModal}
      handleClose=${() => setShowCreateModal(false)}
    />
    <${Col}
      sm="6"
      lg="4"
      className="mesonry-item mb-4"
      style=${{ cursor: "pointer" }}
      onClick=${() => setShowCreateModal(true)}
    >
      <${Card}>
        <${Card.Body}>
          <h1 class="text-center"><i class="bi bi-plus-square-dotted"></i></h1>
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
      <${Image}
        src=${`https://s2.googleusercontent.com/s2/favicons?domain=${
          new URL(feed.url).origin
        }&sz=16`}
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
