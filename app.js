// ========================================
// AI翻訳 - Gemini Translation App
// ========================================

const LANG_NAMES = {
    auto: "自動",
    ja: "日本語",
    en: "English",
    zh: "中文 (中国語)",
    ko: "한국어 (韓国語)",
    es: "Español (スペイン語)",
    fr: "Français (フランス語)",
    de: "Deutsch (ドイツ語)",
    pt: "Português (ポルトガル語)",
    th: "ไทย (タイ語)",
    vi: "Tiếng Việt (ベトナム語)",
    ar: "العربية (アラビア語)",
};

const LANG_SHORT = {
    auto: "自動",
    ja: "日本語",
    en: "EN",
    zh: "中文",
    ko: "韓国語",
    es: "ES",
    fr: "FR",
    de: "DE",
    pt: "PT",
    th: "TH",
    vi: "VI",
    ar: "AR",
};

// TTS language codes
const LANG_TTS = {
    ja: "ja-JP",
    en: "en-US",
    zh: "zh-CN",
    ko: "ko-KR",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    pt: "pt-BR",
    th: "th-TH",
    vi: "vi-VN",
    ar: "ar-SA",
};

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const STORAGE_KEY_API = "gemini_api_key";
const STORAGE_KEY_HISTORY = "translation_history";
const STORAGE_KEY_FAVORITES = "favorite_languages";
const MAX_HISTORY = 20;
const DEFAULT_FAVORITES = ["en", "zh", "ko", "fr"];

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
const historyContainer = document.getElementById("history-container");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const favoritesList = document.getElementById("favorites-list");
const editFavoritesBtn = document.getElementById("edit-favorites-btn");
const favoritesModal = document.getElementById("favorites-modal");
const closeFavorites = document.getElementById("close-favorites");
const favoritesEditor = document.getElementById("favorites-editor");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");
const micBtn = document.getElementById("mic-btn");

// ---- State ----
let isTranslating = false;
let recognition = null;
let isRecording = false;
let currentTargetLang = null; // tracks the resolved target language for TTS

// ---- Init ----
function init() {
    loadApiKey();
    loadHistory();
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

    // Settings
    settingsBtn.addEventListener("click", openSettings);
    closeSettings.addEventListener("click", closeSettingsModal);
    settingsModal.querySelector(".modal-backdrop").addEventListener("click", closeSettingsModal);
    toggleKeyBtn.addEventListener("click", toggleKeyVisibility);
    saveKeyBtn.addEventListener("click", saveApiKey);
    apiKeyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveApiKey();
    });

    // History
    clearHistoryBtn.addEventListener("click", clearHistory);

    // Favorites
    editFavoritesBtn.addEventListener("click", openFavoritesEditor);
    closeFavorites.addEventListener("click", closeFavoritesModal);
    favoritesModal.querySelector(".modal-backdrop").addEventListener("click", closeFavoritesModal);

    // File upload
    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileUpload);

    // Microphone
    micBtn.addEventListener("click", toggleMicrophone);

    // Keyboard shortcut: Ctrl/Cmd + Enter to translate
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
    if (targetLang.value !== "auto") {
        return targetLang.value;
    }
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

    if (resultText.textContent && resultContainer.style.display !== "none") {
        const tempText = sourceText.value;
        sourceText.value = resultText.textContent;
        resultText.textContent = tempText;
        onSourceInput();
    }
}

// ---- Translation ----
async function handleTranslate() {
    const text = sourceText.value.trim();
    if (!text || isTranslating) return;

    const apiKey = getApiKey();
    if (!apiKey) {
        openSettings();
        return;
    }

    setLoading(true);

    try {
        const srcLang = sourceLang.value;
        const tgtLang = resolveTargetLanguage(text);
        currentTargetLang = tgtLang;
        const srcName = LANG_NAMES[srcLang] || srcLang;
        const tgtName = LANG_NAMES[tgtLang] || tgtLang;

        let prompt;
        if (srcLang === "auto") {
            prompt = `Translate the following text to ${tgtName}. Output ONLY the translated text, nothing else. No explanations, no notes.\n\n${text}`;
        } else {
            prompt = `Translate the following text from ${srcName} to ${tgtName}. Output ONLY the translated text, nothing else. No explanations, no notes.\n\n${text}`;
        }

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 4096,
                },
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
        const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!translated) {
            throw new Error("翻訳結果を取得できませんでした。");
        }

        resultText.textContent = translated;
        resultLang.textContent = tgtName;
        resultContainer.style.display = "block";

        addToHistory({
            source: text,
            result: translated,
            srcLang: srcLang === "auto" ? "auto" : srcLang,
            tgtLang,
            timestamp: Date.now(),
        });
    } catch (error) {
        showToast(error.message || "翻訳に失敗しました");
    } finally {
        setLoading(false);
    }
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

    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = LANG_TTS[currentTargetLang] || "en-US";
    utterance.lang = langCode;
    utterance.rate = 0.9;

    // Try to find a matching voice
    const voices = speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
    if (matchingVoice) {
        utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
        speakBtn.style.color = "var(--primary)";
    };
    utterance.onend = () => {
        speakBtn.style.color = "";
    };
    utterance.onerror = () => {
        speakBtn.style.color = "";
        showToast("音声再生に失敗しました");
    };

    speechSynthesis.speak(utterance);
}

