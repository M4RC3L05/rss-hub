import type {
  CategoriesService,
  FeedItemsService,
  FeedsService,
  OpmlService,
} from "../apps/web/services/api/mod.js";
import type { CustomDatabase } from "../database/mod.js";
import type { ShutdownManager } from "../managers/mod.js";
import type { FeedService } from "../services/mod.js";

declare module "hono" {
  interface ContextVariableMap {
    database: CustomDatabase;
    shutdownManager: ShutdownManager;
    feedService: FeedService;
    services: {
      api: {
        categoriesService: CategoriesService;
        opmlService: OpmlService;
        feedItemsService: FeedItemsService;
        feedsService: FeedsService;
      };
    };
  }
}
