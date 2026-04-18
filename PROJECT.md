# AI翻訳 - Gemini Translator

## 概要

日常で遭遇する英語（あるいは任意のターゲット言語）表現を素早く翻訳し、学習カードとして蓄積、空き時間でフラッシュカード学習する個人用 Web アプリ。

「わからなかった表現」に出会った瞬間にショートカット経由などでキャプチャし、あとでまとめて整理・学習するサイクルを回すことを目的に設計。

## 公開URL

**https://koheimorita-localmade.github.io/myfirsttest/**

`main` ブランチにpushすると GitHub Pages が自動デプロイ。

## 技術スタック

| レイヤー | 採用技術 |
|---|---|
| フロント | Vanilla JS + HTML + CSS（ビルドステップなし、静的配信） |
| ホスティング | GitHub Pages（`main` ブランチから配信、GitHub Actions で自動デプロイ） |
| バックエンド | Google Apps Script Web App（デプロイ種別: ウェブアプリ） |
| データベース | Google Sheets（シート3枚: `pairs` / `scores` / `inbox`） |
| AI | Gemini 2.5 Flash（翻訳 / 品詞判定 / 例文生成 / 学習メモ / OCR） |
| 音声 | Web Speech API（SpeechRecognition / SpeechSynthesis） |

## ディレクトリ構成

```
/
├── index.html              # 全UI（翻訳/学習/カード/受信の各ビューを包含）
├── style.css               # 全スタイル
├── app.js                  # アプリロジック（約3,100行、ドメインごとにセクション分割）
├── apps_script/
│   ├── Code.gs             # GAS Web App ソース（pairs/scores/inboxのCRUD）
│   └── README.md           # GAS デプロイ手順
├── docs/
│   └── SHORTCUTS.md        # iOSショートカット / Alfred 連携レシピ
├── .github/workflows/
│   └── pages.yml           # GitHub Pages デプロイワークフロー
├── PROJECT.md              # この文書
├── AGENTS.md               # 全AIエージェント共通ルール
├── CLAUDE.md               # Claude Code 専用の指示
└── DEVLOG.md               # 開発ログ（時系列）
```

## 主要機能

### 翻訳モード
- 4スタイル翻訳（Normal / Casual / Formal / Advanced）を段階的ロードで表示
- 学習メモ（翻訳元 or 翻訳先の文法を日本人学習者向けに解説、言語ペアで視点を自動切替）
- 文脈・補足フィールド（折りたたみ式、入力時はプロンプトと学習メモに反映）
- 入力チャンネル: テキスト / ファイル / カメラ / 音声 / クリップボード貼り付け
- 翻訳結果の TTS 読み上げ、クリップボードコピー
- お気に入り言語の素早い切り替え（ピルボタン）

### 学習モード
- SM-2 簡易版アルゴリズムによる間隔反復
- 言語ペア選択 + 方向（A→B / B→A）切替、方向ごとに別スコア管理
- 問題・答えの TTS 自動再生
- 3段階フィードバック（わからない/時間かかった/覚えた）
- 自動再生モード（TTS連鎖 + カウントダウン、設定で秒数変更可）
- 音声フィードバック（自動再生中に「覚えた」等の発話で回答、ハンズフリー）
- 学習中のカードを即編集できる「編集」ボタン（編集後は「学習に戻る」）
- 答え表示時に品詞・例文・文脈を併記（例文は TTS 自動再生）

### カード管理
- 一覧・検索・編集・削除
- カード編集モーダル: テキスト/品詞/例文/文脈/スタイル、AI再生成、方向別スコア表示、進捗リセット
- 選択モードでの一括削除
- 個別ゴミ箱ボタン

### 受信箱 (Inbox)
- 外部ツール（iOSショートカット / Alfred等）からの `quickCapture` API で素のテキストを蓄積
- NEW/既読の状態管理（localStorage）
- 各アイテムを「翻訳する」でフル翻訳フローへ、保存時に inbox から自動削除
- 選択一括削除、個別削除
- ナビに未読件数バッジ

### マルチチャンネル・キャプチャ
- `?capture=<text>` URL パラメータ → 翻訳画面で自動翻訳
- `quickCapture` API → inbox に素のまま投入（fire-and-forget）
- 詳細レシピは [docs/SHORTCUTS.md](docs/SHORTCUTS.md)

## データモデル

### pairs シート（学習カード）
| カラム | 意味 |
|---|---|
| id | UUID |
| pairKey | 正規化した言語ペア（アルファベット順、例: `en-ja`） |
| langA, textA | アルファベット順で先の言語とテキスト |
| langB, textB | 後の言語とテキスト |
| style | 保存時のスタイル（normal/casual/formal/advanced/extract:normal等） |
| createdAt | ISO8601 |
| partOfSpeech | 品詞（名詞/動詞/句/文 等） |
| example | ターゲット言語の例文 |
| context | 文脈・補足（任意） |

### scores シート（SM-2スコア、方向別）
| カラム | 意味 |
|---|---|
| pairId | pairs.id への参照 |
| direction | `a_to_b` / `b_to_a` |
| easeFactor | SM-2 の ef（1.3〜3.0） |
| interval | 次回出題までの間隔（日） |
| nextReview | 次回復習日時（ISO8601） |
| lastReviewed | 前回復習日時 |
| repetitions | 復習回数 |

### inbox シート（未処理キャプチャ）
| カラム | 意味 |
|---|---|
| id | UUID |
| text | キャプチャされた素のテキスト |
| srcLang | 言語ヒント（未指定可） |
| note | メモ（任意） |
| source | 取得元ラベル（voice/clipboard/screenshot/manual/shortcut/alfred等） |
| createdAt | ISO8601 |
| processed | 処理済みフラグ（現状フロント側では削除で運用） |

## デプロイフロー

### フロントエンド
1. ローカルで `index.html` / `style.css` / `app.js` を編集
2. `git push origin main`
3. GitHub Actions が自動でビルド・デプロイ（通常1〜2分）

### Apps Script（変更時のみ）
1. `apps_script/Code.gs` を編集
2. Apps Script エディタ（スプレッドシートから「拡張機能 > Apps Script」）でコードを全置換
3. 「デプロイ > デプロイを管理 > 鉛筆アイコン > バージョン: 新しいバージョン > デプロイ」
4. URL は変わらないのでアプリ側の設定変更は不要

## ユーザー側の初期設定

アプリを初めて開いた時、以下の入力が必要（全て localStorage に保存）：
1. **Gemini APIキー** — [Google AI Studio](https://aistudio.google.com/apikey) から取得
2. **学習DBのURL** — 自分でデプロイした GAS Web App の URL

詳細は設定モーダル内のヒントに記載。

## 関連ドキュメント

- [AGENTS.md](AGENTS.md) — AIエージェント向けの共通ルール
- [CLAUDE.md](CLAUDE.md) — Claude Code 専用の指示
- [DEVLOG.md](DEVLOG.md) — 開発ログ
- [apps_script/README.md](apps_script/README.md) — GAS デプロイ手順
- [docs/SHORTCUTS.md](docs/SHORTCUTS.md) — マルチチャンネル連携レシピ
