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
const STORAGE_KEY_GAS_URL = "gas_endpoint_url";
const STORAGE_KEY_AUTOPLAY_DELAY = "autoplay_delay";
const STORAGE_KEY_VOICE_FEEDBACK = "voice_feedback_enabled";
const DEFAULT_FAVORITES = ["en", "zh", "ko", "tl", "id"];
const DEFAULT_AUTOPLAY_DELAY = 10;

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
const pasteBtn = document.getElementById("paste-btn");
const learningSection = document.getElementById("learning-section");
const learningNotes = document.getElementById("learning-notes");
const styleTabs = document.querySelectorAll(".style-tab");
const saveBtn = document.getElementById("save-btn");

// GAS settings
const gasUrlInput = document.getElementById("gas-url");
const saveGasBtn = document.getElementById("save-gas");
const gasStatus = document.getElementById("gas-status");
const autoplayDelaySelect = document.getElementById("autoplay-delay");

// Mode navigation
const modeTabs = document.querySelectorAll(".mode-tab");
const translateView = document.getElementById("translate-view");
const studyView = document.getElementById("study-view");
const cardsView = document.getElementById("cards-view");

// Study view
const studySetup = document.getElementById("study-setup");
const studySession = document.getElementById("study-session");
const studyEmpty = document.getElementById("study-empty");
const studyPairSelect = document.getElementById("study-pair");
const directionToggle = document.getElementById("direction-toggle");
const studyStartBtn = document.getElementById("study-start-btn");
const studyExitBtn = document.getElementById("study-exit-btn");
const sessionProgress = document.getElementById("session-progress");
const questionLangTag = document.getElementById("question-lang-tag");
const questionTextEl = document.getElementById("question-text");
const answerLangTag = document.getElementById("answer-lang-tag");
const answerTextEl = document.getElementById("answer-text");
const answerBlock = document.getElementById("answer-block");
const speakQuestionBtn = document.getElementById("speak-question-btn");
const speakAnswerBtn = document.getElementById("speak-answer-btn");
const showAnswerBtn = document.getElementById("show-answer-btn");
const feedbackButtons = document.getElementById("feedback-buttons");
const autoplayToggleBtn = document.getElementById("autoplay-toggle-btn");
const autoplayCountdown = document.getElementById("autoplay-countdown");
const countdownValue = document.getElementById("countdown-value");
const countdownText = document.getElementById("countdown-text");
const voiceFeedbackBtn = document.getElementById("voice-feedback-btn");
const voiceListenHint = document.getElementById("voice-listen-hint");
const statTotal = document.getElementById("stat-total");
const statDue = document.getElementById("stat-due");
const statNew = document.getElementById("stat-new");
const statLearned = document.getElementById("stat-learned");

// Cards view
const cardsCount = document.getElementById("cards-count");
const cardsRefreshBtn = document.getElementById("cards-refresh-btn");
const cardsSearch = document.getElementById("cards-search");
const cardsListEl = document.getElementById("cards-list");
const cardsEmpty = document.getElementById("cards-empty");

// Save modal
const saveModal = document.getElementById("save-modal");
const closeSaveBtn = document.getElementById("close-save");
const saveTabs = document.querySelectorAll(".save-tab");
const saveEditPanel = document.getElementById("save-edit-panel");
const saveExtractPanel = document.getElementById("save-extract-panel");
const saveSrcText = document.getElementById("save-src-text");
const saveTgtText = document.getElementById("save-tgt-text");
const saveSrcLangSelect = document.getElementById("save-src-lang-select");
const saveTgtLangSelect = document.getElementById("save-tgt-lang-select");
const saveSrcLangLabel = document.getElementById("save-src-lang-label");
const saveTgtLangLabel = document.getElementById("save-tgt-lang-label");
const saveStyleHint = document.getElementById("save-style-hint");
const saveSelectionNote = document.getElementById("save-selection-note");
const saveConfirmBtn = document.getElementById("save-confirm-btn");
const saveStatus = document.getElementById("save-status");
const extractStartBtn = document.getElementById("extract-start-btn");
const extractCandidates = document.getElementById("extract-candidates");
const saveExtractConfirmBtn = document.getElementById("save-extract-confirm-btn");
const extractCountEl = document.getElementById("extract-count");

// Card edit modal
const cardEditModal = document.getElementById("card-edit-modal");
const closeCardEdit = document.getElementById("close-card-edit");
const editLangA = document.getElementById("edit-lang-a");
const editLangB = document.getElementById("edit-lang-b");
const editTextA = document.getElementById("edit-text-a");
const editTextB = document.getElementById("edit-text-b");
const cardUpdateBtn = document.getElementById("card-update-btn");
const cardDeleteBtn = document.getElementById("card-delete-btn");

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
let lastDetectedSrcLang = null;

// DB local cache
let cardsCache = []; // [{ id, pairKey, langA, textA, langB, textB, style, createdAt }]
let scoresCache = []; // [{ pairId, direction, easeFactor, interval, nextReview, lastReviewed, repetitions }]

// Save modal state
let pendingSave = null; // { srcLang, srcText, tgtLang, tgtText, style }
let extractItems = []; // current extraction candidates
let currentEditingCardId = null;

