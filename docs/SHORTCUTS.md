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

## レシピ1: iPhoneアクションボタン（最優先）

### 音声で一言インプット
1. **ショートカット** アプリで新規ショートカットを作成
2. 以下のアクションを順に追加：
   - **「音声入力」** アクション → 言語を「日本語」か「英語」に設定
     - *Tips: 英語を拾いたい場面が多いなら English、日本語メモ用途なら日本語*
   - **「URLを取得」** アクション
     - URL: Apps Script の Webアプリ URL
   - **「URLの内容を取得」** アクション
     - 方法: `POST`
     - ヘッダー: `Content-Type: text/plain;charset=utf-8`
     - 本文をJSONに切り替え...できないので、**本文は「ファイル」** で、下のテキストアクションに「以下のテキストを JSON にする」形で指定
     - 以下の文字列を本文に：
       ```json
       {"action":"quickCapture","text":"<音声入力の結果>","source":"voice","srcLang":"en"}
       ```
     - `<音声入力の結果>` はマジック変数で埋める
3. ショートカットを保存
4. **設定 > アクションボタン > ショートカット** でこのショートカットを割り当て

これで、アクションボタン長押し → 一言 → 自動保存、という流れになります。

### テキストベースでインプット
音声入力の代わりに **「入力を要求」** アクションを使えばテキスト入力版になります。SiriキーボードでもOK。

---

## レシピ2: Apple Watch コンプリケーション

1. iPhone でレシピ1と同じショートカットを作成
2. ショートカットの **「詳細」** → **「Apple Watchに表示」** を ON
3. Apple Watch の文字盤を長押し → コンプリケーション追加 → **ショートカット** 選択 → 作成したショートカットを選ぶ
4. 文字盤からタップすると Watch 上で音声入力が立ち上がる

**Note**: Watch 単体では Apps Script の URL を叩けない場合、「iPhone 経由で実行」に設定してください。

---

## レシピ3: macOS Alfred（クエリ検索風）

Alfred の **Script Filter** または **Workflow** を使います。

### 手っ取り早いワークフロー
1. Alfred Preferences > Workflows > 新規 > Blank Workflow
2. **Keyword** トリガーを追加: `cap {query}`
3. **Run Script** アクション（言語: `/bin/bash`）に以下を設定:
   ```bash
   GAS_URL="https://script.google.com/macros/s/AKfycbx.../exec"
   curl -sL -X POST "$GAS_URL" \
     -H "Content-Type: text/plain;charset=utf-8" \
     --data "{\"action\":\"quickCapture\",\"text\":\"{query}\",\"source\":\"shortcut\"}"
   ```
4. **Post Notification** アクションをつなげて通知を表示

使用例: Alfred で `cap make ends meet` と打って Enter → 保存完了通知

### Mac OS 標準 Spotlight から使いたい場合
Automator で Quick Action を作成 → AppleScript で `do shell script "curl ..."` を実行 → Services メニューから呼べる。詳細が必要なら別途。

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
