import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
// Zendeskサブドメインを環境変数から取得
const ZENDESK_SITE_DOMAIN =
  process.env.ZENDESK_SITE_DOMAIN || "subdomain.zendesk.com";
const ZENDESK_DEFAULT_LOCALE = process.env.ZENDESK_DEFAULT_LOCALE || "ja";

// MCPサーバーインスタンス
export const server = new McpServer({
  name: "zendesk-mcp-server",
  version: "1.0.0",
  description: "Zendesk Help Center API MCP Toolサーバー",
});

// カテゴリ一覧取得
server.tool(
  "zendesk_list_categories",
  "Zendesk Help Centerのカテゴリ一覧を取得します。",
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
        ? "カテゴリが見つかりませんでした。"
        : categories
            .map(
              (c: any) =>
                `ID: ${c.id}\n名前: ${c.name}\n説明: ${c.description}\nURL: ${c.html_url}\n---`
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
  "Zendesk Help CenterのカテゴリID配下のセクション一覧を取得します。",
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
  },
  async ({ category_id, locale, sort_by, sort_order }) => {
    const url = `https://${ZENDESK_SITE_DOMAIN}/api/v2/help_center/${locale}/categories/${category_id}/sections.json`;
    const params: any = {};
    if (sort_by) params.sort_by = sort_by;
    if (sort_order) params.sort_order = sort_order;
    const response = await axios.get(url, { params });
    const sections = response.data.sections || [];
    const resultText =
      sections.length === 0
        ? "セクションが見つかりませんでした。"
        : sections
            .map(
              (s: any) =>
                `ID: ${s.id}\n名前: ${s.name}\n説明: ${s.description}\nURL: ${s.html_url}\n---`
            )
            .join("\n");
    return {
      content: [{ type: "text", text: resultText }],
    };
  }
);

// 記事検索Tool
server.tool(
  "zendesk_search_articles",
  "ZenDesk Help Centerの記事をキーワードで検索します。queryに検索キーワードを指定してください。",
  {
    query: z.string().nonempty().describe("検索キーワード"),
    locale: z
      .string()
      .optional()
      .default(ZENDESK_DEFAULT_LOCALE)
      .describe("language（e.g. ja, en-us）"),
    per_page: z.number().optional().describe("1ページあたりの件数"),
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
        ? "該当する記事が見つかりませんでした。"
        : articles
            .map(
              (a: any) =>
                `タイトル: ${a.title}\nURL: ${a.html_url}\n抜粋: ${
                  a.snippet || ""
                }\n---`
            )
            .join("\n");
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

// 記事詳細取得Tool
server.tool(
  "zendesk_get_article",
  "ZenDesk Help Centerの記事IDから記事詳細を取得します。idに記事IDを指定してください。localeも指定可能です。",
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
      ? `タイトル: ${article.title}\nURL: ${article.html_url}\n本文:\n${article.body}`
      : "記事が見つかりませんでした。";
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
