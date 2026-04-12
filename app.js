// ========================================
// AI翻訳 - Gemini Translation App v3
// ========================================

const LANG_NAMES = {
    auto: "自動",
    ja: "日本語",
    en: "English",
    zh: "中文 (中国語)",
    ko: "한국어 (韓国語)",
    tl: "Tagalog (タガログ語)",
    id: "Indonesia (インドネシア語)",
    es: "Español (スペイン語)",
    fr: "Français (フランス語)",
    de: "Deutsch (ドイツ語)",
    pt: "Português (ポルトガル語)",
    th: "ไทย (タイ語)",
    vi: "Tiếng Việt (ベトナム語)",
    ar: "العربية (アラビア語)",
};

const LANG_SHORT = {
    auto: "自動", ja: "日本語", en: "EN", zh: "中文", ko: "韓国語",
    tl: "タガログ", id: "インドネシア",
    es: "ES", fr: "FR", de: "DE", pt: "PT", th: "TH", vi: "VI", ar: "AR",
};

const LANG_TTS = {
    ja: "ja-JP", en: "en-US", zh: "zh-CN", ko: "ko-KR",
    tl: "fil-PH", id: "id-ID",
    es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR",
    th: "th-TH", vi: "vi-VN", ar: "ar-SA",
};

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const STORAGE_KEY_API = "gemini_api_key";
const STORAGE_KEY_FAVORITES = "favorite_languages";
const DEFAULT_FAVORITES = ["en", "zh", "ko", "tl", "id"];

// ---- DOM Elements ----
const sourceText = document.getElementById("source-text");
const sourceLang = document.getElementById("source-lang");
const targetLang = document.getElementById("target-lang");
const translateBtn = document.getElementById("translate-btn");
const btnText = translateBtn.querySelector(".btn-text");
const btnLoading = translateBtn.querySelector(".btn-loading");
const resultContainer = document.getElementById("result-container");
const resultText = document.getElementById("result-text");
const resultLang = document.getElementById("result-lang");
const copyBtn = document.getElementById("copy-btn");
const speakBtn = document.getElementById("speak-btn");
const clearBtn = document.getElementById("clear-btn");
const charCount = document.getElementById("char-count");
const swapBtn = document.getElementById("swap-btn");
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettings = document.getElementById("close-settings");
const apiKeyInput = document.getElementById("api-key");
const toggleKeyBtn = document.getElementById("toggle-key");
const saveKeyBtn = document.getElementById("save-key");
const keyStatus = document.getElementById("key-status");
const favoritesList = document.getElementById("favorites-list");
const editFavoritesBtn = document.getElementById("edit-favorites-btn");
const favoritesModal = document.getElementById("favorites-modal");
const closeFavorites = document.getElementById("close-favorites");
const favoritesEditor = document.getElementById("favorites-editor");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");
const cameraBtn = document.getElementById("camera-btn");
const cameraInput = document.getElementById("camera-input");
const micBtn = document.getElementById("mic-btn");
const learningSection = document.getElementById("learning-section");
const learningNotes = document.getElementById("learning-notes");
const styleTabs = document.querySelectorAll(".style-tab");

// ---- State ----
let isTranslating = false;
let recognition = null;
let isRecording = false;
let currentTargetLang = null;

// Translation cache: { normal, casual, formal, advanced, notes }
let translationCache = { normal: "", casual: "", formal: "", advanced: "", notes: "" };
let activeStyle = "normal";
let lastSourceText = "";
let lastTargetLang = "";

// ---- Init ----
function init() {
    loadApiKey();
    loadFavorites();
    bindEvents();
    updateTranslateButton();
}