// ---- Init ----
function init() {
    loadApiKey();
    loadFavorites();
    loadAutoplayDelay();
    loadVoiceFeedback();
    loadGasUrl();
    bindEvents();
    populateLangSelects();
    updateTranslateButton();
    // Fetch cards on load if GAS is configured
    if (getGasUrl()) fetchAllFromDb().catch(() => {});
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

    // Clipboard paste
    pasteBtn.addEventListener("click", pasteFromClipboard);

    // Keyboard shortcut
    sourceText.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleTranslate();
        }
    });

    // ---- Phase 1 additions ----

    // GAS URL settings
    saveGasBtn.addEventListener("click", saveGasUrl);
    autoplayDelaySelect.addEventListener("change", () => {
        localStorage.setItem(STORAGE_KEY_AUTOPLAY_DELAY, autoplayDelaySelect.value);
    });

    // Mode navigation
    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => switchMode(tab.dataset.mode));
    });

    // Save button
    saveBtn.addEventListener("click", openSaveModal);
    closeSaveBtn.addEventListener("click", closeSaveModal);
    saveModal.querySelector(".modal-backdrop").addEventListener("click", closeSaveModal);
    saveTabs.forEach((t) => t.addEventListener("click", () => switchSaveTab(t.dataset.tab)));
    saveConfirmBtn.addEventListener("click", confirmSaveCard);
    extractStartBtn.addEventListener("click", runExtraction);
    saveExtractConfirmBtn.addEventListener("click", confirmExtractSave);

    // Cards view
    cardsRefreshBtn.addEventListener("click", () => fetchAllFromDb(true));
    cardsSearch.addEventListener("input", () => renderCards());

    // Card edit
    closeCardEdit.addEventListener("click", closeCardEditModal);
    cardEditModal.querySelector(".modal-backdrop").addEventListener("click", closeCardEditModal);
    cardUpdateBtn.addEventListener("click", confirmUpdateCard);
    cardDeleteBtn.addEventListener("click", confirmDeleteCard);

    // Study mode
    studyPairSelect.addEventListener("change", updateStudyStats);
    directionToggle.querySelectorAll(".direction-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            directionToggle.querySelectorAll(".direction-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            updateStudyStats();
        });
    });
    studyStartBtn.addEventListener("click", startStudySession);
    // Stop recognition on pointerdown so iOS doesn't block the click during mic listening
    studyExitBtn.addEventListener("pointerdown", () => stopVoiceRecognition());
    studyExitBtn.addEventListener("click", () => exitStudySession());
    autoplayToggleBtn.addEventListener("pointerdown", () => stopVoiceRecognition());
    voiceFeedbackBtn.addEventListener("pointerdown", () => stopVoiceRecognition());
    // Feedback buttons also stop recognition immediately on touch
    feedbackButtons.querySelectorAll(".feedback-btn").forEach((btn) => {
        btn.addEventListener("pointerdown", () => stopVoiceRecognition());
    });
    showAnswerBtn.addEventListener("click", revealAnswer);
    speakQuestionBtn.addEventListener("click", () => speakText(questionTextEl.textContent, study.currentQuestionLang));
    speakAnswerBtn.addEventListener("click", () => speakText(answerTextEl.textContent, study.currentAnswerLang));
    autoplayToggleBtn.addEventListener("click", toggleAutoplay);
    voiceFeedbackBtn.addEventListener("click", toggleVoiceFeedback);
    feedbackButtons.querySelectorAll(".feedback-btn").forEach((btn) => {
        btn.addEventListener("click", () => submitFeedback(parseInt(btn.dataset.quality)));
    });
}

// ---- Mode Navigation ----
function switchMode(mode) {
    modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
    translateView.style.display = mode === "translate" ? "block" : "none";
    studyView.style.display = mode === "study" ? "block" : "none";
    cardsView.style.display = mode === "cards" ? "block" : "none";

    if (mode === "cards") {
        renderCards();
        if (cardsCache.length === 0 && getGasUrl()) {
            fetchAllFromDb().catch(() => {});
        }
    }

    if (mode === "study") {
        initStudyView();
    } else {
        // Clean up when leaving study mode
        exitStudySession({ silent: true });
    }
}

// ---- Populate language selects in save modal ----
function populateLangSelects() {
    const langs = Object.keys(LANG_NAMES).filter((k) => k !== "auto");
    const makeOptions = (selectEl) => {
        selectEl.innerHTML = "";
        langs.forEach((code) => {
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = LANG_NAMES[code];
            selectEl.appendChild(opt);
        });
    };
    makeOptions(saveSrcLangSelect);
    makeOptions(saveTgtLangSelect);
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
    lastDetectedSrcLang = detectSourceLang(text);

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

// ---- Clipboard Paste (text + image) ----
async function pasteFromClipboard() {
    try {
        // Prefer the full clipboard API (supports images)
        if (navigator.clipboard && typeof navigator.clipboard.read === "function") {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                // Image takes priority — route through OCR
                const imageType = item.types.find((t) => t.startsWith("image/"));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const file = new File([blob], "clipboard-image", { type: imageType });
                    processImage(file);
                    return;
                }
                // Then plain text
                if (item.types.includes("text/plain")) {
                    const blob = await item.getType("text/plain");
                    const text = await blob.text();
                    if (text) {
                        sourceText.value = text;
                        onSourceInput();
                        showToast("テキストを貼り付けました");
                        return;
                    }
                }
            }
            showToast("クリップボードに対応するデータがありません");
            return;
        }

        // Fallback: text-only API
        if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
            const text = await navigator.clipboard.readText();
            if (text) {
                sourceText.value = text;
                onSourceInput();
                showToast("テキストを貼り付けました");
            } else {
                showToast("クリップボードが空です");
            }
            return;
        }

        showToast("このブラウザはクリップボード読み取りに対応していません");
    } catch (error) {
        if (error.name === "NotAllowedError") {
            showToast("クリップボードへのアクセスが許可されていません");
        } else if (error.name === "NotFoundError") {
            showToast("クリップボードが空です");
        } else {
            showToast("クリップボードを読み取れませんでした");
        }
    }
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

// ============================================================
// Phase 1: Learning DB (GAS + Sheets), Save Cards, Cards View
// ============================================================

// ---- Language Detection (rough heuristics) ----
function detectSourceLang(text) {
    const explicit = sourceLang.value;
    if (explicit && explicit !== "auto") return explicit;

    const hiraKata = /[\u3040-\u309F\u30A0-\u30FF]/;
    const hangul = /[\uAC00-\uD7AF]/;
    const cjk = /[\u4E00-\u9FFF]/;
    const thai = /[\u0E00-\u0E7F]/;
    const arabic = /[\u0600-\u06FF]/;
    const cyrillic = /[\u0400-\u04FF]/;

    if (hiraKata.test(text)) return "ja";
    if (hangul.test(text)) return "ko";
    if (thai.test(text)) return "th";
    if (arabic.test(text)) return "ar";
    if (cjk.test(text)) return "zh";
    if (cyrillic.test(text)) return "ru";
    // Default fallback for Latin-script text
    return "en";
}

