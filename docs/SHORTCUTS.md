# マルチチャンネル・クイックキャプチャ

外部ツール（iOSショートカット / Alfred / ブックマークレット等）から、このアプリの学習DBに **素のテキスト** を瞬時に投入するためのガイドです。投入されたテキストは Web アプリの **「受信」タブ** に届き、空き時間に翻訳・登録できます。

---

## エンドポイント

### URL
Apps Script のウェブアプリURL（アプリの設定画面で登録した `学習DBのURL`）をそのまま使います。

例: `https://script.google.com/macros/s/AKfycbx.../exec`

### メソッド
`POST`

### ヘッダー
```
Content-Type: text/plain;charset=utf-8
```
(CORSプリフライトを避けるため text/plain を使います)

### ボディ（JSON文字列）
```json
{
  "action": "quickCapture",
  "text": "one after another",
  "srcLang": "en",
  "note": "YouTube で聞いた表現",
  "source": "voice"
}
```

| フィールド | 必須 | 説明 |
|---|---|---|
| `action` | ✅ | 必ず `quickCapture` |
| `text` | ✅ | 保存したいテキスト（単語〜1センテンス想定） |
| `srcLang` | 任意 | ISO 639-1 コード（`en` / `ja` / `zh` など）。未指定なら Webアプリ側で自動推定 |
| `note` | 任意 | コンテキスト（「友人との会話」「YouTubeで聞いた」など） |
| `source` | 任意 | 取得元のヒント。`voice` / `clipboard` / `screenshot` / `manual` / `shortcut` |

### レスポンス
```json
{ "success": true, "data": { "id": "abc-123", "created": true } }
```

---

## レシピ1: iPhoneアクションボタンから音声で一言保存（最優先）

**ゴール**: iPhone 15 Pro 以降のアクションボタンを長押し → 音声で「one after another」と言う → Webアプリの「受信」タブに自動で届く

> アクションボタンがない iPhone の場合は「設定 > アクセシビリティ > タッチ > 背面タップ」でも同じショートカットを呼び出せます。

---

### 準備: GAS URL をコピー

Webアプリで **歯車アイコン > 学習DBのURL** の文字列をそのままコピーしておきます。形式:
```
https://script.google.com/macros/s/AKfy...長い文字列.../exec
```

---

### ステップ 1: ショートカット作成

1. iPhone の **「ショートカット」アプリ** を開く
2. 「すべてのショートカット」画面の右上 **＋** をタップ（新規作成）
3. 下部の **検索バー（アクションを検索）** を使って、以下のアクションを **この順番** で追加していきます

---

#### アクションA: 音声入力を受け取る

- 検索バーに **`音声入力`** と入力 → **「テキストの音声入力」** をタップで追加
- 追加された行の **「言語」** 欄:
  - 英語を拾う想定なら **「英語」**
  - 日本語メモ用なら **「日本語」**
- **「停止するタイミング」**: `一時停止時` がおすすめ（しゃべり終わると自動で止まる）

> ✅ この時点でテストすると、タップ → しゃべる → 画面に聞き取られたテキストが出るはず（右上の ▶ で再生）

---

#### アクションB: URL に POST する

- 検索バーに **`URL`** と入力 → **「URL の内容を取得」** をタップで追加

追加された行の **「URL」** 欄に、準備でコピーした GAS URL を **貼り付け**。

次に、同じアクションの行の右端にある **「▶」** か **「表示を増やす」** をタップして詳細を展開し、以下を設定します。

**方法**: **`POST`** を選択

**ヘッダ**:
- 「ヘッダを追加」をタップ
- 「キー」欄に: `Content-Type`
- 「テキスト」欄に: `application/json`

**本文を要求**: **`JSON`** を選択

展開された **「JSON」ビルダー** で **「新規フィールド」** を 4 回タップして以下を埋めていきます：

| フィールドのタイプ | キー | 値 |
|---|---|---|
| **「テキスト」** | `action` | `quickCapture` |
| **「テキスト」** | `text` | ← ここだけ特別。下で説明 |
| **「テキスト」** | `source` | `voice` |
| **「テキスト」** | `srcLang` | `en`（日本語を拾う設定にした場合は `ja`） |

`text` フィールドの値欄の埋め方 ⚠ **ここがキモ**:

1. `text` フィールドの **値欄** をタップ
2. キーボードの上（変数サジェスト）に **「音声入力したテキスト」** という青い変数チップが出るのでそれをタップ
3. 値欄に青い **「音声入力したテキスト」** チップが挿入されれば成功
4. もし出てこない場合はキーボード下部の **変数アイコン（`x` のようなマーク）** をタップして、変数一覧から **「音声入力したテキスト」** を選ぶ