// Load voices (some browsers load async)
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

// ---- File Upload ----
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        sourceText.value = event.target.result;
        onSourceInput();
        showToast(`${file.name} を読み込みました`);
    };
    reader.onerror = () => {
        showToast("ファイルの読み込みに失敗しました");
    };
    reader.readAsText(file);
    fileInput.value = "";
}

// ---- Microphone (Speech Recognition) ----
function toggleMicrophone() {
    if (isRecording) {
        stopRecording();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("このブラウザは音声入力に対応していません");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set recognition language
    const src = sourceLang.value;
    if (src !== "auto" && LANG_TTS[src]) {
        recognition.lang = LANG_TTS[src];
    } else {
        recognition.lang = "ja-JP";
    }

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
        if (event.error !== "aborted") {
            showToast(`音声認識エラー: ${event.error}`);
        }
        stopRecording();
    };

    recognition.onend = () => {
        stopRecording();
    };

    recognition.start();
    isRecording = true;
    micBtn.classList.add("recording");
    micBtn.querySelector("span").textContent = "停止";
    showToast("音声入力中...");
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    isRecording = false;
    micBtn.classList.remove("recording");
    micBtn.querySelector("span").textContent = "音声入力";
}

// ---- Favorites ----
function getFavorites() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_FAVORITES);
        return stored ? JSON.parse(stored) : DEFAULT_FAVORITES;
    } catch {
        return DEFAULT_FAVORITES;
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
}

function loadFavorites() {
    renderFavorites();
}

function renderFavorites() {
    const favorites = getFavorites();
    favoritesList.innerHTML = "";

    favorites.forEach((code) => {
        const btn = document.createElement("button");
        btn.className = "fav-btn";
        btn.textContent = LANG_SHORT[code] || code;
        btn.dataset.lang = code;

        if (targetLang.value === code) {
            btn.classList.add("active");
        }

        btn.addEventListener("click", () => {
            targetLang.value = code;
            updateFavoritesHighlight();

            // Real-time translate if there's text
            if (sourceText.value.trim() && getApiKey()) {
                handleTranslate();
            }
        });

        favoritesList.appendChild(btn);
    });
}

function updateFavoritesHighlight() {
    document.querySelectorAll(".fav-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lang === targetLang.value);
    });
}

// Listen for manual dropdown change
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

        if (favorites.includes(code)) {
            item.classList.add("selected");
        }

        item.addEventListener("click", () => {
            const current = getFavorites();
            if (current.includes(code)) {
                const updated = current.filter((c) => c !== code);
                saveFavorites(updated);
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

function closeSettingsModal() {
    settingsModal.style.display = "none";
}

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
    const key = getApiKey();
    if (!key) {
        setTimeout(openSettings, 500);
    }
}

function getApiKey() {
    return localStorage.getItem(STORAGE_KEY_API) || "";
}

// ---- History ----
function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || "[]");
    } catch {
        return [];
    }
}

function addToHistory(entry) {
    const history = getHistory();
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    renderHistory(history);
}

function loadHistory() {
    const history = getHistory();
    renderHistory(history);
}

function renderHistory(history) {
    if (history.length === 0) {
        historyContainer.style.display = "none";
        return;
    }
    historyContainer.style.display = "block";
    historyList.innerHTML = history
        .map(
            (item, i) => `
        <div class="history-item" data-index="${i}">
            <div class="history-item-lang">${LANG_NAMES[item.srcLang] || item.srcLang} → ${LANG_NAMES[item.tgtLang] || item.tgtLang}</div>
            <div class="history-item-source">${escapeHtml(item.source)}</div>
            <div class="history-item-result">${escapeHtml(item.result)}</div>
        </div>
    `
        )
        .join("");

    historyList.querySelectorAll(".history-item").forEach((el) => {
        el.addEventListener("click", () => {
            const idx = parseInt(el.dataset.index);
            const item = history[idx];
            if (!item) return;
            sourceText.value = item.source;
            if (item.srcLang !== "auto") sourceLang.value = item.srcLang;
            targetLang.value = item.tgtLang;
            currentTargetLang = item.tgtLang;
            resultText.textContent = item.result;
            resultLang.textContent = LANG_NAMES[item.tgtLang] || item.tgtLang;
            resultContainer.style.display = "block";
            onSourceInput();
            updateFavoritesHighlight();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
}

function clearHistory() {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    renderHistory([]);
    showToast("履歴を削除しました");
}

// ---- Utilities ----
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

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
