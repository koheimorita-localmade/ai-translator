// ============================================================
// AI翻訳 学習DB - Google Apps Script Web App
// ============================================================
// このファイルの中身をまるごと Apps Script エディタに貼り付けてください。
// スプレッドシートの [拡張機能] > [Apps Script] から開けます。
//
// デプロイ設定:
//   - 種類: ウェブアプリ
//   - 実行するユーザー: 自分
//   - アクセスできるユーザー: 全員
// ============================================================

const SHEET_PAIRS = "pairs";
const SHEET_SCORES = "scores";
const SHEET_INBOX = "inbox";
const SHEET_DECKS = "decks";

const PAIRS_HEADERS = ["id", "pairKey", "langA", "textA", "langB", "textB", "style", "createdAt", "partOfSpeech", "example", "context", "deck"];
const SCORES_HEADERS = ["pairId", "direction", "easeFactor", "interval", "nextReview", "lastReviewed", "repetitions"];
const INBOX_HEADERS = ["id", "text", "srcLang", "note", "source", "createdAt", "processed"];
const DECKS_HEADERS = ["id", "name", "createdAt"];

// ---------- Entry points ----------

function doGet(e) {
  const params = e.parameter || {};
  return handleRequest(params.action, params);
}

function doPost(e) {
  let params = {};
  try {
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else {
      params = e.parameter || {};
    }
  } catch (err) {
    params = e.parameter || {};
  }
  return handleRequest(params.action, params);
}

function handleRequest(action, params) {
  try {
    ensureHeaders();
    let result;
    switch (action) {
      case "ping":        result = { ok: true, time: new Date().toISOString() }; break;
      case "listAll":     result = { pairs: listPairs(), scores: listScores(), inbox: listInbox(), decks: listDecks() }; break;
      case "listPairs":   result = listPairs(); break;
      case "listScores":  result = listScores(); break;
      case "savePair":    result = savePair(params.pair); break;
      case "updatePair":  result = updatePair(params.pair); break;
      case "deletePair":  result = deletePair(params.id); break;
      case "updateScore": result = updateScore(params.score); break;
      case "deleteScore": result = deleteScoreByDirection(params.pairId, params.direction); break;

      // Inbox (quick capture)
      case "quickCapture":    result = quickCapture(params); break;
      case "listInbox":       result = listInbox(); break;
      case "deleteInboxItem": result = deleteInboxItem(params.id); break;
      case "markInboxProcessed": result = markInboxProcessed(params.id); break;

      // Decks
      case "listDecks":   result = listDecks(); break;
      case "saveDeck":    result = saveDeck(params.deck); break;
      case "updateDeck":  result = updateDeck(params.deck); break;
      case "deleteDeck":  result = deleteDeck(params.id); break;

      default: throw new Error("Unknown action: " + (action || "(none)"));
    }
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err.message || err) });
  }
}

// ---------- Helpers ----------

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function ensureHeaders() {
  ensureSheetHeaders(SHEET_PAIRS, PAIRS_HEADERS);
  ensureSheetHeaders(SHEET_SCORES, SCORES_HEADERS);
  ensureSheetHeaders(SHEET_INBOX, INBOX_HEADERS);
  ensureSheetHeaders(SHEET_DECKS, DECKS_HEADERS);
}

function ensureSheetHeaders(sheetName, requiredHeaders) {
  const sheet = getSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(requiredHeaders);
    return;
  }
  // Auto-migrate: append any missing headers as new columns
  const lastCol = sheet.getLastColumn();
  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missing = requiredHeaders.filter(h => existingHeaders.indexOf(h) === -1);
  if (missing.length > 0) {
    missing.forEach((h, i) => {
      sheet.getRange(1, lastCol + 1 + i).setValue(h);
    });
  }
}

function rowsToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let v = row[i];
      if (v instanceof Date) v = v.toISOString();
      obj[h] = v;
    });
    return obj;
  });
}

// ---------- Pairs ----------

function listPairs() {
  return rowsToObjects(getSheet(SHEET_PAIRS));
}

function savePair(pair) {
  if (!pair) throw new Error("pair is required");

  const sheet = getSheet(SHEET_PAIRS);
  const existing = listPairs();

  // Duplicate check (exact match on pairKey + textA + textB + style)
  const dup = existing.find(p =>
    p.pairKey === pair.pairKey &&
    p.textA === pair.textA &&
    p.textB === pair.textB &&
    (p.style || "") === (pair.style || "")
  );
  if (dup) return { skipped: true, id: dup.id };

  const id = pair.id || Utilities.getUuid();
  const createdAt = new Date().toISOString();
  // Build row in PAIRS_HEADERS order (auto-extends to whatever columns exist)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowMap = {
    id,
    pairKey: pair.pairKey || "",
    langA: pair.langA || "",
    textA: pair.textA || "",
    langB: pair.langB || "",
    textB: pair.textB || "",
    style: pair.style || "",
    createdAt,
    partOfSpeech: pair.partOfSpeech || "",
    example: pair.example || "",
    context: pair.context || "",
    deck: pair.deck || ""
  };
  const row = headers.map(h => rowMap[h] !== undefined ? rowMap[h] : "");
  sheet.appendRow(row);
  return { id, created: true };
}