---

#### アクションC: 成功を通知（おすすめ）

- 検索バーに **`通知`** → **「通知を表示」** をタップで追加
- 本文欄に「**保存しました: **」と入力し、続けて変数サジェストから **「音声入力したテキスト」** を挿入
  → 「保存しました: one after another」のように表示される

---

### ステップ 2: 名前とアイコンを設定して保存

- 画面上部中央の **ショートカット名** をタップ
- 例: **「📝 英語フレーズを保存」** など分かりやすい名前に
- アイコンと色もここで変えられる
- 右上 **完了**

---

### ステップ 3: 動作テスト

ショートカット一覧から、作ったショートカットをタップ:

1. マイクが起動（Siri風のUI） → 「one after another」など発話
2. 止まるまで待つ → 自動で進行
3. 「保存しました: one after another」通知が出れば成功 🎉
4. Webアプリの **「受信」タブ** を開いて、該当アイテムが並んでいればOK

**失敗パターンの原因チェック:**

| 症状 | 原因候補 |
|---|---|
| 通知は出たがWebアプリに出ない | ヘッダ Content-Type のスペル、JSON フィールドのキー名（全て半角） |
| エラー画面が出る | GAS URL の貼り付けミス、Apps Script 側が最新版でない |
| `text` が空で届く | `text` フィールドに変数チップではなく **「音声入力したテキスト」という文字列** が入ってる |

---

### ステップ 4: アクションボタンに割り当て

1. iPhone の **設定** アプリを開く
2. **「アクションボタン」** をタップ
3. 横スワイプして **「ショートカット」** を選択
4. **「ショートカットを選択」** の **「選択」** リンクをタップ
5. 作成したショートカット（例: 📝 英語フレーズを保存）を選ぶ
6. 設定を閉じる

これで **本体側面のアクションボタンを長押し** → 音声入力 → 保存の流れがワンアクションで完結します。

---

### 発展: 複数ショートカットを1つのボタンに（英語保存 / 日本語保存 を切り替えたい場合）

アクションボタンは1つのショートカットしか割り当てられませんが、代わりに **ショートカットフォルダ** を割り当てるとメニューが出せます：

1. ショートカットアプリ左上 **「すべてのショートカット」** → 右上 **「…」** → **「新規フォルダ」**
2. フォルダ名を「英語学習」などに
3. そのフォルダ内に複数のショートカット（英語用・日本語用・クリップボード用...）を入れる
4. 設定 > アクションボタン > ショートカット → 「フォルダを選択」 → 作ったフォルダを選ぶ

これでアクションボタン押下時にフォルダ内のショートカット一覧が表示され、1タップで目的のものを起動できます。

---

## レシピ2: Apple Watch コンプリケーション

1. iPhone でレシピ1と同じショートカットを作成
2. ショートカットの **「詳細」** → **「Apple Watchに表示」** を ON
3. Apple Watch の文字盤を長押し → コンプリケーション追加 → **ショートカット** 選択 → 作成したショートカットを選ぶ
4. 文字盤からタップすると Watch 上で音声入力が立ち上がる

**Note**: Watch 単体では Apps Script の URL を叩けない場合、「iPhone 経由で実行」に設定してください。

---

## レシピ3: macOS Alfred（クエリ検索で翻訳 + 受信箱保存）

Alfred のタイプボックスに単語を打ち込むと、ブラウザで **Webアプリが開いて翻訳結果が表示され、同時に inbox にも自動保存** される仕組みです。`?capture=` URLパラメータが全部面倒見てくれるので、Alfred側の設定は最小限で済みます。

### 方式A: Alfred Custom Web Search（推奨・最もシンプル）

**セットアップ手順:**

1. Alfred Preferences を開く
2. **Features > Web Search > Add Custom Search**
3. 以下を設定:

   | 項目 | 値 |
   |---|---|
   | **Search URL** | `https://koheimorita-localmade.github.io/myfirsttest/?capture={query}` |
   | **Title** | `Translate "{query}"` (任意) |
   | **Keyword** | `trans` (好みで) |
   | **Validation based on** | `None` |

4. **Save** をクリック

**使い方:**

1. Alfred を起動（通常は `⌥Space`）
2. `trans continuously` と入力 → Enter
3. ブラウザに Webアプリが開く
4. `continuously` が翻訳元に入力済み → 自動で翻訳実行
5. 翻訳結果が表示されると同時に **受信箱にも保存** される
6. そのまま閉じれば後で処理可能、「保存」を押せば即カード化（inboxアイテムは自動削除）

