# NC File Merger

複数のNCファイル（Gコード）を結合するWebアプリケーションです。ツール番号の自動再マッピング、プレビュー機能、バリデーション、テンプレートシステムを搭載しています。

## 主な機能

### ✨ コア機能
- **複数ファイルの結合**: 複数のNCファイルを1つのファイルに結合
- **ツール番号再マッピング**: T番号の重複を検出し、自動的に番号を振り直す
- **プレビュー**: 結合前にファイルの統計情報と競合を確認
- **バリデーション**: Gコードの構文チェックとエラー検出
- **テンプレートシステム**: 複数のテンプレートから選択可能
- **履歴管理**: 過去の結合設定を保存・再利用

### 🎯 特徴
- **Webインターフェース**: ブラウザで簡単操作
- **ドラッグ&ドロップ対応**: ファイルを直感的にアップロード
- **リアルタイム検証**: アップロード時にファイルを自動検証
- **詳細な統計情報**: 各ファイルのGコード、Mコード、ツール数を表示

## インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd nc-file-merger

# 依存関係をインストール
npm install
```

## 使い方

### 開発モード

```bash
# Vite開発サーバー（http://localhost:5173）
npm run dev

# 別ターミナルでCloudflare Workers（http://localhost:8787）
npm run dev:worker
```

Viteの開発サーバーは `/api` へのリクエストを Cloudflare Workers (port 8787) にプロキシします。

### プロダクションビルド

```bash
# TypeScriptをビルド
npm run build