// ---- Pair Key Normalization ----
// ja↔en is the same pair "en-ja" (alphabetical order)
function makePairKey(langA, langB) {
    const [a, b] = [langA, langB].sort();
    return `${a}-${b}`;
}

// Normalize a pair so that langA < langB alphabetically
function normalizePair(srcLang, srcText, tgtLang, tgtText) {
    if (srcLang <= tgtLang) {
        return { langA: srcLang, textA: srcText, langB: tgtLang, textB: tgtText };
    }
    return { langA: tgtLang, textA: tgtText, langB: srcLang, textB: srcText };
}

// ============================================================
// GAS API Wrapper
// ============================================================

function getGasUrl() {
    return localStorage.getItem(STORAGE_KEY_GAS_URL) || "";
}

function loadGasUrl() {
    gasUrlInput.value = getGasUrl();
}

async function saveGasUrl() {
    const url = gasUrlInput.value.trim();
    if (!url) {
        gasStatus.textContent = "URLを入力してください";
        gasStatus.className = "key-status error";
        return;
    }
    if (!url.startsWith("https://script.google.com/")) {
        gasStatus.textContent = "Apps ScriptのURLではないようです";
        gasStatus.className = "key-status error";
        return;
    }

    gasStatus.textContent = "接続テスト中...";
    gasStatus.className = "key-status";

    try {
        localStorage.setItem(STORAGE_KEY_GAS_URL, url);
        const result = await gasGet("ping");
        if (result && result.ok) {
            gasStatus.textContent = "接続成功！保存しました";
            gasStatus.className = "key-status success";
            // Fetch data after successful connection
            fetchAllFromDb().catch(() => {});
        } else {
            throw new Error("応答が不正です");
        }
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY_GAS_URL);
        gasStatus.textContent = `接続失敗: ${error.message || error}`;
        gasStatus.className = "key-status error";
    }
}

function loadAutoplayDelay() {
    const stored = localStorage.getItem(STORAGE_KEY_AUTOPLAY_DELAY);
    autoplayDelaySelect.value = stored || String(DEFAULT_AUTOPLAY_DELAY);
    renderAutoplayDelayPills();
}

function renderAutoplayDelayPills() {
    const container = document.getElementById("autoplay-delay-pills");
    if (!container) return;
    const values = [5, 10, 15, 20, 30, 45, 60];
    const current = parseInt(autoplayDelaySelect.value) || DEFAULT_AUTOPLAY_DELAY;
    container.innerHTML = "";
    values.forEach((v) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pill-option" + (v === current ? " active" : "");
        btn.textContent = `${v}秒`;
        btn.addEventListener("click", () => {
            autoplayDelaySelect.value = String(v);
            localStorage.setItem(STORAGE_KEY_AUTOPLAY_DELAY, String(v));
            renderAutoplayDelayPills();
        });
        container.appendChild(btn);
    });
}