function updatePair(pair) {
  if (!pair || !pair.id) throw new Error("pair.id is required");
  const sheet = getSheet(SHEET_PAIRS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pair.id) {
      const row = i + 1;
      // For every field present on `pair`, find its column index and update.
      Object.keys(pair).forEach(key => {
        if (key === "id") return;
        const col = headers.indexOf(key);
        if (col === -1) return; // unknown column — skip silently
        sheet.getRange(row, col + 1).setValue(pair[key]);
      });
      return { updated: true };
    }
  }
  throw new Error("Pair not found: " + pair.id);
}

function deletePair(id) {
  if (!id) throw new Error("id is required");
  const sheet = getSheet(SHEET_PAIRS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      deleteScoresByPairId(id);
      return { deleted: true };
    }
  }
  throw new Error("Pair not found: " + id);
}

// ---------- Scores ----------

function listScores() {
  return rowsToObjects(getSheet(SHEET_SCORES));
}

function updateScore(score) {
  if (!score || !score.pairId || !score.direction) {
    throw new Error("pairId and direction are required");
  }
  const sheet = getSheet(SHEET_SCORES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === score.pairId && data[i][1] === score.direction) {
      const row = i + 1;
      if (score.easeFactor    !== undefined) sheet.getRange(row, 3).setValue(score.easeFactor);
      if (score.interval      !== undefined) sheet.getRange(row, 4).setValue(score.interval);
      if (score.nextReview    !== undefined) sheet.getRange(row, 5).setValue(score.nextReview);
      if (score.lastReviewed  !== undefined) sheet.getRange(row, 6).setValue(score.lastReviewed);
      if (score.repetitions   !== undefined) sheet.getRange(row, 7).setValue(score.repetitions);
      return { updated: true };
    }
  }
  sheet.appendRow([
    score.pairId,
    score.direction,
    score.easeFactor   != null ? score.easeFactor : 2.5,
    score.interval     != null ? score.interval   : 0,
    score.nextReview   || "",
    score.lastReviewed || "",
    score.repetitions  != null ? score.repetitions : 0
  ]);
  return { created: true };
}

function deleteScoresByPairId(pairId) {
  const sheet = getSheet(SHEET_SCORES);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === pairId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function deleteScoreByDirection(pairId, direction) {
  if (!pairId || !direction) throw new Error("pairId and direction are required");
  const sheet = getSheet(SHEET_SCORES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pairId && data[i][1] === direction) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error("Score not found");
}

// ---------- Inbox (quick capture) ----------

function quickCapture(payload) {
  const text = (payload && payload.text ? String(payload.text) : "").trim();
  if (!text) throw new Error("text is required");

  const sheet = getSheet(SHEET_INBOX);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const id = payload.id || Utilities.getUuid();
  const createdAt = new Date().toISOString();
  const rowMap = {
    id,
    text,
    srcLang: payload.srcLang || "",
    note: payload.note || "",
    source: payload.source || "manual",
    createdAt,
    processed: false
  };
  const row = headers.map(h => rowMap[h] !== undefined ? rowMap[h] : "");
  sheet.appendRow(row);
  return { id, created: true };
}

function listInbox() {
  const all = rowsToObjects(getSheet(SHEET_INBOX));
  return all.filter(item => {
    const p = item.processed;
    return !(p === true || p === "TRUE" || p === "true");
  });
}

function deleteInboxItem(id) {
  if (!id) throw new Error("id is required");
  const sheet = getSheet(SHEET_INBOX);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error("Inbox item not found: " + id);
}

function markInboxProcessed(id) {
  if (!id) throw new Error("id is required");
  const sheet = getSheet(SHEET_INBOX);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const processedCol = headers.indexOf("processed");
  if (processedCol === -1) throw new Error("processed column missing");
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, processedCol + 1).setValue(true);
      return { updated: true };
    }
  }
  throw new Error("Inbox item not found: " + id);
}

// ---------- Decks ----------

function listDecks() {
  return rowsToObjects(getSheet(SHEET_DECKS));
}

function saveDeck(deck) {
  if (!deck || !deck.name) throw new Error("deck.name is required");
  const existing = listDecks();
  if (existing.find(d => d.name === deck.name)) {
    throw new Error("デッキ名が既に存在します: " + deck.name);
  }
  const sheet = getSheet(SHEET_DECKS);
  const id = deck.id || Utilities.getUuid();
  sheet.appendRow([id, deck.name, new Date().toISOString()]);
  return { id, created: true };
}

function updateDeck(deck) {
  if (!deck || !deck.id) throw new Error("deck.id is required");
  const sheet = getSheet(SHEET_DECKS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === deck.id) {
      if (deck.name !== undefined) sheet.getRange(i + 1, 2).setValue(deck.name);
      return { updated: true };
    }
  }
  throw new Error("Deck not found: " + deck.id);
}

function deleteDeck(id) {
  if (!id) throw new Error("id is required");
  const sheet = getSheet(SHEET_DECKS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error("Deck not found: " + id);
}
