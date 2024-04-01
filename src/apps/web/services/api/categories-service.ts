import { BaseService } from "../common/mod.ts";

class CategoriesService extends BaseService {
  createCategory(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/categories",
      init: {
        body: JSON.stringify(data),
        signal,
        headers: { "content-type": "application/json" },
        method: "POST",
      },
    });
  }

  getCategories({ signal }: { signal: AbortSignal }) {
    return this.request({ path: "/api/categories", init: { signal } });
  }

  getCategoryById({ id, signal }: { id: string; signal: AbortSignal }) {
    return this.request({ path: `/api/categories/${id}`, init: { signal } });
  }

  updateCategory(
    { data, id, signal }: {
      data: Record<string, unknown>;
      id: string;
      signal: AbortSignal;
    },
  ) {
    return this.request({
      path: `/api/categories/${id}`,
      init: {
        method: "PATCH",
        signal,
        body: JSON.stringify(data),
        headers: { "content-type": "application/json" },
      },
    });
  }

  deleteCategory({ id, signal }: { id: string; signal: AbortSignal }) {
    return this.request({
      path: `/api/categories/${id}`,
      init: { method: "DELETE", signal },
    });
  }
}

export default CategoriesService;
