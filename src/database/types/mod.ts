export type CategoriesTable = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type FeedsTable = {
  id: string;
  name: string;
  url: string;
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
  raw: string;
  feedId: string;
  createdAt: string;
  updatedAt: string;
  readedAt: string;
};