function bindEvents() {
    sourceText.addEventListener("input", onSourceInput);
    translateBtn.addEventListener("click", handleTranslate);
    swapBtn.addEventListener("click", swapLanguages);
    copyBtn.addEventListener("click", copyResult);
    clearBtn.addEventListener("click", clearInput);
    speakBtn.addEventListener("click", speakResult);

    // Style tabs
    styleTabs.forEach((tab) => {
        tab.addEventListener("click", () => switchStyle(tab.dataset.style));
    });

    // Settings
    settingsBtn.addEventListener("click", openSettings);
    closeSettings.addEventListener("click", closeSettingsModal);
    settingsModal.querySelector(".modal-backdrop").addEventListener("click", closeSettingsModal);
    toggleKeyBtn.addEventListener("click", toggleKeyVisibility);
    saveKeyBtn.addEventListener("click", saveApiKey);
    apiKeyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveApiKey();
    });

    // Favorites
    editFavoritesBtn.addEventListener("click", openFavoritesEditor);
    closeFavorites.addEventListener("click", closeFavoritesModal);
    favoritesModal.querySelector(".modal-backdrop").addEventListener("click", closeFavoritesModal);

    // File upload — on mobile, this shows the system picker (files + photos + camera)
    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileUpload);

    // Dedicated camera button
    cameraBtn.addEventListener("click", () => cameraInput.click());
    cameraInput.addEventListener("change", handleImageUpload);

    // Microphone
    micBtn.addEventListener("click", toggleMicrophone);

    // Keyboard shortcut
    sourceText.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleTranslate();
        }
    });
}

// ---- Source Input ----
function onSourceInput() {
    const len = sourceText.value.length;
    charCount.textContent = `${len}文字`;
    clearBtn.style.display = len > 0 ? "inline" : "none";
    updateTranslateButton();
}

function clearInput() {
    sourceText.value = "";
    onSourceInput();
    resultContainer.style.display = "none";
    translationCache = { normal: "", casual: "", formal: "", advanced: "", notes: "" };
    sourceText.focus();
}

function updateTranslateButton() {
    const hasKey = !!getApiKey();
    const hasText = sourceText.value.trim().length > 0;
    translateBtn.disabled = !hasKey || !hasText || isTranslating;
}

// ---- Auto Target Language ----
function isJapaneseText(text) {
    const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF]/g);
    return japaneseChars && japaneseChars.length >= 2;
}

function resolveTargetLanguage(text) {
    if (targetLang.value !== "auto") return targetLang.value;
    return isJapaneseText(text) ? "en" : "ja";
}

// ---- Language Swap ----
function swapLanguages() {
    if (sourceLang.value === "auto") {
        showToast("自動検出からは入れ替えできません");
        return;
    }
    if (targetLang.value === "auto") {
        showToast("翻訳先が自動の場合は入れ替えできません");
        return;
    }
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;
    updateFavoritesHighlight();
}

// ---- Style Tabs ----
function switchStyle(style) {
    activeStyle = style;
    styleTabs.forEach((t) => t.classList.toggle("active", t.dataset.style === style));

    // If we already have the translation cached, show it
    if (translationCache[style]) {
        resultText.textContent = translationCache[style];
        return;
    }

    // Otherwise, fetch this style
    if (lastSourceText && lastTargetLang) {
        fetchSingleStyle(style, lastSourceText, lastTargetLang);
    }
}

async function fetchSingleStyle(style, text, tgtLang) {
    const apiKey = getApiKey();
    if (!apiKey || !text) return;

    const tab = document.querySelector(`.style-tab[data-style="${style}"]`);
    tab.classList.add("loading");
    resultText.textContent = "翻訳中...";

    try {
        const tgtName = LANG_NAMES[tgtLang] || tgtLang;
        const srcLang = sourceLang.value;
        const srcName = LANG_NAMES[srcLang] || srcLang;

        const styleDesc = {
            normal: "standard/literal translation",
            casual: "casual, colloquial, friendly tone",
            formal: "formal, polite, business-appropriate tone",
            advanced: "natural native-like expression using phrasal verbs, idioms, and colloquial phrases",
        }[style];

        const langContext = srcLang === "auto"
            ? `Translate the following text to ${tgtName}`
            : `Translate the following text from ${srcName} to ${tgtName}`;

        const prompt = `${langContext} using a ${styleDesc}. Output ONLY the translated text, nothing else.\n\n${text}`;

        const translated = await callGemini(apiKey, prompt);
        translationCache[style] = translated;

        if (activeStyle === style) {
            resultText.textContent = translated;
        }
    } catch (error) {
        if (activeStyle === style) {
            resultText.textContent = "";
        }
        showToast(error.message || "翻訳に失敗しました");
    } finally {
        tab.classList.remove("loading");
    }
}

