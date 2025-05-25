import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import i18n from './i18n';

// Zendeskサブドメインを環境変数から取得
const ZENDESK_SITE_DOMAIN =
  process.env.ZENDESK_SITE_DOMAIN || "subdomain.zendesk.com";
const ZENDESK_DEFAULT_LOCALE = i18n.language;

// MCPサーバーインスタンス
export const server = new McpServer({
  name: "zendesk-mcp-server",
  version: "1.0.0",
  description: i18n.t('serverDescription'),
});

// カテゴリ一覧取得
server.tool(
  "zendesk_list_categories",
  i18n.t('toolDescriptions.zendesk_list_categories'),
  {
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("language（e.g. ja, en-us）"),
    sort_by: z.enum(["position", "created_at", "updated_at"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
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
        ? i18n.t('error.categoriesNotFound')
        : categories
            .map(
              (c: any) =>
                i18n.t('categoryDetails', { id: c.id, name: c.name, description: c.description, url: c.html_url })
            )
            .join("\n");
    return {
      content: [{ type: "text", text: resultText }],
    };
  }
);

// セクション一覧取得（カテゴリ指定）
server.tool(
  "zendesk_list_sections_in_category",
  i18n.t('toolDescriptions.zendesk_list_sections_in_category'),
  {
    category_id: z.union([z.string(), z.number()]).describe("カテゴリID"),
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("language（e.g. ja, en-us）"),
    sort_by: z.enum(["position", "created_at", "updated_at"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
    per_page: z.number().max(100).optional().describe("1ページあたりの件数"),
    page: z.number().optional().describe("ページ番号"),
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
        ? i18n.t('error.sectionsNotFound')
        : sections
            .map(
              (s: any) =>
                i18n.t('sectionDetails', { id: s.id, name: s.name, description: s.description, url: s.html_url })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (sections.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return i18n.t('paginationInfo', { pageTotal, pageCurrent, perPage }) + "\n\n";
    })();
    return {
      content: [{ type: "text", text: paginationText + resultText }],
    };
  }
);

// カテゴリ内の記事一覧取得（カテゴリ指定）
server.tool(
  "zendesk_get_articles_in_category",
  i18n.t('toolDescriptions.zendesk_get_articles_in_category'),
  {
    category_id: z.union([z.string(), z.number()]).describe("カテゴリID"),
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("language（e.g. ja, en-us）"),
    sort_by: z.enum(["position", "created_at", "updated_at"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
    per_page: z.number().max(100).optional().describe("1ページあたりの件数"),
    page: z.number().optional().describe("ページ番号"),
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
        ? i18n.t('error.articlesNotFound')
        : articles
            .map(
              (a: any) =>
                i18n.t('articleDetailsSimple', { id: a.id, title: a.title, url: a.html_url, snippet: a.snippet || "" })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (articles.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return i18n.t('paginationInfo', { pageTotal, pageCurrent, perPage }) + "\n\n";
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
  "zendesk_get_articles_in_section",
  i18n.t('toolDescriptions.zendesk_get_articles_in_section'),
  {
    section_id: z.union([z.string(), z.number()]).describe("セクションID"),
    locale: z
      .string()
      .nonempty()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("language（e.g. ja, en-us）"),
    sort_by: z.enum(["position", "created_at", "updated_at"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
    per_page: z.number().max(100).optional().describe("1ページあたりの件数"),
    page: z.number().optional().describe("ページ番号"),
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
        ? i18n.t('error.articlesNotFound')
        : articles
            .map(
              (a: any) =>
                i18n.t('articleDetailsSimple', { id: a.id, title: a.title, url: a.html_url, snippet: a.snippet || "" })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (articles.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return i18n.t('paginationInfo', { pageTotal, pageCurrent, perPage }) + "\n\n";
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
  "zendesk_search_articles",
  i18n.t('toolDescriptions.zendesk_search_articles'),
  {
    query: z.string().nonempty().describe("検索キーワード"),
    locale: z
      .string()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("language（e.g. ja, en-us）"),
    per_page: z.number().max(100).optional().describe("1ページあたりの件数"),
    page: z.number().optional().describe("ページ番号"),
  },
  async ({ query, locale, per_page, page }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/articles/search.json`;
    const params: any = { query };
    if (locale) params.locale = locale;
    if (per_page) params.per_page = per_page;
    if (page) params.page = page;
    const response = await axios.get(url, { params });
    // 検索結果（タイトル＋URL＋抜粋）をテキストでまとめる
    const articles = response.data.articles || [];
    const resultText =
      articles.length === 0
        ? i18n.t('error.articlesNotFound')
        : articles
            .map(
              (a: any) =>
                i18n.t('articleDetailsSimple', { id: a.id, title: a.title, url: a.html_url, snippet: a.snippet || "" })
            )
            .join("\n");
    const paginationText = ((): string => {
      if (articles.length === 0) return "";
      const pageCurrent = response.data.page;
      const pageTotal = response.data.page_count;
      const perPage = response.data.per_page;
      return i18n.t('paginationInfo', { pageTotal, pageCurrent, perPage }) + "\n\n";
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
  "zendesk_get_article",
  i18n.t('toolDescriptions.zendesk_get_article'),
  {
    id: z.union([z.string(), z.number()]).describe("記事ID"),
    locale: z
      .string()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("language（e.g. ja, en-us）"),
  },
  async ({ id, locale }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/articles/${id}.json`;
    const params: any = {};
    if (locale) params.locale = locale;
    const response = await axios.get(url, { params });
    const article = response.data.article;
    const resultText = article
      ? i18n.t('articleDetailsFull', { title: article.title, url: article.html_url, body: article.body })
      : i18n.t('error.articleNotFound'); // Note: Singular key for a single article
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