**挙動の詳細:**

- URL パラメータ `capture` を検知すると、アプリが自動で翻訳画面に切り替え
- Gemini APIキーが設定済みなら自動翻訳を発火
- GAS URL が設定済みなら裏でinboxにも `quickCapture` で保存
- `showToast("受信箱に保存しました")` の通知が出る
- 処理後は URL の `capture` パラメータが自動削除される（リロードで2重投入されない）

### 方式B: Alfred Workflow で結果をAlfred内に表示（発展形）

ブラウザを開かずに Alfred の Large Type で翻訳結果を見たい場合の発展形。スクリプトで Gemini を直接叩きます。

<details>
<summary>手順を開く</summary>

1. Alfred Preferences > **Workflows** > 新規 Blank Workflow
2. **Inputs > Keyword** を追加: `tr {query}`
3. **Actions > Run Script** を接続、言語 `/bin/bash`:

   ```bash
   API_KEY="YOUR_GEMINI_API_KEY"
   GAS_URL="https://script.google.com/macros/s/.../exec"
   QUERY="{query}"

   # 1. 翻訳をGeminiから取得
   PROMPT="Translate to Japanese if the text is in English, otherwise to English. Output ONLY the translation.\n\n$QUERY"
   TRANSLATION=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$API_KEY" \
     -H 'Content-Type: application/json' \
     -d "{\"contents\":[{\"parts\":[{\"text\":\"$PROMPT\"}]}]}" \
     | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['candidates'][0]['content']['parts'][0]['text'].strip())")

   # 2. 同時にinbox保存
   curl -sL -X POST "$GAS_URL" \
     -H 'Content-Type: text/plain;charset=utf-8' \
     --data "{\"action\":\"quickCapture\",\"text\":\"$QUERY\",\"source\":\"alfred\"}" > /dev/null

   # 3. 結果を返す (Alfred Large Type で表示される)
   echo "$TRANSLATION"
   ```
4. **Outputs > Large Type** を接続 → スクリプトの標準出力が巨大表示される
5. （オプション）**Outputs > Copy to Clipboard** も接続 → Cmd+V で貼り付けもできる

**使い方:** Alfred で `tr continuously` → Enter → Alfred が Gemini 呼んで翻訳を Large Type 表示、裏でinboxにも保存。

**注意**: スクリプト内に APIキーを直書きすることになるので、Workflow自体の管理は慎重に。環境変数を使う工夫もあり。

</details>

### どちらを選ぶ？

| 方式 | 手軽さ | 翻訳表示 | 学習カード化までの距離 |
|---|---|---|---|
| **A: Custom Web Search** | ★★★（設定3分） | ブラウザ | ブラウザで「保存」ワンタップ |
| **B: Workflow** | ★（スクリプト必要） | Alfred内Large Type | 保存は自動、カード化は後で |

**まずは方式Aで試す** のがおすすめ。ブラウザが開くのが鬱陶しくなったら方式Bへ。

---

## レシピ4: スクショ → OCR → 保存

既存のショートカット（スクショから分析）を拡張します。

1. **スクリーンショット** を撮る（または**「スクリーンショットを撮る」** アクション）
2. **「画像のテキストを抽出」** アクション（iOS/macOS 標準）
3. **「URLの内容を取得」** で `quickCapture` にPOST
4. `source` には `"screenshot"` を設定

---

## レシピ5: ブラウザ側（PC）

### ブックマークレット（簡易）

以下を URL にしてブックマークバーに登録：

```javascript
javascript:(function(){
  const t = window.getSelection().toString() || prompt("保存するテキスト");
  if (!t) return;
  const url = "https://script.google.com/macros/s/YOUR_ID/exec";
  fetch(url, {
    method: "POST",
    headers: {"Content-Type": "text/plain;charset=utf-8"},
    body: JSON.stringify({action:"quickCapture", text:t, source:"clipboard"})
  }).then(()=>alert("保存しました"));
})();
```

ページ上で文字を選択してブックマークをクリック → 保存

---

## 動作確認

ターミナルから直接叩けます（URLはご自身のものに）：

```bash
curl -X POST "https://script.google.com/macros/s/.../exec" \
  -H "Content-Type: text/plain;charset=utf-8" \
  --data '{"action":"quickCapture","text":"test phrase","source":"manual"}'
```

成功レスポンス:
```json
{"success":true,"data":{"id":"...","created":true}}
```

その後、Webアプリの **「受信」タブ** を開くと一覧に出てくれば成功です。
