import type { CategoriesTable } from "#src/database/types/mod.js";
import { serviceRequester } from "../common/mod.js";

class CategoriesService {
  create({ data }: { data: { name: string } }) {
    return serviceRequester("/api/categories", {
      method: "post",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  getCategories() {
    return serviceRequester<CategoriesTable[]>("/api/categories");
  }

  getCategoryById({ id }: { id: string }) {
    return serviceRequester<CategoriesTable>(`/api/categories/${id}`);
  }

  updateCategory({ data, id }: { data: { name: string }; id: string }) {
    return serviceRequester(`/api/categories/${id}`, {
      method: "patch",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  deleteCategory({ id }: { id: string }) {
    return serviceRequester(`/api/categories/${id}`, { method: "delete" });
  }
}

export default CategoriesService;
