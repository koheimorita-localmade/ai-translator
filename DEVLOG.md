# 開発ログ

新しいエントリを **先頭に追加**（新しい順）。

---

### 2026-04-19 — ゲームモード判定改善・翻訳autoバグ修正 (v1.5→v1.7)

- **Agent**: Claude

### What was done
- **v1.5** (前セッション): 翻訳「自動→自動」で日本語→日本語出力バグ修正（`resolvedTgtName`を正しく解決）、ゲーム判定をローカルsubstring matchに変更しGeminiは品質スコアのみ担当
- **v1.6**: `isJapaneseText`が漢字（`\u4E00-\u9FFF`）を未検出だったバグ修正（「桜」等の単漢字が日本語認識されず日→日翻訳になっていた）。iOSでSpeech Recognitionの`isFinal`が発火しない問題に対し、interim結果へ700msデバウンスを追加
- **v1.7**: ゲーム判定にLevenshtein距離ベースのファジーマッチを追加。発音ゆらぎで音声認識結果が微妙にずれても判定が通るよう緩和。ルール：4文字以下は頭文字一致+1文字差、5〜8文字は1文字差、9文字以上は2文字差

### Current state
- ゲームモード: 動作確認済み（iOS含む）。判定・落下速度・文カード除外すべて正常
- 翻訳モード: 自動検出（漢字含む）→英語出力が正常化
- v1.7で発音ゆらぎへの対応完了

### Next steps
- [ ] ゲームプレイを継続テストし、ファジーマッチの緩さ/厳しさを調整
- [ ] 日→英ゲームモード実装（日本語カードが表示され英語で作文）
- [ ] 英単語/フレーズカードが少ない場合のDB補充

### Open issues
- リモートブランチ `origin/claude/iphone-calculator-currency-HOir9` が残存（削除未対応）
- iOS: `isFinal`が発火しないケースへのデバウンス対応は暫定。完全解決にはより深いSpeech API調査が必要

---

### 2026-04-18 — ワークフロー用プロジェクト管理ファイル整備

- **Agent**: Claude
- **やったこと**:
  - 不要ブランチの整理: `claude/iphone-calculator-currency-HOir9` と `version/v2-progressive` を削除（ローカル完了、リモートは権限エラーで後日Mac側対応）
  - `PROJECT.md` / `AGENTS.md` / `CLAUDE.md` / `DEVLOG.md` の4ファイルを新規作成
  - プロジェクトの新しいワークフロー（/project-init, /checkpoint, /resume スキル想定）に沿った構成
- **なぜ**:
  - GitHub Webでの開発から Mac ローカル（Google Drive上のフォルダ）に移行するため
  - セッション履歴依存から脱却し、ファイルベースでプロジェクトを管理する方針
  - 別エージェント（Codex 等）への引き継ぎを円滑化
- **次のタスク**:
  - Mac 側でリポジトリをクローンし、ローカル開発に切り替え
  - 移行後、`/project-init` スキルを実行して必要ならフォーマット微調整
  - リモートの不要ブランチ削除（Web側権限不足、Mac側で実行）
- **未解決課題**:
  - リモート `origin/claude/iphone-calculator-currency-HOir9` と `origin/version/v2-progressive` が削除できていない

---

### 2026-04-18 — 翻訳モードに文脈・補足フィールドを追加

- **Agent**: Claude
- **やったこと**:
  - 翻訳元テキストの下に折りたたみ式「文脈・補足」フィールドを追加
  - 文脈があれば全プロンプト（Normal / 3スタイル / 学習メモ）に反映
  - pairs シートに `context` カラムを追加（GAS auto-migration で自動追加）
  - 保存モーダル・カード編集モーダルに文脈フィールドを追加
  - 学習モードで答え表示時に文脈を 💭 アイコン付きで表示
- **なぜ**:
  - 「大丈夫でしたか？」のような抽象的なフレーズは状況次第で訳が変わる
  - 文脈を入れると訳文の精度と学習メモの価値が両方上がる
  - 後日カードを見返した時「なぜこの訳にしたか」が思い出せる
- **未解決課題**: なし

---

### 2026-04-18 — inboxからの処理も4スタイル翻訳に昇格

- **Agent**: Claude
- **やったこと**:
  - `processInboxItem` を書き換え、単発翻訳→保存モーダル直行から翻訳画面に遷移して `handleTranslate()` を再利用するフローに
  - ボタンラベルを「翻訳して保存」→「翻訳する」に変更
  - `pendingInboxItem` の安全装置強化（sourceText が inbox item と一致しない状態で保存した場合は誤削除しない）
  - `?capture=` URL からの自動 inbox 保存を撤去（翻訳結果が目の前に出るので重複フローだった）
- **なぜ**: inbox 経由でもフル機能（AI抽出、学習メモ、品詞・例文、スタイル選択）を使いたい

---

### 2026-04-18 — Alfred 連携: ?capture= URL スキーム

- **Agent**: Claude
- **やったこと**:
  - `?capture=<text>` URL パラメータを検出して翻訳画面に自動入力・自動翻訳
  - Alfred Custom Web Search のレシピを `docs/SHORTCUTS.md` に追加（方式A: 簡単版 / 方式B: Workflow）
- **なぜ**: macOS Alfred の Web Search 機能から `trans hello` のように打ち込むだけで翻訳画面が開くようにしたい

---

> 2026-04-11〜2026-04-18 の古いエントリは [devlog/2026-04.md](devlog/2026-04.md) にアーカイブ済み
