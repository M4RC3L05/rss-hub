import { useMemo, type FC, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import Masonry from "masonry-layout";
import { Col, Container, Row } from "react-bootstrap";
import { type FeedsTable, type CategoriesTable } from "../../../../database/types/mod.js";
import { paths } from "./common/api.js";
import { CreateCategoryItem, CategoryItem } from "./components/categories/mod.js";

const App: FC = () => {
  const { data: categories } = useSWR<Array<CategoriesTable & { feedCount: number }>>(
    paths.categories.getCategories,
  );
  const categoryIds = useMemo(() => categories?.map(({ id }) => id) ?? [], [categories]);
  const {
    data: feeds,
    isLoading,
    isValidating,
  } = useSWR<Record<string, Array<FeedsTable & { unreadCount: number }>>>(
    categoryIds.length > 0
      ? // eslint-disable-next-line unicorn/no-array-reduce
        `${paths.feeds.getFeeds}?${categoryIds.reduce(
          (acc, cid, index) => `${acc}${index === 0 ? "" : "&"}categoryId[]=${cid}`,
          "",
        )}`
      : null,
    { refreshInterval: 10_000 },
  );
  const rowRef = useRef<HTMLDivElement>();
  const masonryRef = useRef<Masonry>();

  useEffect(() => {
    if (!masonryRef.current) {
      masonryRef.current = new Masonry(rowRef.current!, {
        percentPosition: true,
        initLayout: false,
        itemSelector: ".mesonry-item",
      });
    }
  }, []);

  useEffect(() => {
    masonryRef.current?.reloadItems?.();
    masonryRef.current?.layout?.();
  }, [categories]);

  useEffect(() => {
    if (!isLoading) {
      masonryRef.current?.reloadItems?.();
      masonryRef.current?.layout?.();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isValidating) {
      masonryRef.current?.reloadItems?.();
      masonryRef.current?.layout?.();
    }
  }, [isValidating]);

  const renderCategoryItem = useCallback(
    ({
      category,
      feeds = [],
    }: {
      category: CategoriesTable & { feedCount: number };
      feeds: Array<FeedsTable & { unreadCount: number }>;
    }) => <CategoryItem category={category} feeds={feeds} key={category.id} />,
    [],
  );

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col className="text-center">
          <h1 className="display-2">RSS hub</h1>
          <h4>Track and get the latests new</h4>
        </Col>
      </Row>
      <Row ref={rowRef}>
        <CreateCategoryItem />
        {(categories ?? []).map((category) =>
          renderCategoryItem({ category, feeds: feeds?.[category.id] ?? [] }),
        )}
      </Row>
    </Container>
  );
};

export default App;