// ---- Translation ----
async function handleTranslate() {
    const text = sourceText.value.trim();
    if (!text || isTranslating) return;

    const apiKey = getApiKey();
    if (!apiKey) { openSettings(); return; }

    const tgtLang = resolveTargetLanguage(text);
    currentTargetLang = tgtLang;
    lastSourceText = text;
    lastTargetLang = tgtLang;

    // Reset cache
    translationCache = { normal: "", casual: "", formal: "", advanced: "", notes: "" };
    activeStyle = "normal";
    styleTabs.forEach((t) => t.classList.toggle("active", t.dataset.style === "normal"));

    setLoading(true);
    resultContainer.style.display = "block";
    resultText.textContent = "翻訳中...";
    learningNotes.innerHTML = `<p style="color:var(--text-secondary);"><span class="spinner-inline"></span>学習メモを生成中...</p>`;
    learningSection.style.display = "block";

    const tgtName = LANG_NAMES[tgtLang] || tgtLang;
    resultLang.textContent = tgtName;

    const srcLang = sourceLang.value;
    const srcName = LANG_NAMES[srcLang] || srcLang;
    const langContext = srcLang === "auto"
        ? `the following text to ${tgtName}`
        : `the following text from ${srcName} to ${tgtName}`;

    // Mark all non-normal tabs as loading
    ["casual", "formal", "advanced"].forEach((style) => {
        const tab = document.querySelector(`.style-tab[data-style="${style}"]`);
        if (tab) tab.classList.add("loading");
    });

    // ===== Step 1: Normal translation (fastest, shown first) =====
    const normalPrompt = `Translate ${langContext}. Output ONLY the translated text, no explanations.\n\n${text}`;

    let normalPromise = callGemini(apiKey, normalPrompt)
        .then((result) => {
            translationCache.normal = result;
            if (activeStyle === "normal" && lastSourceText === text) {
                resultText.textContent = result;
            }
            setLoading(false); // Hide main spinner as soon as normal is ready
        })
        .catch((error) => {
            showToast(error.message || "翻訳に失敗しました");
            resultContainer.style.display = "none";
            setLoading(false);
            throw error;
        });

    // ===== Step 2: Other 3 styles (parallel with normal, in one batched call) =====
    const stylesPrompt = `You are a professional translator.

Translate ${langContext} in 3 different styles.

Respond in this exact JSON format (no markdown code fences, no extra text):
{
  "casual": "casual, colloquial, friendly translation",
  "formal": "formal, polite, business-appropriate translation",
  "advanced": "natural native-like translation that actively uses phrasal verbs, idioms, and expressions a native speaker would prefer"
}

Text to translate:
${text}`;

    let stylesPromise = callGemini(apiKey, stylesPrompt)
        .then((raw) => {
            if (lastSourceText !== text) return; // Stale response guard
            const jsonStr = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            const parsed = JSON.parse(jsonStr);
            translationCache.casual = parsed.casual || "";
            translationCache.formal = parsed.formal || "";
            translationCache.advanced = parsed.advanced || "";

            // Update tabs: remove loading state
            ["casual", "formal", "advanced"].forEach((style) => {
                const tab = document.querySelector(`.style-tab[data-style="${style}"]`);
                if (tab) tab.classList.remove("loading");
            });

            // If user switched to one of these tabs while loading, update display
            if (translationCache[activeStyle]) {
                resultText.textContent = translationCache[activeStyle];
            }
        })
        .catch(() => {
            ["casual", "formal", "advanced"].forEach((style) => {
                const tab = document.querySelector(`.style-tab[data-style="${style}"]`);
                if (tab) tab.classList.remove("loading");
            });
        });

    // ===== Step 3: Learning notes (after normal is ready for perspective) =====
    const detectedSrcIsJa = (srcLang === "ja") || (srcLang === "auto" && isJapaneseText(text));
    let notesInstruction;
    if (detectedSrcIsJa) {
        notesInstruction = `2-3 concise learning tips IN JAPANESE (each 1-2 sentences, keep it short) that analyze the TRANSLATED TEXT (the ${tgtName} output). The reader is a Japanese learner studying ${tgtName}. Explain key grammar, vocabulary, phrasal verbs, or idioms that appear in the translation.`;
    } else {
        notesInstruction = `2-3 concise learning tips IN JAPANESE (each 1-2 sentences, keep it short) that analyze the ORIGINAL SOURCE TEXT (the input language). The reader is a Japanese learner studying the source language. Explain key grammar, vocabulary, or idioms used in the source text.`;
    }

    const notesPrompt = `You are a language tutor.

First translate ${langContext}, then write learning notes.

${notesInstruction}

Output ONLY the notes as HTML (use <p> for paragraphs and <strong> for important terms). No other text.

Text:
${text}`;

    let notesPromise = callGemini(apiKey, notesPrompt)
        .then((notes) => {
            if (lastSourceText !== text) return;
            // Clean up any markdown fences or extra wrapping
            const cleaned = notes.replace(/```html\s*/g, "").replace(/```\s*/g, "").trim();
            translationCache.notes = cleaned;
            learningNotes.innerHTML = cleaned;
            learningSection.style.display = "block";
        })
        .catch(() => {
            // Silently fail for notes — translation still works
        });

    // Fire-and-forget all promises (handled internally)
    Promise.allSettled([normalPromise, stylesPromise, notesPromise]);
}