# Cloudflare Workers にデプロイ
npm run deploy
```

## Web UI の使い方

### 1. ファイルをアップロード
- 「クリックしてNCファイルを選択」をクリック、またはファイルをドロップ
- 複数ファイルを同時にアップロード可能

### 2. オプション設定
- **ファイル区切りコメント**: 各ファイルの境界にコメントを追加
- **ヘッダー保持**: プログラム番号（%、Oコード）を保持
- **ツール番号再マッピング**: 重複するT番号を自動的に振り直す（推奨）
- **テンプレート**: ヘッダー/フッターのテンプレートを選択

### 3. アクション
- **検証**: ファイルの構文をチェックし、統計情報を表示
- **プレビュー**: 結合前にファイル情報と競合を確認
- **結合してダウンロード**: ファイルを結合し、`merged.nc` としてダウンロード

## API エンドポイント

### POST /api/validate
ファイルを検証します。

**リクエスト:**
- Content-Type: `multipart/form-data`
- Body: `files` - NCファイル（複数可）

**レスポンス:**
```json
{
  "results": [
    {
      "filename": "sample1.nc",
      "validation": {
        "valid": true,
        "errors": [],
        "warnings": []
      },
      "stats": {
        "totalLines": 25,
        "codeLines": 18,
        "commentLines": 3,
        "emptyLines": 4,
        "gCodes": ["G0", "G1", "G17", ...],
        "mCodes": ["M3", "M5", "M6", "M30"],
        "tools": ["T1"]
      }
    }
  ]
}
```

### POST /api/preview
結合のプレビューを生成します。

**リクエスト:**
- Content-Type: `multipart/form-data`
- Body:
  - `files` - NCファイル（複数可）
  - `addComments` - コメント追加フラグ（true/false）
  - `preserveHeaders` - ヘッダー保持フラグ（true/false）
  - `remapTools` - ツール再マッピングフラグ（true/false）

**レスポンス:**
```json
{
  "fileStats": [
    {
      "filename": "sample1.nc",
      "lines": 25,
      "tools": ["T1"],
      "gCodes": ["G0", "G1", ...],
      "mCodes": ["M3", "M5", ...]
    }
  ],
  "conflicts": {
    "hasToolConflicts": true,
    "conflictingTools": ["T1"]
  },
  "estimatedOutputLines": 85
}
```

### POST /api/merge
ファイルを結合します。

**リクエスト:**
- Content-Type: `multipart/form-data`
- Body:
  - `files` - NCファイル（複数可）
  - `addComments` - コメント追加フラグ（true/false）
  - `preserveHeaders` - ヘッダー保持フラグ（true/false）
  - `remapTools` - ツール再マッピングフラグ（true/false）
  - `template` - テンプレート名（none/basic/fanuc/detailed/minimal）

**レスポンス:**
- Content-Type: `text/plain`
- 結合されたNCファイルの内容

### GET /api/templates
利用可能なテンプレート一覧を取得します。

**レスポンス:**
```json
{
  "templates": [
    {
      "name": "basic",
      "description": "Basic template with minimal header/footer",
      "header": "...",
      "footer": "..."
    }
  ]
}
```

### GET /api/health
ヘルスチェック

**レスポンス:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## プロジェクト構成

```
nc-file-merger/
├── src/
│   ├── client/
│   │   ├── App.tsx            # UIコンポーネント（Hono JSX）
│   │   ├── index.css          # フロントエンドのスタイル
│   │   └── main.tsx           # Viteエントリーポイント
│   └── server/
│       ├── index.ts           # Cloudflare Workers エントリーポイント（API）
│       ├── lib/
│       │   ├── nc-merger.ts   # NCファイル結合のコアロジック
│       │   ├── nc-validator.ts# Gコードバリデーター
│       │   └── tool-remapper.ts# ツール番号再マッピング
│       └── templates/
│           └── default.ts     # デフォルトテンプレート
├── samples/
│   ├── sample1.nc            # サンプルNCファイル1（ドリル加工）
│   ├── sample2.nc            # サンプルNCファイル2（ミーリング）
│   └── sample3.nc            # サンプルNCファイル3（仕上げ加工）
├── wrangler.toml             # Cloudflare Workers の設定
├── package.json
├── tsconfig.json
└── README.md
```

## サンプルファイル

`samples/` ディレクトリに3つのサンプルNCファイルが含まれています：

1. **sample1.nc**: ドリル加工（T1使用）
2. **sample2.nc**: ミーリング加工（T2使用）
3. **sample3.nc**: 仕上げ加工（T1使用、sample1と競合）

これらのファイルでツール番号再マッピングをテストできます。

## 技術スタック

- **Backend**: [Hono](https://hono.dev/) - 高速軽量Webフレームワーク
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Frontend**: Vite + Hono JSX + TypeScript
- **Storage**: LocalStorage（履歴管理）

## ツール番号再マッピングの仕組み

複数のNCファイルを結合する際、同じツール番号（T番号）が異なるファイルで使われている場合、競合が発生します。

**例:**
- sample1.nc: T1（ドリル）
- sample3.nc: T1（ボールエンドミル）

ツール番号再マッピングを有効にすると：
- sample1.nc: T1 → T1（変更なし）
- sample3.nc: T1 → T2（自動的に再マッピング）

結合後のファイルには、再マッピングテーブルがコメントとして追加されます。

## バリデーション機能

NCValidatorは以下のチェックを実行します：

**エラー検出:**
- 括弧の不一致
- 閉じられていないコメント

**警告検出:**
- GコードとM番号の間のスペース（例: "G 01" → "G01" を推奨）
- 座標なしの移動コマンド
- Gコードなしの送り速度指定

## ライセンス

MIT

## 開発者向け情報

### TypeScript型定義

すべてのコアモジュールは完全に型付けされています：

```typescript
import { NCMerger, MergeOptions, MergeResult } from './server/lib/nc-merger';
import { NCValidator, ValidationResult } from './server/lib/nc-validator';
import { ToolRemapper, ToolMapping } from './server/lib/tool-remapper';
```

### カスタムテンプレートの作成

```typescript
import { TemplateManager } from './server/lib/templates';

const manager = new TemplateManager();
manager.createCustomTemplate(
  'my-template',
  'My custom template',
  'Custom header',
  'Custom footer'
);
```

## トラブルシューティング

### ポート5173が使用中の場合 (Vite)

```bash
npm run dev -- --port 4000
```

### ポート8787が使用中の場合 (Workers)

`wrangler.toml` の `[dev]` セクションで `port` を変更してください。

### TypeScriptのビルドエラー

```bash
npm run build
```

エラーが表示される場合は、`node_modules`を削除して再インストール：

```bash
rm -rf node_modules package-lock.json
npm install
```

## コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## サポート

問題が発生した場合は、GitHubのissueを作成してください。
