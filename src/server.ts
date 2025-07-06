import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import i18n, { i18nPromise } from "./i18n"; // Import the promise

await i18nPromise; // Wait for i18n to initialize at the top level

// Zendeskサブドメインを環境変数から取得
const ZENDESK_SITE_DOMAIN =
  process.env.ZENDESK_SITE_DOMAIN || "subdomain.zendesk.com";
const ZENDESK_DEFAULT_LOCALE = i18n.language;

const TOOL_IDS = {
  LIST_CATEGORIES: "zendesk_list_categories",
  LIST_SECTIONS_IN_CATEGORY: "zendesk_list_sections_in_category",
  GET_ARTICLES_IN_CATEGORY: "zendesk_get_articles_in_category",
  GET_ARTICLES_IN_SECTION: "zendesk_get_articles_in_section",
  SEARCH_ARTICLES: "zendesk_search_articles",
  GET_ARTICLE: "zendesk_get_article",
} as const;

// MCPサーバーインスタンス
const serverName =
  process.env.MCP_SERVER_NAME ||
  i18n.t("serverName", { defaultValue: "zendesk-mcp-server" });
const serverDescription =
  process.env.MCP_SERVER_DESCRIPTION || i18n.t("serverDescription");

export const server = new McpServer({
  name: serverName,
  version: "1.0.0",
  description: serverDescription,
});

// Helper function to get tool name with fallback
const getToolName = (toolId: string): string => {
  const envVarName = `MCP_TOOL_NAME_${toolId.toUpperCase()}`;
  return (
    process.env[envVarName] ||
    i18n.t(`toolNames.${toolId}`, { defaultValue: toolId })
  );
};

// Helper function to get tool description with fallback
const getToolDescription = (toolId: string): string => {
  const envVarDescription = `MCP_TOOL_DESCRIPTION_${toolId.toUpperCase()}`;
  return process.env[envVarDescription] || i18n.t(`toolDescriptions.${toolId}`);
};

// カテゴリ一覧取得
server.tool(
  getToolName(TOOL_IDS.LIST_CATEGORIES),
  getToolDescription(TOOL_IDS.LIST_CATEGORIES),
  {
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("The locale for the categories. For example, 'en-us' or 'ja'."),
    sort_by: z
      .enum(["position", "created_at", "updated_at"])
      .optional()
      .describe(
        "Sorts the results by one of the accepted values. `position` for manual order, `created_at`, or `updated_at`."
      ),
    sort_order: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Selects the order of the results, `asc` or `desc`."),
  },
  async ({ locale, sort_by, sort_order }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/${locale}/categories.json`;
    const params: any = {};
    if (sort_by) params.sort_by = sort_by;
    if (sort_order) params.sort_order = sort_order;
    const response = await axios.get(url, { params });
    const categories = response.data.categories || [];
    const resultText =
      categories.length === 0
        ? i18n.t("messages.categoriesNotFound")
        : categories
            .map((c: any) =>
              i18n.t("itemDetails.category", {
                id: c.id,
                name: c.name,
                description: c.description,
                url: c.html_url,
              })
            )
            .join("\n");
    return {
      content: [{ type: "text", text: resultText }],
    };
  }
);

// セクション一覧取得（カテゴリ指定）
server.tool(
  getToolName(TOOL_IDS.LIST_SECTIONS_IN_CATEGORY),
  getToolDescription(TOOL_IDS.LIST_SECTIONS_IN_CATEGORY),
  {
    category_id: z
      .union([z.string(), z.number()])
      .describe("The ID of the category to list sections from."),
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("The locale for the sections. For example, 'en-us' or 'ja'."),
    sort_by: z
      .enum(["position", "created_at", "updated_at"])
      .optional()
      .describe(
        "Sorts the results by one of the accepted values. `position` for manual order, `created_at`, or `updated_at`."
      ),
    sort_order: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Selects the order of the results, `asc` or `desc`."),
    per_page: z
      .number()
      .max(100)
      .optional()
      .describe("The number of sections to return per page. Maximum 100."),
    page: z.number().optional().describe("The page number to return."),
  },
  async ({ category_id, locale, sort_by, sort_order, per_page, page }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/${locale}/categories/${category_id}/sections.json`;
    const params: any = {};
    if (sort_by) params.sort_by = sort_by;
    if (sort_order) params.sort_order = sort_order;
    if (per_page) params.per_page = per_page;
    if (page) params.page = page;
    const response = await axios.get(url, { params });
    const sections = response.data.sections || [];
    const resultText =
      sections.length === 0
        ? i18n.t("messages.sectionsNotFound")
        : sections
            .map((s: any) =>
              i18n.t("itemDetails.section", {
                id: s.id,
                name: s.name,
                description: s.description,
                url: s.html_url,
              })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (sections.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return (
        i18n.t("paginationInfo", { pageTotal, pageCurrent, perPage }) + "\n\n"
      );
    })();
    return {
      content: [{ type: "text", text: paginationText + resultText }],
    };
  }
);

