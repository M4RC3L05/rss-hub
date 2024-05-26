export type CategoriesTable = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type FeedsTable = {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

export type FeedItemsTable = {
  id: string;
  title: string;
  enclosure?: string;
  link?: string;
  img?: string;
  content: string;
  feedId: string;
  createdAt: string;
  updatedAt: string;
  readedAt?: string;
  bookmarkedAt?: string;
};