async function gasGet(action, params = {}) {
    const url = getGasUrl();
    if (!url) throw new Error("学習DBのURLが未設定です");
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${url}?${qs}`, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "API error");
    return data.data;
}

async function gasPost(action, body = {}) {
    const url = getGasUrl();
    if (!url) throw new Error("学習DBのURLが未設定です");
    // Use text/plain to avoid CORS preflight
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...body }),
        redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "API error");
    return data.data;
}

// High-level DB operations
async function fetchAllFromDb(showFeedback = false) {
    try {
        const data = await gasGet("listAll");
        cardsCache = data.pairs || [];
        scoresCache = data.scores || [];
        if (cardsView.style.display !== "none") renderCards();
        if (showFeedback) showToast(`${cardsCache.length} 件のカードを取得しました`);
    } catch (error) {
        if (showFeedback) showToast(`取得失敗: ${error.message}`);
    }
}

async function dbSavePair(pair) {
    return gasPost("savePair", { pair });
}

async function dbUpdatePair(pair) {
    return gasPost("updatePair", { pair });
}

async function dbDeletePair(id) {
    return gasPost("deletePair", { id });
}

// ============================================================
// Save Card Modal
// ============================================================

function openSaveModal() {
    if (!getGasUrl()) {
        showToast("先に設定から学習DBのURLを登録してください");
        openSettings();
        return;
    }

    const srcLang = lastDetectedSrcLang || detectSourceLang(lastSourceText);
    const tgtLang = currentTargetLang;
    const tgtTextRaw = translationCache[activeStyle] || "";

    // Detect selection
    let srcSelected = getSourceSelection();
    let tgtSelected = getResultSelection();

    const srcText = srcSelected || lastSourceText;
    const tgtText = tgtSelected || tgtTextRaw;

    if (srcSelected || tgtSelected) {
        saveSelectionNote.style.display = "block";
    } else {
        saveSelectionNote.style.display = "none";
    }

    saveSrcLangSelect.value = srcLang;
    saveTgtLangSelect.value = tgtLang;
    updateSaveLangLabels();
    saveSrcText.value = srcText;
    saveTgtText.value = tgtText;

    const styleLabel = { normal: "ノーマル", casual: "カジュアル", formal: "フォーマル", advanced: "アドバンス" }[activeStyle];
    saveStyleHint.textContent = `保存するスタイル: ${styleLabel}`;

    saveStatus.textContent = "";
    saveStatus.className = "key-status";
    extractCandidates.innerHTML = "";
    saveExtractConfirmBtn.style.display = "none";
    switchSaveTab("edit");

    saveModal.style.display = "flex";

    // Language select sync
    saveSrcLangSelect.onchange = updateSaveLangLabels;
    saveTgtLangSelect.onchange = updateSaveLangLabels;
}

function updateSaveLangLabels() {
    saveSrcLangLabel.textContent = LANG_SHORT[saveSrcLangSelect.value] || saveSrcLangSelect.value;
    saveTgtLangLabel.textContent = LANG_SHORT[saveTgtLangSelect.value] || saveTgtLangSelect.value;
}

function closeSaveModal() {
    saveModal.style.display = "none";
}

function switchSaveTab(tab) {
    saveTabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    saveEditPanel.style.display = tab === "edit" ? "block" : "none";
    saveExtractPanel.style.display = tab === "extract" ? "block" : "none";
}

function getSourceSelection() {
    if (document.activeElement === sourceText || sourceText.selectionStart !== sourceText.selectionEnd) {
        const start = sourceText.selectionStart;
        const end = sourceText.selectionEnd;
        if (start !== end) {
            return sourceText.value.substring(start, end).trim();
        }
    }
    return null;
}

function getResultSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const selected = sel.toString().trim();
    if (!selected) return null;
    // Check if selection is within the result text area
    const range = sel.getRangeAt(0);
    const container = document.getElementById("result-text");
    if (container && container.contains(range.commonAncestorContainer)) {
        return selected;
    }
    return null;
}

async function confirmSaveCard() {
    const srcLangVal = saveSrcLangSelect.value;
    const tgtLangVal = saveTgtLangSelect.value;
    const srcTextVal = saveSrcText.value.trim();
    const tgtTextVal = saveTgtText.value.trim();

    if (!srcTextVal || !tgtTextVal) {
        saveStatus.textContent = "両方のテキストを入力してください";
        saveStatus.className = "key-status error";
        return;
    }
    if (srcLangVal === tgtLangVal) {
        saveStatus.textContent = "翻訳元と訳文の言語が同じです";
        saveStatus.className = "key-status error";
        return;
    }

    const normalized = normalizePair(srcLangVal, srcTextVal, tgtLangVal, tgtTextVal);
    const pair = {
        pairKey: makePairKey(srcLangVal, tgtLangVal),
        langA: normalized.langA,
        textA: normalized.textA,
        langB: normalized.langB,
        textB: normalized.textB,
        style: activeStyle,
    };

    saveStatus.textContent = "保存中...";
    saveStatus.className = "key-status";
    saveConfirmBtn.disabled = true;

    try {
        const result = await dbSavePair(pair);
        if (result.skipped) {
            saveStatus.textContent = "同じカードが既に存在します (スキップ)";
            saveStatus.className = "key-status success";
        } else {
            saveStatus.textContent = "保存しました！";
            saveStatus.className = "key-status success";
            // Update local cache
            cardsCache.push({
                id: result.id,
                ...pair,
                createdAt: new Date().toISOString(),
            });
        }
        setTimeout(closeSaveModal, 1000);
    } catch (error) {
        saveStatus.textContent = `保存失敗: ${error.message}`;
        saveStatus.className = "key-status error";
    } finally {
        saveConfirmBtn.disabled = false;
    }
}

// ---- AI Extraction ----
async function runExtraction() {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast("Gemini APIキーが必要です");
        return;
    }
    if (!lastSourceText) {
        showToast("翻訳結果がありません");
        return;
    }

    const btnTxt = extractStartBtn.querySelector(".btn-text");
    const btnLoad = extractStartBtn.querySelector(".btn-loading");
    btnTxt.style.display = "none";
    btnLoad.style.display = "inline-flex";
    extractStartBtn.disabled = true;

    try {
        const srcLang = lastDetectedSrcLang || detectSourceLang(lastSourceText);
        const tgtLang = currentTargetLang;
        const srcName = LANG_NAMES[srcLang] || srcLang;
        const tgtName = LANG_NAMES[tgtLang] || tgtLang;
        const tgtTextRaw = translationCache[activeStyle] || translationCache.normal;

        const prompt = `You are a language-learning assistant.

From this translation pair, extract 3-6 SHORT phrases or idioms that are most valuable for a learner. Each phrase should be a compact, memorizable unit (word, phrase, or short clause).

Return ONLY a JSON array (no markdown fences, no extra text):
[
  { "source": "${srcName} phrase", "target": "${tgtName} phrase" },
  ...
]

Source (${srcName}):
${lastSourceText}

Translation (${tgtName}):
${tgtTextRaw}`;

        const raw = await callGemini(apiKey, prompt);
        const jsonStr = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const items = JSON.parse(jsonStr);

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("抽出結果が空でした");
        }

        extractItems = items;
        renderExtractCandidates();
    } catch (error) {
        showToast(`抽出失敗: ${error.message}`);
    } finally {
        btnTxt.style.display = "inline";
        btnLoad.style.display = "none";
        extractStartBtn.disabled = false;
    }
}

function renderExtractCandidates() {
    extractCandidates.innerHTML = "";
    extractItems.forEach((item, idx) => {
        const el = document.createElement("div");
        el.className = "extract-item selected";
        el.dataset.index = idx;
        el.innerHTML = `
            <div class="extract-checkbox">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="extract-item-content">
                <div class="extract-text-a"></div>
                <div class="extract-text-b"></div>
            </div>
        `;
        el.querySelector(".extract-text-a").textContent = item.source;
        el.querySelector(".extract-text-b").textContent = item.target;

        el.addEventListener("click", () => {
            el.classList.toggle("selected");
            updateExtractCount();
        });

        extractCandidates.appendChild(el);
    });
    saveExtractConfirmBtn.style.display = "block";
    updateExtractCount();
}

function updateExtractCount() {
    const count = extractCandidates.querySelectorAll(".extract-item.selected").length;
    extractCountEl.textContent = count;
    saveExtractConfirmBtn.disabled = count === 0;
}

async function confirmExtractSave() {
    const selected = Array.from(extractCandidates.querySelectorAll(".extract-item.selected"));
    if (selected.length === 0) return;

    const srcLang = saveSrcLangSelect.value;
    const tgtLang = saveTgtLangSelect.value;

    saveExtractConfirmBtn.disabled = true;
    saveStatus.textContent = "保存中...";
    saveStatus.className = "key-status";

    let savedCount = 0;
    let skippedCount = 0;

    for (const el of selected) {
        const idx = parseInt(el.dataset.index);
        const item = extractItems[idx];
        if (!item) continue;

        const normalized = normalizePair(srcLang, item.source, tgtLang, item.target);
        const pair = {
            pairKey: makePairKey(srcLang, tgtLang),
            langA: normalized.langA,
            textA: normalized.textA,
            langB: normalized.langB,
            textB: normalized.textB,
            style: `extract:${activeStyle}`,
        };

        try {
            const result = await dbSavePair(pair);
            if (result.skipped) {
                skippedCount++;
            } else {
                savedCount++;
                cardsCache.push({
                    id: result.id,
                    ...pair,
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            // Continue with others
        }
    }

    saveStatus.textContent = `${savedCount}件保存、${skippedCount}件スキップ`;
    saveStatus.className = "key-status success";
    saveExtractConfirmBtn.disabled = false;
    setTimeout(closeSaveModal, 1500);
}

// ============================================================
// Cards View
// ============================================================

function renderCards() {
    const query = (cardsSearch.value || "").trim().toLowerCase();

    let filtered = cardsCache;
    if (query) {
        filtered = filtered.filter((c) =>
            (c.textA || "").toLowerCase().includes(query) ||
            (c.textB || "").toLowerCase().includes(query) ||
            (c.pairKey || "").toLowerCase().includes(query)
        );
    }

    // Sort by createdAt desc
    filtered = [...filtered].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
    });

    cardsCount.textContent = `${filtered.length} 件${query ? ` / ${cardsCache.length}件中` : ""}`;

    if (filtered.length === 0) {
        cardsListEl.innerHTML = "";
        cardsEmpty.style.display = cardsCache.length === 0 ? "block" : "none";
        if (cardsCache.length > 0) {
            cardsListEl.innerHTML = `<p style="text-align:center; padding:40px 20px; color:var(--text-secondary);">該当するカードがありません</p>`;
        }
        return;
    }

    cardsEmpty.style.display = "none";
    cardsListEl.innerHTML = "";
    filtered.forEach((card) => {
        const item = document.createElement("div");
        item.className = "card-item";
        item.innerHTML = `
            <span class="card-pair-tag">${escapeHtml(card.langA || "")}↔${escapeHtml(card.langB || "")}</span>
            ${card.style ? `<span class="card-style-tag">${escapeHtml(card.style)}</span>` : ""}
            <div class="card-text-a"></div>
            <div class="card-text-b"></div>
        `;
        item.querySelector(".card-text-a").textContent = card.textA || "";
        item.querySelector(".card-text-b").textContent = card.textB || "";

        item.addEventListener("click", () => openCardEdit(card));
        cardsListEl.appendChild(item);
    });
}

function openCardEdit(card) {
    currentEditingCardId = card.id;
    editLangA.textContent = `${LANG_NAMES[card.langA] || card.langA}`;
    editLangB.textContent = `${LANG_NAMES[card.langB] || card.langB}`;
    editTextA.value = card.textA || "";
    editTextB.value = card.textB || "";
    cardEditModal.style.display = "flex";
}

function closeCardEditModal() {
    cardEditModal.style.display = "none";
    currentEditingCardId = null;
}

async function confirmUpdateCard() {
    if (!currentEditingCardId) return;
    const textA = editTextA.value.trim();
    const textB = editTextB.value.trim();
    if (!textA || !textB) {
        showToast("両方のテキストを入力してください");
        return;
    }

    cardUpdateBtn.disabled = true;
    try {
        await dbUpdatePair({ id: currentEditingCardId, textA, textB });
        // Update local cache
        const card = cardsCache.find((c) => c.id === currentEditingCardId);
        if (card) { card.textA = textA; card.textB = textB; }
        renderCards();
        showToast("更新しました");
        closeCardEditModal();
    } catch (error) {
        showToast(`更新失敗: ${error.message}`);
    } finally {
        cardUpdateBtn.disabled = false;
    }
}

async function confirmDeleteCard() {
    if (!currentEditingCardId) return;
    if (!confirm("このカードを削除しますか？\n(関連するスコアも削除されます)")) return;

    cardDeleteBtn.disabled = true;
    try {
        await dbDeletePair(currentEditingCardId);
        cardsCache = cardsCache.filter((c) => c.id !== currentEditingCardId);
        scoresCache = scoresCache.filter((s) => s.pairId !== currentEditingCardId);
        renderCards();
        showToast("削除しました");
        closeCardEditModal();
    } catch (error) {
        showToast(`削除失敗: ${error.message}`);
    } finally {
        cardDeleteBtn.disabled = false;
    }
}

// ============================================================
// Phase 2: Study Mode (SM-2 simplified)
// ============================================================

// Study state
const study = {
    active: false,
    pairKey: null,
    direction: "a_to_b", // a_to_b or b_to_a
    currentCard: null,
    currentQuestionLang: null,
    currentAnswerLang: null,
    sessionCount: 0,
    answered: false,
    autoplay: false,
    autoplayTimer: null,
    autoplayPhase: null, // "question" | "show_answer" | "next" | null
    voiceFeedback: false,
    recognition: null,
};

// ---- Score helpers ----
function getScoreKey(direction) {
    // direction is stored as "a_to_b" or "b_to_a"
    return direction;
}

function findScore(pairId, direction) {
    return scoresCache.find((s) => s.pairId === pairId && s.direction === direction);
}

function defaultScore() {
    return { easeFactor: 2.5, interval: 0, nextReview: null, lastReviewed: null, repetitions: 0 };
}

// SM-2 simplified
// quality: 1 = わからない / 3 = 時間かかった / 5 = 覚えた
function sm2Update(prev, quality) {
    const next = {
        easeFactor: prev.easeFactor || 2.5,
        interval: prev.interval || 0,
        repetitions: prev.repetitions || 0,
    };

    if (quality < 3) {
        // Failed: reset to short interval
        next.repetitions = 0;
        next.interval = 0; // 今日もう一度
    } else {
        next.repetitions = (next.repetitions || 0) + 1;
        if (next.repetitions === 1) next.interval = 1;
        else if (next.repetitions === 2) next.interval = 6;
        else next.interval = Math.round((next.interval || 1) * next.easeFactor);
    }

    // Update ease factor
    next.easeFactor = next.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (next.easeFactor < 1.3) next.easeFactor = 1.3;
    if (next.easeFactor > 3.0) next.easeFactor = 3.0;

    const now = new Date();
    const nextDate = new Date(now.getTime() + next.interval * 24 * 60 * 60 * 1000);
    return {
        ...next,
        easeFactor: Math.round(next.easeFactor * 1000) / 1000,
        nextReview: nextDate.toISOString(),
        lastReviewed: now.toISOString(),
    };
}

// Cards by pair and learning status
function getCardsByPair(pairKey) {
    return cardsCache.filter((c) => c.pairKey === pairKey);
}

function isDue(score) {
    if (!score || !score.nextReview) return true; // never learned
    return new Date(score.nextReview).getTime() <= Date.now();
}

// Weighted random pick: overdue cards get higher weight; new cards get priority too
function pickNextCard(pairKey, direction) {
    const cards = getCardsByPair(pairKey);
    if (cards.length === 0) return null;

    const now = Date.now();
    const weighted = cards.map((card) => {
        const score = findScore(card.id, direction);
        let weight;
        if (!score) {
            weight = 5; // unlearned — high priority but not overwhelming
        } else if (!score.nextReview || new Date(score.nextReview).getTime() <= now) {
            // overdue: weight by how overdue it is (max 10)
            const overdueHours = score.nextReview
                ? (now - new Date(score.nextReview).getTime()) / (60 * 60 * 1000)
                : 24;
            weight = Math.min(10, 3 + overdueHours / 24);
        } else {
            weight = 0.3; // not yet due — low priority (still possible but rare)
        }
        // Avoid repeating the exact same card right after
        if (study.currentCard && study.currentCard.id === card.id) {
            weight *= 0.15;
        }
        return { card, weight };
    });

    const totalWeight = weighted.reduce((s, x) => s + x.weight, 0);
    if (totalWeight === 0) return cards[0];

    let r = Math.random() * totalWeight;
    for (const item of weighted) {
        r -= item.weight;
        if (r <= 0) return item.card;
    }
    return weighted[weighted.length - 1].card;
}

// ---- Study view init ----
function initStudyView() {
    // Ensure we have cards
    if (cardsCache.length === 0) {
        studySetup.style.display = "none";
        studySession.style.display = "none";
        studyEmpty.style.display = "block";
        if (getGasUrl()) fetchAllFromDb().catch(() => {});
        return;
    }

    studySetup.style.display = "block";
    studySession.style.display = "none";
    studyEmpty.style.display = "none";

    // Populate pair selector with unique pairKeys
    const pairKeys = [...new Set(cardsCache.map((c) => c.pairKey))].sort();
    const prevValue = studyPairSelect.value;
    studyPairSelect.innerHTML = "";
    pairKeys.forEach((key) => {
        const opt = document.createElement("option");
        opt.value = key;
        const [a, b] = key.split("-");
        const count = cardsCache.filter((c) => c.pairKey === key).length;
        opt.textContent = `${LANG_NAMES[a] || a} ↔ ${LANG_NAMES[b] || b} (${count}枚)`;
        studyPairSelect.appendChild(opt);
    });
    if (prevValue && pairKeys.includes(prevValue)) {
        studyPairSelect.value = prevValue;
    }

    updateDirectionButtons();
    updateStudyStats();
}

function updateDirectionButtons() {
    const pairKey = studyPairSelect.value;
    if (!pairKey) return;
    const [a, b] = pairKey.split("-");
    const btns = directionToggle.querySelectorAll(".direction-btn");
    // a_to_b: langA → langB (show A, answer B)
    btns[0].querySelector(".dir-from").textContent = LANG_SHORT[a] || a;
    btns[0].querySelector(".dir-to").textContent = LANG_SHORT[b] || b;
    // b_to_a
    btns[1].querySelector(".dir-from").textContent = LANG_SHORT[b] || b;
    btns[1].querySelector(".dir-to").textContent = LANG_SHORT[a] || a;
}

function getActiveDirection() {
    const active = directionToggle.querySelector(".direction-btn.active");
    return active ? active.dataset.direction : "a_to_b";
}

function updateStudyStats() {
    updateDirectionButtons();
    const pairKey = studyPairSelect.value;
    const direction = getActiveDirection();
    const cards = pairKey ? getCardsByPair(pairKey) : [];

    let due = 0;
    let newCount = 0;
    let learned = 0;
    const now = Date.now();
    cards.forEach((c) => {
        const s = findScore(c.id, direction);
        if (!s) {
            newCount++;
        } else if (!s.nextReview || new Date(s.nextReview).getTime() <= now) {
            due++;
        } else {
            learned++;
        }
    });

    statTotal.textContent = cards.length;
    statDue.textContent = due;
    statNew.textContent = newCount;
    statLearned.textContent = learned;

    studyStartBtn.disabled = cards.length === 0;
}

// ---- Session ----
function startStudySession() {
    const pairKey = studyPairSelect.value;
    if (!pairKey) return;
    if (getCardsByPair(pairKey).length === 0) {
        showToast("このペアにカードがありません");
        return;
    }

    // Initialize AudioContext on user gesture so it can later force
    // playback audio session on iOS after the mic is used.
    ensureAudioContext();

    study.active = true;
    study.pairKey = pairKey;
    study.direction = getActiveDirection();
    study.sessionCount = 0;
    study.currentCard = null;

    studySetup.style.display = "none";
    studySession.style.display = "block";
    studyEmpty.style.display = "none";

    loadNextCard();
}

function loadNextCard() {
    clearAutoplayTimer();

    const card = pickNextCard(study.pairKey, study.direction);
    if (!card) {
        showToast("カードが選択できませんでした");
        exitStudySession();
        return;
    }

    study.currentCard = card;
    study.answered = false;
    study.sessionCount++;

    const [a, b] = card.pairKey.split("-");
    let qLang, qText, aLang, aText;
    if (study.direction === "a_to_b") {
        qLang = a; qText = card.textA;
        aLang = b; aText = card.textB;
    } else {
        qLang = b; qText = card.textB;
        aLang = a; aText = card.textA;
    }

    study.currentQuestionLang = qLang;
    study.currentAnswerLang = aLang;

    questionLangTag.textContent = LANG_NAMES[qLang] || qLang;
    questionTextEl.textContent = qText;
    answerLangTag.textContent = LANG_NAMES[aLang] || aLang;
    answerTextEl.textContent = aText;

    answerBlock.style.display = "none";
    showAnswerBtn.style.display = "block";
    feedbackButtons.style.display = "none";
    autoplayCountdown.style.display = "none";
    voiceListenHint.style.display = "none";

    sessionProgress.textContent = `${study.sessionCount} 問目`;

    // Force audio to playback mode before TTS (iOS audio session workaround)
    nudgeAudioToPlayback();

    // Auto-speak question, then chain countdown if autoplay.
    // Longer delay gives iOS time to switch audio session from record → playback.
    setTimeout(() => {
        if (!study.active || study.answered) return;
        speakText(qText, qLang, () => {
            if (study.autoplay && study.active && !study.answered) {
                startCountdown(() => {
                    if (study.active && !study.answered) revealAnswer();
                });
            }
        });
    }, 350);
}

function revealAnswer() {
    if (!study.currentCard) return;
    clearAutoplayTimer();

    answerBlock.style.display = "block";
    showAnswerBtn.style.display = "none";
    feedbackButtons.style.display = "grid";

    // Ensure playback audio mode before speaking the answer
    nudgeAudioToPlayback();

    // Auto-speak answer, then chain next-card countdown if autoplay
    setTimeout(() => {
        if (!study.active) return;
        speakText(answerTextEl.textContent, study.currentAnswerLang, () => {
            if (study.autoplay && study.active && !study.answered) {
                // Start voice recognition if enabled (listens during countdown)
                if (study.voiceFeedback) {
                    startVoiceRecognition((quality, transcript) => {
                        submitFeedback(quality, { fromVoice: true });
                    });
                }
                startCountdown(() => {
                    stopVoiceRecognition();
                    // No feedback given → skip scoring
                    if (study.active && !study.answered) {
                        study.answered = true;
                        loadNextCard();
                    }
                }, { listening: study.voiceFeedback });
            }
        });
    }, 200);
}

async function submitFeedback(quality, opts = {}) {
    if (!study.currentCard || study.answered) return;
    study.answered = true;
    clearAutoplayTimer();
    stopVoiceRecognition();

    // Visual confirmation: highlight the matched button
    highlightFeedbackButton(quality);

    const card = study.currentCard;
    const direction = study.direction;
    const prev = findScore(card.id, direction) || defaultScore();
    const updated = sm2Update(prev, quality);

    const scoreData = {
        pairId: card.id,
        direction,
        ...updated,
    };

    // Update local cache immediately (optimistic)
    const existing = scoresCache.find((s) => s.pairId === card.id && s.direction === direction);
    if (existing) {
        Object.assign(existing, scoreData);
    } else {
        scoresCache.push(scoreData);
    }

    // Post to GAS (non-blocking)
    gasPost("updateScore", { score: scoreData }).catch((err) => {
        // Silent fail — local cache is still correct, will sync on next fetch
        console.warn("Score sync failed:", err);
    });

    // Next card — when source was voice, give enough time to see the button highlight
    const nextDelay = opts.fromVoice ? 1900 : 400;
    setTimeout(() => {
        if (study.active) loadNextCard();
    }, nextDelay);
}

function highlightFeedbackButton(quality) {
    const cls = { 1: "feedback-hard", 3: "feedback-medium", 5: "feedback-easy" }[quality];
    if (!cls) return;
    const btn = feedbackButtons.querySelector(`.${cls}`);
    if (!btn) return;
    btn.classList.add("matched");
    setTimeout(() => btn.classList.remove("matched"), 1800);
}

function exitStudySession(opts = {}) {
    const wasActive = study.active;

    // Set all flags FIRST so any in-flight async callbacks abort
    study.active = false;
    study.autoplay = false;
    study.answered = true;
    study.currentCard = null;

    clearAutoplayTimer();
    stopVoiceRecognition();
    killTTS();

    if (!wasActive && opts.silent) return;

    if (studyView.style.display === "none") return; // view already switched away

    studySession.style.display = "none";
    studySetup.style.display = "block";
    updateStudyStats();
    autoplayToggleBtn.classList.remove("active");
    autoplayCountdown.style.display = "none";
}

// iOS-safe TTS cancellation: pause + cancel + retry
function killTTS() {
    if (typeof speechSynthesis === "undefined") return;
    try {
        speechSynthesis.pause();
        speechSynthesis.cancel();
    } catch {}
    // Some iOS versions need a second cancel after a tick
    setTimeout(() => {
        try {
            if (speechSynthesis.speaking || speechSynthesis.pending) {
                speechSynthesis.cancel();
            }
        } catch {}
    }, 80);
}

// ---- TTS helper (used by study mode) ----
function speakText(text, lang, onDone) {
    const done = onDone || (() => {});
    if (!text) { done(); return; }
    if (typeof speechSynthesis === "undefined") { done(); return; }

    try { speechSynthesis.cancel(); } catch {}

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = LANG_TTS[lang] || "en-US";
    utterance.lang = langCode;
    utterance.rate = 0.9;

    const voices = speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
    if (match) utterance.voice = match;

    let fired = false;
    const fire = () => {
        if (fired) return;
        fired = true;
        // If study was exited while speaking, don't fire chain callbacks
        if (typeof study !== "undefined" && study && !study.active && study.currentCard === null) {
            // in-flight TTS after exit — swallow the callback
            return;
        }
        done();
    };
    utterance.onend = fire;
    utterance.onerror = fire;

    speechSynthesis.speak(utterance);
}

// ---- Autoplay ----
function toggleAutoplay() {
    study.autoplay = !study.autoplay;
    autoplayToggleBtn.classList.toggle("active", study.autoplay);
    if (study.autoplay) {
        showToast("自動再生ON");
        // If user enables autoplay mid-session, kick off next-step countdown
        if (study.currentCard && !study.answered && !speechSynthesis.speaking) {
            if (answerBlock.style.display === "none") {
                startCountdown(() => revealAnswer());
            } else {
                // Answer is already visible → start voice recognition too
                if (study.voiceFeedback) {
                    startVoiceRecognition((quality, transcript) => {
                        submitFeedback(quality, { fromVoice: true });
                    });
                }
                startCountdown(() => {
                    stopVoiceRecognition();
                    study.answered = true;
                    loadNextCard();
                }, { listening: study.voiceFeedback });
            }
        }
    } else {
        showToast("自動再生OFF");
        clearAutoplayTimer();
        stopVoiceRecognition();
        autoplayCountdown.style.display = "none";
    }
}

function startCountdown(callback, opts = {}) {
    clearAutoplayTimer();
    if (!study.autoplay || !study.active) return;

    const delay = parseInt(autoplayDelaySelect.value) || DEFAULT_AUTOPLAY_DELAY;
    let remaining = delay;

    autoplayCountdown.style.display = "block";
    countdownValue.textContent = remaining;

    // Show voice listening hint if applicable
    if (opts.listening) {
        voiceListenHint.style.display = "block";
    } else {
        voiceListenHint.style.display = "none";
    }

    study.autoplayTimer = setInterval(() => {
        remaining--;
        countdownValue.textContent = remaining;
        if (remaining <= 0) {
            clearAutoplayTimer();
            autoplayCountdown.style.display = "none";
            voiceListenHint.style.display = "none";
            if (study.active && study.autoplay) callback();
        }
    }, 1000);
}

function clearAutoplayTimer() {
    if (study.autoplayTimer) {
        clearInterval(study.autoplayTimer);
        study.autoplayTimer = null;
    }
}

// ---- Voice Feedback (speech recognition during countdown) ----
function loadVoiceFeedback() {
    const stored = localStorage.getItem(STORAGE_KEY_VOICE_FEEDBACK) === "true";
    study.voiceFeedback = stored;
    if (voiceFeedbackBtn) {
        voiceFeedbackBtn.classList.toggle("active", stored);
    }
}

function toggleVoiceFeedback() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("このブラウザは音声認識に対応していません");
        return;
    }
    study.voiceFeedback = !study.voiceFeedback;
    localStorage.setItem(STORAGE_KEY_VOICE_FEEDBACK, String(study.voiceFeedback));
    voiceFeedbackBtn.classList.toggle("active", study.voiceFeedback);
    showToast(study.voiceFeedback ? "音声フィードバックON" : "音声フィードバックOFF");
    if (!study.voiceFeedback) {
        stopVoiceRecognition();
        voiceListenHint.style.display = "none";
    }
}

function matchFeedbackCommand(text) {
    if (!text) return null;
    const lower = text.toLowerCase();

    // Quality 5: 覚えた / 簡単
    if (/覚え|分かった|わかった|かんたん|簡単|大丈夫|おっけ|オッケ|完璧|余裕/i.test(text)) return 5;
    if (/(^|\s)(ok|okay|easy)(\s|$|[.,!?])/i.test(lower)) return 5;

    // Quality 1: わからない / 無理 / 難しい
    if (/わから|わかんな|むり|無理|難しい|難しかった|ダメ|だめ|できない|知らない/.test(text)) return 1;
    if (/(^|\s)(no|hard|nope)(\s|$|[.,!?])/i.test(lower)) return 1;

    // Quality 3: 時間 / 遅い / 迷った (check last to avoid precedence)
    if (/時間|遅い|遅かっ|迷っ|ちょっと|もう少し|あやふや|微妙|ややこし/.test(text)) return 3;

    return null;
}

function startVoiceRecognition(onMatch) {
    stopVoiceRecognition();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = (event.results[i][0].transcript || "").trim();
            if (!transcript) continue;
            const quality = matchFeedbackCommand(transcript);
            if (quality !== null) {
                stopVoiceRecognition();
                onMatch(quality, transcript);
                return;
            }
        }
    };

    recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            showToast("マイクの使用が許可されていません");
            study.voiceFeedback = false;
            voiceFeedbackBtn.classList.remove("active");
            localStorage.setItem(STORAGE_KEY_VOICE_FEEDBACK, "false");
        }
        // Other errors are silently ignored (no-speech, aborted, etc.)
    };

    recognition.onend = () => {
        // No aggressive auto-restart — this caused UI freezes on iOS.
        // Recognition runs long enough for most countdown durations.
    };

    study.recognition = recognition;

    try {
        recognition.start();
        return true;
    } catch (e) {
        // Recognition already running or browser issue
        return false;
    }
}

function stopVoiceRecognition() {
    const wasRunning = !!study.recognition;
    if (study.recognition) {
        const r = study.recognition;
        study.recognition = null;
        try { r.onend = null; r.onresult = null; r.onerror = null; r.stop(); } catch {}
    }
    voiceListenHint.style.display = "none";
    // iOS: after microphone stops, audio session stays in "record" mode which
    // degrades TTS quality to earpiece-call-mode. Nudge it back to playback.
    if (wasRunning) nudgeAudioToPlayback();
}

// ---- Audio session helper (iOS playback mode switch) ----
let _audioCtx = null;

function ensureAudioContext() {
    if (_audioCtx) return _audioCtx;
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        _audioCtx = new AC();
    } catch {
        return null;
    }
    return _audioCtx;
}

function nudgeAudioToPlayback() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }
        // Playing a silent 1-sample buffer nudges iOS to switch audio session
        // from "record" back to "playback" category. Without this, TTS after
        // speech-recognition sounds like a phone-call (low-quality earpiece).
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
    } catch {}
}

// ---- Start ----
init();