// カテゴリ内の記事一覧取得（カテゴリ指定）
server.tool(
  getToolName(TOOL_IDS.GET_ARTICLES_IN_CATEGORY),
  getToolDescription(TOOL_IDS.GET_ARTICLES_IN_CATEGORY),
  {
    category_id: z
      .union([z.string(), z.number()])
      .describe("The ID of the category to list articles from."),
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("The locale for the articles. For example, 'en-us' or 'ja'."),
    sort_by: z
      .enum(["position", "created_at", "updated_at"])
      .optional()
      .describe(
        "Sorts the articles by one of the accepted values. `position` for manual order, `created_at`, or `updated_at`."
      ),
    sort_order: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Selects the order of the results, `asc` or `desc`."),
    per_page: z
      .number()
      .max(100)
      .optional()
      .describe("The number of articles to return per page. Maximum 100."),
    page: z.number().optional().describe("The page number to return."),
  },
  async ({ category_id, locale, sort_by, sort_order, per_page, page }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/${locale}/categories/${category_id}/articles.json`;
    const params: any = {};
    if (sort_by) params.sort_by = sort_by;
    if (sort_order) params.sort_order = sort_order;
    if (per_page) params.per_page = per_page;
    if (page) params.page = page;
    const response = await axios.get(url, { params });
    // 検索結果（タイトル＋URL＋抜粋）をテキストでまとめる
    const articles = response.data.articles || [];
    const resultText =
      articles.length === 0
        ? i18n.t("messages.articlesNotFound")
        : articles
            .map((a: any) =>
              i18n.t("itemDetails.articleWithSnippet", {
                id: a.id,
                title: a.title,
                url: a.html_url,
                snippet: a.snippet || "",
              })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (articles.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return (
        i18n.t("paginationInfo", { pageTotal, pageCurrent, perPage }) + "\n\n"
      );
    })();
    return {
      content: [
        {
          type: "text",
          text: paginationText + resultText,
        },
      ],
    };
  }
);

// セクション内の記事一覧取得（セクション指定）
server.tool(
  getToolName(TOOL_IDS.GET_ARTICLES_IN_SECTION),
  getToolDescription(TOOL_IDS.GET_ARTICLES_IN_SECTION),
  {
    section_id: z
      .union([z.string(), z.number()])
      .describe("The ID of the section to list articles from."),
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("The locale for the articles. For example, 'en-us' or 'ja'."),
    sort_by: z
      .enum(["position", "created_at", "updated_at"])
      .optional()
      .describe(
        "Sorts the articles by one of the accepted values. `position` for manual order, `created_at`, or `updated_at`."
      ),
    sort_order: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Selects the order of the results, `asc` or `desc`."),
    per_page: z
      .number()
      .max(100)
      .optional()
      .describe("The number of articles to return per page. Maximum 100."),
    page: z.number().optional().describe("The page number to return."),
  },
  async ({ section_id, locale, sort_by, sort_order, per_page, page }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/${locale}/sections/${section_id}/articles.json`;
    const params: any = {};
    if (sort_by) params.sort_by = sort_by;
    if (sort_order) params.sort_order = sort_order;
    if (per_page) params.per_page = per_page;
    if (page) params.page = page;
    const response = await axios.get(url, { params });
    // 検索結果（タイトル＋URL＋抜粋）をテキストでまとめる
    const articles = response.data.articles || [];
    const resultText =
      articles.length === 0
        ? i18n.t("messages.articlesNotFound")
        : articles
            .map((a: any) =>
              i18n.t("itemDetails.articleWithSnippet", {
                id: a.id,
                title: a.title,
                url: a.html_url,
                snippet: a.snippet || "",
              })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (articles.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return (
        i18n.t("paginationInfo", { pageTotal, pageCurrent, perPage }) + "\n\n"
      );
    })();
    return {
      content: [
        {
          type: "text",
          text: paginationText + resultText,
        },
      ],
    };
  }
);

// 記事検索Tool
server.tool(
  getToolName(TOOL_IDS.SEARCH_ARTICLES),
  getToolDescription(TOOL_IDS.SEARCH_ARTICLES),
  {
    query: z
      .string()
      .nonempty()
      .describe(
        "The search text to be matched. For example: 'how to reset password'"
      ),
    locale: z
      .string()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("The locale for the articles. For example, 'en-us' or 'ja'."),
    per_page: z
      .number()
      .max(100)
      .optional()
      .describe("The number of articles to return per page. Maximum 100."),
    page: z.number().optional().describe("The page number to return."),
  },
  async ({ query, locale, per_page, page }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/articles/search.json`;
    const params: any = { query };
    if (locale) params.locale = locale;
    if (per_page) params.per_page = per_page;
    if (page) params.page = page;
    const response = await axios.get(url, { params });
    // 検索結果（タイトル＋URL＋抜粋）をテキストでまとめる
    const articles = response.data.results || [];
    const resultText =
      articles.length === 0
        ? i18n.t("messages.articlesNotFound")
        : articles
            .map((a: any) =>
              i18n.t("itemDetails.articleWithSnippet", {
                id: a.id,
                title: a.title,
                url: a.html_url,
                snippet: a.snippet || "",
              })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (articles.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return (
        i18n.t("paginationInfo", { pageTotal, pageCurrent, perPage }) + "\n\n"
      );
    })();
    return {
      content: [
        {
          type: "text",
          text: paginationText + resultText,
        },
      ],
    };
  }
);

// 記事詳細取得Tool
server.tool(
  getToolName(TOOL_IDS.GET_ARTICLE),
  getToolDescription(TOOL_IDS.GET_ARTICLE),
  {
    id: z
      .union([z.string(), z.number()])
      .describe("The ID of the article to retrieve."),
    locale: z
      .string()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe(
        "The locale of the article to retrieve. For example, 'en-us' or 'ja'."
      ),
  },
  async ({ id, locale }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/articles/${id}.json`;
    const params: any = {};
    if (locale) params.locale = locale;
    const response = await axios.get(url, { params });
    const article = response.data.article;
    const resultText = article
      ? i18n.t("itemDetails.articleFull", {
          title: article.title,
          url: article.html_url,
          body: article.body,
        })
      : i18n.t("messages.articleNotFound"); // Note: Singular key for a single article
    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // 標準出力すると MCPのやり取りを邪魔するのでエラーで表示する
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