async function callGemini(apiKey, prompt) {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => null);
        if (response.status === 400 || response.status === 403) {
            throw new Error("APIキーが無効です。設定を確認してください。");
        }
        throw new Error(errData?.error?.message || `APIエラー (${response.status})`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("翻訳結果を取得できませんでした。");
    return text;
}

function setLoading(loading) {
    isTranslating = loading;
    btnText.style.display = loading ? "none" : "inline";
    btnLoading.style.display = loading ? "inline-flex" : "none";
    updateTranslateButton();
}

// ---- Copy ----
async function copyResult() {
    const text = resultText.textContent;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        showToast("コピーしました");
    } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("コピーしました");
    }
}

// ---- Text-to-Speech ----
function speakResult() {
    const text = resultText.textContent;
    if (!text) return;
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = LANG_TTS[currentTargetLang] || "en-US";
    utterance.lang = langCode;
    utterance.rate = 0.9;

    const voices = speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
    if (match) utterance.voice = match;

    utterance.onstart = () => { speakBtn.style.color = "var(--primary)"; };
    utterance.onend = () => { speakBtn.style.color = ""; };
    utterance.onerror = () => { speakBtn.style.color = ""; };

    speechSynthesis.speak(utterance);
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

// ---- File Upload ----
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
        processImage(file);
    } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
            sourceText.value = ev.target.result;
            onSourceInput();
            showToast(`${file.name} を読み込みました`);
        };
        reader.onerror = () => showToast("ファイルの読み込みに失敗しました");
        reader.readAsText(file);
    }
    fileInput.value = "";
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    processImage(file);
    cameraInput.value = "";
}

async function processImage(file) {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast("先にAPIキーを設定してください");
        openSettings();
        return;
    }

    showToast("画像からテキストを読み取り中...");

    try {
        const base64 = await fileToBase64(file);
        const mimeType = file.type || "image/jpeg";

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Extract ALL text from this image. Output only the extracted text, nothing else. Preserve line breaks." },
                        { inline_data: { mime_type: mimeType, data: base64 } },
                    ],
                }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
            }),
        });

        if (!response.ok) throw new Error("画像の読み取りに失敗しました");

        const data = await response.json();
        const extracted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (extracted) {
            sourceText.value = extracted;
            onSourceInput();
            showToast("テキストを読み取りました");
        } else {
            showToast("画像からテキストを検出できませんでした");
        }
    } catch (error) {
        showToast(error.message || "画像処理に失敗しました");
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            resolve(result.split(",")[1]); // strip data:...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ---- Microphone (Speech Recognition) ----
function toggleMicrophone() {
    if (isRecording) { stopRecording(); return; }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("このブラウザは音声入力に対応していません");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    const src = sourceLang.value;
    recognition.lang = (src !== "auto" && LANG_TTS[src]) ? LANG_TTS[src] : "ja-JP";

    let finalTranscript = sourceText.value;

    recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interim += transcript;
            }
        }
        sourceText.value = finalTranscript + interim;
        onSourceInput();
    };

    recognition.onerror = (event) => {
        if (event.error !== "aborted") showToast(`音声認識エラー: ${event.error}`);
        stopRecording();
    };

    recognition.onend = () => stopRecording();

    recognition.start();
    isRecording = true;
    micBtn.classList.add("recording");
    micBtn.querySelector("span").textContent = "停止";
    showToast("音声入力中...");
}

