import { client } from "../common/mod.js";

class CategoriesService {
  async create({ data }: { data: { name: string } }) {
    const response = await client.api.categories.$post({ json: data });

    return response.json();
  }

  async getCategories() {
    const response = await client.api.categories.$get();

    return response.json();
  }

  async getCategoryById({ id }: { id: string }) {
    const response = await client.api.categories[":id"].$get({ param: { id } });

    return response.json();
  }

  async updateCategory({ data, id }: { data: { name: string }; id: string }) {
    const response = await client.api.categories[":id"].$patch({
      param: { id },
      json: data,
    });

    return response.json();
  }

  deleteCategory({ id }: { id: string }) {
    return client.api.categories[":id"].$delete({ param: { id } });
  }
}

export default CategoriesService;
