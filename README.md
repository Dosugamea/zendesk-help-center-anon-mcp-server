# zendesk-help-center-mcp-server

Zendesk HelpCenter API (匿名ユーザー認証) で 様々な情報を取得できる MCP サーバー (非公式)

## 提供ツール

- **`zendesk_list_categories`**
  - **説明:**
    - Zendesk Help Centerのカテゴリ一覧を取得します。
  - **パラメータ:**
    - `locale` (オプション): 言語（例: ja, en-us、デフォルトは環境変数 `ZENDESK_DEFAULT_LOCALE`）
    - `sort_by` (オプション): ソート基準（`position`, `created_at`, `updated_at` のいずれか）
    - `sort_order` (オプション): ソート順（`asc`, `desc` のいずれか）
  - **戻り値:**
    - テキスト形式のカテゴリ一覧（ID, 名前, 説明, URL）
- **`zendesk_list_sections_in_category`**
  - **説明:**
    - Zendesk Help CenterのカテゴリID配下のセクション一覧を取得します。
  - **パラメータ:**
    - `category_id` (必須): カテゴリID (文字列または数値)
    - `locale` (オプション): 言語（例: ja, en-us、デフォルトは環境変数 `ZENDESK_DEFAULT_LOCALE`）
    - `sort_by` (オプション): ソート基準（`position`, `created_at`, `updated_at` のいずれか）
    - `sort_order` (オプション): ソート順（`asc`, `desc` のいずれか）
    - `per_page` (オプション): 1ページあたりの件数（最大100）
    - `page` (オプション): ページ番号
  - **戻り値:**
    - テキスト形式のセクション一覧（ID, 名前, 説明, URL）とページネーション情報
- **`zendesk_get_articles_in_category`**
  - **説明:**
    - Zendesk Help CenterのカテゴリID配下の記事一覧を取得します。
  - **パラメータ:**
    - `category_id` (必須): カテゴリID (文字列または数値)
    - `locale` (オプション): 言語（例: ja, en-us、デフォルトは環境変数 `ZENDESK_DEFAULT_LOCALE`）
    - `sort_by` (オプション): ソート基準（`position`, `created_at`, `updated_at` のいずれか）
    - `sort_order` (オプション): ソート順（`asc`, `desc` のいずれか）
    - `per_page` (オプション): 1ページあたりの件数（最大100）
    - `page` (オプション): ページ番号
  - **戻り値:**
    - テキスト形式の記事一覧（ID, タイトル, URL, 抜粋）とページネーション情報
- **`zendesk_get_articles_in_section`**
  - **説明:**
    - Zendesk Help CenterのセクションID配下の記事一覧を取得します。
  - **パラメータ:**
    - `section_id` (必須): セクションID (文字列または数値)
    - `locale` (オプション): 言語（例: ja, en-us、デフォルトは環境変数 `ZENDESK_DEFAULT_LOCALE`）
    - `sort_by` (オプション): ソート基準（`position`, `created_at`, `updated_at` のいずれか）
    - `sort_order` (オプション): ソート順（`asc`, `desc` のいずれか）
    - `per_page` (オプション): 1ページあたりの件数（最大100）
    - `page` (オプション): ページ番号
  - **戻り値:**
    - テキスト形式の記事一覧（ID, タイトル, URL, 抜粋）とページネーション情報
- **`zendesk_search_articles`**
  - **説明:**
    - ZenDesk Help Centerの記事をキーワードで検索します。
  - **パラメータ:**
    - `query` (必須): 検索キーワード (文字列)
    - `locale` (オプション): 言語（例: ja, en-us、デフォルトは環境変数 `ZENDESK_DEFAULT_LOCALE`）
    - `per_page` (オプション): 1ページあたりの件数（最大100）
    - `page` (オプション): ページ番号
  - **戻り値:**
    - テキスト形式の検索結果（ID, タイトル, URL, 抜粋）とページネーション情報
- **`zendesk_get_article`**
  - **説明:**
    - ZenDesk Help Centerの記事IDから記事詳細を取得します。
  - **パラメータ:**
    - `id` (必須): 記事ID (文字列または数値)
    - `locale` (オプション): 言語（例: ja, en-us、デフォルトは環境変数 `ZENDESK_DEFAULT_LOCALE`）
  - **戻り値:**
    - テキスト形式の記事詳細情報（タイトル, URL, 本文）

## 環境変数

このサーバーは以下の環境変数をサポートしています。

- **`ZENDESK_SITE_DOMAIN`** (オプション):
  - Zendeskヘルプセンターのサブドメインを指定します。例: `yoursubdomain.zendesk.com`。
  - 指定しない場合、デフォルト値の `subdomain.zendesk.com` が使用されます。
- **`ZENDESK_DEFAULT_LOCALE`** (オプション):
  - ツールが使用するデフォルトのロケール（言語）を指定します。例: `ja` または `en-us`。
  - 指定しない場合、デフォルト値の `ja` が使用されます。


## インストール

### 手順

### ビルド済みイメージを使う場合

```
docker pull dosugamea/zendesk-help-center-mcp-server:1.0.0
```

### 手動ビルドする場合

```
# リポジトリをコピー
git clone
# ビルド(Docker)
docker build -t ms-creator-mcp-server:1.0.0 .
```

### エディタへの設定例

VSCode Copilot Agent の場合

```json
{
  "mcp": {
    "servers": {
      "zendesk-help-center-mcp-server": {
        "type": "stdio",
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "dosugamea/zendesk-help-center-mcp-server:1.0.0"
        ]
      }
    }
  }
}
```

Cursor の場合

```json
{
  "mcpServers": {
    "zendesk-help-center-mcp-server": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "dosugamea/zendesk-help-center-mcp-server:1.0.0"]
    }
  }
}
```

## ライセンス

本ソフトウェアは、MIT ライセンスの下で配布されています。

## 免責事項

本ソフトウェアは、公式な製品ではなく、個人で MCP サーバーの研究を目的に趣味で作られたものです。内容が正しいことは保証されず、使用に関しては自己責任でお願いします。本ソフトウェアを使用したことによるいかなる損害についても、作者は責任を負いません。