function stopRecording() {
    if (recognition) { recognition.stop(); recognition = null; }
    isRecording = false;
    micBtn.classList.remove("recording");
    micBtn.querySelector("span").textContent = "音声";
}

// ---- Favorites ----
function getFavorites() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_FAVORITES);
        return stored ? JSON.parse(stored) : DEFAULT_FAVORITES;
    } catch { return DEFAULT_FAVORITES; }
}

function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
}

function loadFavorites() { renderFavorites(); }

function renderFavorites() {
    const favorites = getFavorites();
    favoritesList.innerHTML = "";

    favorites.forEach((code) => {
        const btn = document.createElement("button");
        btn.className = "fav-btn";
        btn.textContent = LANG_SHORT[code] || code;
        btn.dataset.lang = code;
        if (targetLang.value === code) btn.classList.add("active");

        btn.addEventListener("click", () => {
            targetLang.value = code;
            updateFavoritesHighlight();
            if (sourceText.value.trim() && getApiKey()) handleTranslate();
        });

        favoritesList.appendChild(btn);
    });
}

function updateFavoritesHighlight() {
    document.querySelectorAll(".fav-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lang === targetLang.value);
    });
}

targetLang.addEventListener("change", updateFavoritesHighlight);

// ---- Favorites Editor ----
function openFavoritesEditor() {
    favoritesModal.style.display = "flex";
    renderFavoritesEditor();
}

function closeFavoritesModal() {
    favoritesModal.style.display = "none";
    renderFavorites();
}

function renderFavoritesEditor() {
    const favorites = getFavorites();
    const allLangs = Object.keys(LANG_NAMES).filter((k) => k !== "auto");

    favoritesEditor.innerHTML = "";
    allLangs.forEach((code) => {
        const item = document.createElement("button");
        item.className = "fav-editor-item";
        item.textContent = `${LANG_SHORT[code]} ${LANG_NAMES[code]}`;
        item.dataset.lang = code;
        if (favorites.includes(code)) item.classList.add("selected");

        item.addEventListener("click", () => {
            const current = getFavorites();
            if (current.includes(code)) {
                saveFavorites(current.filter((c) => c !== code));
                item.classList.remove("selected");
            } else {
                current.push(code);
                saveFavorites(current);
                item.classList.add("selected");
            }
        });

        favoritesEditor.appendChild(item);
    });
}

// ---- Settings ----
function openSettings() {
    settingsModal.style.display = "flex";
    apiKeyInput.value = getApiKey() || "";
    keyStatus.textContent = "";
    keyStatus.className = "key-status";
}

function closeSettingsModal() { settingsModal.style.display = "none"; }

function toggleKeyVisibility() {
    apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        keyStatus.textContent = "APIキーを入力してください";
        keyStatus.className = "key-status error";
        return;
    }
    localStorage.setItem(STORAGE_KEY_API, key);
    keyStatus.textContent = "保存しました";
    keyStatus.className = "key-status success";
    updateTranslateButton();
    setTimeout(closeSettingsModal, 800);
}

function loadApiKey() {
    if (!getApiKey()) setTimeout(openSettings, 500);
}

function getApiKey() {
    return localStorage.getItem(STORAGE_KEY_API) || "";
}

// ---- Utilities ----
function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
}

// ---- Start ----
init();
