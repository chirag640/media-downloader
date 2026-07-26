// DOM Elements
const toastContainer = document.getElementById("toast-container");
const dropzoneOverlay = document.getElementById("dropzone-overlay");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");

const healthStatusBadge = document.getElementById("health-status-badge");
const ffmpegStatusTxt = document.getElementById("ffmpeg-status-txt");

const openDiagnosticsBtn = document.getElementById("open-diagnostics-btn");
const closeDiagnosticsBtn = document.getElementById("close-diagnostics-btn");
const refreshDiagnosticsBtn = document.getElementById("refresh-diagnostics-btn");
const diagnosticsModal = document.getElementById("diagnostics-modal");
const diagFfmpeg = document.getElementById("diag-ffmpeg");
const diagFfprobe = document.getElementById("diag-ffprobe");
const diagNode = document.getElementById("diag-node");
const diagYtdlp = document.getElementById("diag-ytdlp");
const diagDisk = document.getElementById("diag-disk");
const ffmpegWarningBanner = document.getElementById("ffmpeg-warning-banner");

const qrModal = document.getElementById("qr-modal");
const openQrBtn = document.getElementById("open-qr-btn");
const closeQrBtn = document.getElementById("close-qr-btn");
const qrCodeContainer = document.getElementById("qr-code-container");

const transcriptModal = document.getElementById("transcript-modal");
const openTranscriptBtn = document.getElementById("open-transcript-btn");
const closeTranscriptBtn = document.getElementById("close-transcript-btn");
const transcriptTextarea = document.getElementById("transcript-textarea");
const copyTranscriptBtn = document.getElementById("copy-transcript-btn");

const analyzeForm = document.getElementById("analyze-form");
const batchForm = document.getElementById("batch-form");
const downloadForm = document.getElementById("download-form");
const analyzeButton = document.getElementById("analyze-button");
const pasteButton = document.getElementById("paste-button");
const clearButton = document.getElementById("clear-button");
const downloadButton = document.getElementById("download-button");
const batchButton = document.getElementById("batch-button");
const urlInput = document.getElementById("url");
const batchUrlsTextarea = document.getElementById("batch-urls");
const cookiesBrowserSelect = document.getElementById("cookies-browser");

const modeSingleBtn = document.getElementById("mode-single-btn");
const modeBatchBtn = document.getElementById("mode-batch-btn");

const skeletonLoader = document.getElementById("skeleton-loader");
const searchResultsSection = document.getElementById("search-results-section");
const searchResultsGrid = document.getElementById("search-results-grid");

const previewSection = document.getElementById("preview-section");
const resolutionGrid = document.getElementById("resolution-grid");

const playlistPickerContainer = document.getElementById("playlist-picker-container");
const selectedItemCountSpan = document.getElementById("selected-item-count");
const selectAllBtn = document.getElementById("select-all-btn");
const deselectAllBtn = document.getElementById("deselect-all-btn");
const playlistItemsList = document.getElementById("playlist-items-list");

const progressSection = document.getElementById("progress-section");
const historySection = document.getElementById("history-section");
const historyToggleBtn = document.getElementById("history-toggle-btn");
const historyCountBadge = document.getElementById("history-count-badge");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const purgeDiskBtn = document.getElementById("purge-disk-btn");
const emptyHistoryMsg = document.getElementById("empty-history-msg");

const errorBox = document.getElementById("error");
const errorMessage = document.getElementById("error-message");

const qualitySelect = document.getElementById("quality");
const qualityGroup = document.getElementById("quality-group");
const audioFormatSelect = document.getElementById("audio-format");
const audioFormatGroup = document.getElementById("audio-format-group");
const audioBitrateSelect = document.getElementById("audio-bitrate");
const audioBitrateGroup = document.getElementById("audio-bitrate-group");
const audioEffectSelect = document.getElementById("audio-effect");
const audioEffectGroup = document.getElementById("audio-effect-group");

const normalizeRow = document.getElementById("normalize-row");
const normalizeAudio = document.getElementById("normalize-audio");

const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");

const progressFill = document.getElementById("progress-fill");
const progressMessage = document.getElementById("progress-message");
const progressPercent = document.getElementById("progress-percent");
const progressDetail = document.getElementById("progress-detail");
const progressSpinner = document.getElementById("progress-spinner");

const stepConnecting = document.getElementById("step-connecting");
const stepDownloading = document.getElementById("step-downloading");
const stepEncoding = document.getElementById("step-encoding");
const stepPackaging = document.getElementById("step-packaging");

const resultCard = document.getElementById("result");
const resultTitle = document.getElementById("result-title");
const resultMessage = document.getElementById("result-message");
const downloadLink = document.getElementById("download-link");
const audioPlayerWrapper = document.getElementById("audio-player-wrapper");
const audioPreview = document.getElementById("audio-preview");
const newDownloadButton = document.getElementById("new-download");
const cancelButton = document.getElementById("cancel-download");

const failureReport = document.getElementById("failure-report");
const skippedCount = document.getElementById("skipped-count");
const failureList = document.getElementById("failure-list");

const subtitleRow = document.getElementById("subtitle-row");
const includeSubtitles = document.getElementById("include-subtitles");
const subtitleLanguage = document.getElementById("subtitle-language");

const quickMp3Btn = document.getElementById("quick-mp3-btn");
const quickMp4Btn = document.getElementById("quick-mp4-btn");
const thumbnailDownloadBtn = document.getElementById("thumbnail-download-btn");

// PWA Service Worker & Notification Setup
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/static/sw.js").catch(() => {});
    });
}

function sendDesktopNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(title, { body: body, icon: "/static/manifest.json" });
        } catch {}
    }
}

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}
let currentUrl = "";
let currentJobId = null;
let currentMediaInfo = null;
let currentFileDownloadUrl = "";
let isBatchMode = false;
let systemDiagnostics = null;
let currentPlaylistEntries = [];
let selectedPlaylistIndices = new Set();

// Toast Notification Manager (100% Safe DOM rendering)
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const iconSpan = document.createElement("span");
    iconSpan.textContent = type === "error" ? "⚠️" : type === "success" ? "✓" : "ℹ️";
    
    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Diagnostics & Health Center
async function checkDiagnostics() {
    try {
        const response = await fetch("/api/diagnostics");
        const data = await response.json();
        systemDiagnostics = data;

        diagFfmpeg.textContent = data.ffmpeg_available ? "🟢 Ready" : "🔴 Missing";
        diagFfprobe.textContent = data.ffprobe_available ? "🟢 Ready" : "🔴 Missing";
        diagNode.textContent = data.node_available ? "🟢 Ready" : "⚪ Optional";
        diagYtdlp.textContent = `v${data.ytdlp_version}`;
        diagDisk.textContent = `${data.free_space_mb || 0} MB`;

        ffmpegWarningBanner.hidden = data.ffmpeg_available;

        if (data.ffmpeg_available) {
            if (healthStatusBadge) healthStatusBadge.textContent = "🟢 Local Studio";
            if (ffmpegStatusTxt) ffmpegStatusTxt.textContent = `FFmpeg Ready • ${data.free_space_mb} MB Free`;
        } else {
            if (healthStatusBadge) healthStatusBadge.textContent = "🟡 Native Mode (No FFmpeg)";
            if (ffmpegStatusTxt) ffmpegStatusTxt.textContent = "FFmpeg Missing • Single Stream Only";
        }
    } catch {
        if (healthStatusBadge) healthStatusBadge.textContent = "🔴 Offline Mode";
    }
}
checkDiagnostics();

openDiagnosticsBtn.addEventListener("click", () => {
    checkDiagnostics();
    diagnosticsModal.hidden = false;
});
closeDiagnosticsBtn.addEventListener("click", () => {
    diagnosticsModal.hidden = true;
});
const updateYtdlpBtn = document.getElementById("update-ytdlp-btn");
if (updateYtdlpBtn) {
    updateYtdlpBtn.addEventListener("click", async () => {
        setBusy(updateYtdlpBtn, true, "Updating...");
        try {
            const res = await fetch("/api/update_ytdlp", { method: "POST" });
            const data = await readResponse(res);
            showToast(data.message || "yt-dlp updated successfully!", "success");
            checkDiagnostics();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setBusy(updateYtdlpBtn, false, "⚡ Update Engine (yt-dlp)");
        }
    });
}

refreshDiagnosticsBtn.addEventListener("click", () => {
    checkDiagnostics();
    showToast("Re-checked system diagnostics", "info");
});

// QR Code Generator Modal (Local LAN / Mobile)
openQrBtn.addEventListener("click", async () => {
    if (!currentFileDownloadUrl) return;
    
    let baseUrl = window.location.origin;
    try {
        const lanRes = await fetch("/api/lan_info");
        const lanData = await lanRes.json();
        if (lanData.lan_url) baseUrl = lanData.lan_url;
    } catch {}

    const fullUrl = baseUrl + currentFileDownloadUrl;
    qrCodeContainer.replaceChildren();
    
    const qrImg = document.createElement("img");
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullUrl)}`;
    qrImg.alt = "Download QR Code";
    qrCodeContainer.appendChild(qrImg);
    
    qrModal.hidden = false;
});

closeQrBtn.addEventListener("click", () => {
    qrModal.hidden = true;
});

let rawTranscriptText = "";
const transcriptSearchInput = document.getElementById("transcript-search-input");

if (transcriptSearchInput) {
    transcriptSearchInput.addEventListener("input", () => {
        const query = transcriptSearchInput.value.toLowerCase().trim();
        if (!query) {
            transcriptTextarea.value = rawTranscriptText;
            return;
        }
        const filteredLines = rawTranscriptText
            .split("\n")
            .filter(line => line.toLowerCase().includes(query));
        transcriptTextarea.value = filteredLines.join("\n") || "No matching transcript lines found.";
    });
}

// AI Transcript Modal & Exporter
openTranscriptBtn.addEventListener("click", async () => {
    if (!currentUrl) return;
    transcriptModal.hidden = false;
    transcriptTextarea.value = "Extracting transcript from video...";
    copyTranscriptBtn.disabled = true;
    if (transcriptSearchInput) transcriptSearchInput.value = "";

    try {
        const response = await fetch("/api/transcript", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentUrl }),
        });
        const data = await readResponse(response);
        rawTranscriptText = data.transcript || "No transcript available.";
        transcriptTextarea.value = rawTranscriptText;
        copyTranscriptBtn.disabled = false;
    } catch (err) {
        transcriptTextarea.value = `Could not extract transcript: ${err.message}`;
    }
});

closeTranscriptBtn.addEventListener("click", () => {
    transcriptModal.hidden = true;
});

copyTranscriptBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(transcriptTextarea.value);
        showToast("Transcript copied to clipboard!", "success");
    } catch {
        showToast("Could not copy transcript", "error");
    }
});

// Theme Switcher Handler
const THEME_KEY = "mediadrop_theme";

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
        themeIcon.textContent = "☀️";
        themeLabel.textContent = "Light";
    } else {
        themeIcon.textContent = "🌙";
        themeLabel.textContent = "Dark";
    }
}

themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
    showToast(`Switched to ${newTheme.toUpperCase()} theme`, "info");
});

applyTheme(localStorage.getItem(THEME_KEY) || "dark");

// Drag & Drop Link Overlay Handler
let dragCounter = 0;

window.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragCounter++;
    dropzoneOverlay.hidden = false;
});

window.addEventListener("dragover", (event) => {
    event.preventDefault();
});

window.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
        dragCounter = 0;
        dropzoneOverlay.hidden = true;
    }
});

window.addEventListener("drop", (event) => {
    event.preventDefault();
    dragCounter = 0;
    dropzoneOverlay.hidden = true;

    let droppedText = event.dataTransfer.getData("text").trim();
    if (droppedText) {
        if (isBatchMode) {
            batchUrlsTextarea.value += (batchUrlsTextarea.value ? "\n" : "") + droppedText;
            showToast("Added dropped URL to batch queue", "info");
        } else {
            urlInput.value = droppedText;
            clearButton.hidden = false;
            showToast("Dropped URL into input field", "info");
            analyzeForm.requestSubmit();
        }
    }
});

// Global Keyboard Paste Shortcut (Ctrl+V / Cmd+V)
document.addEventListener("paste", async (event) => {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea") return;

    const pastedText = (event.clipboardData || window.clipboardData).getData("text").trim();
    if (pastedText) {
        if (isBatchMode) {
            batchUrlsTextarea.value += (batchUrlsTextarea.value ? "\n" : "") + pastedText;
            showToast("Added pasted URL to batch queue", "info");
        } else {
            urlInput.value = pastedText;
            clearButton.hidden = false;
            showToast("Pasted URL from clipboard", "info");
            analyzeForm.requestSubmit();
        }
    }
});

// Single vs Batch Mode Switcher
modeSingleBtn.addEventListener("click", () => {
    isBatchMode = false;
    modeSingleBtn.classList.add("active");
    modeBatchBtn.classList.remove("active");
    analyzeForm.hidden = false;
    batchForm.hidden = true;
});

modeBatchBtn.addEventListener("click", () => {
    isBatchMode = true;
    modeBatchBtn.classList.add("active");
    modeSingleBtn.classList.remove("active");
    analyzeForm.hidden = true;
    batchForm.hidden = false;
});

// Utility functions
function setBusy(button, busy, label) {
    button.disabled = busy;
    const span = button.querySelector("span");
    if (span) span.textContent = label;
    button.setAttribute("aria-busy", busy);
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorBox.hidden = !msg;
    if (msg) showToast(msg, "error");
}

async function readResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }
    return data;
}

function formatDuration(seconds) {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = Math.floor(seconds % 60);
    return [hours || null, minutes, remaining]
        .filter((val) => val !== null)
        .map((val, idx) => (idx ? String(val).padStart(2, "0") : val))
        .join(":");
}

function formatDate(value) {
    if (!value || value.length !== 8) return "—";
    const date = new Date(
        Number(value.slice(0, 4)),
        Number(value.slice(4, 6)) - 1,
        Number(value.slice(6))
    );
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

function formatBytes(bytes) {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

// Input Clear & Paste handling
urlInput.addEventListener("input", () => {
    clearButton.hidden = !urlInput.value;
});

clearButton.addEventListener("click", () => {
    urlInput.value = "";
    clearButton.hidden = true;
    urlInput.focus();
});

pasteButton.addEventListener("click", async () => {
    try {
        const text = (await navigator.clipboard.readText()).trim();
        if (text) {
            urlInput.value = text;
            clearButton.hidden = false;
            urlInput.focus();
            showError("");
            showToast("Pasted URL from clipboard", "info");
        }
    } catch {
        showError("Clipboard permission was blocked. Paste using Ctrl+V / Cmd+V.");
    }
});

// Render Search Results Grid (100% Safe DOM rendering)
function renderSearchResults(results) {
    searchResultsGrid.replaceChildren();
    searchResultsSection.hidden = false;
    previewSection.hidden = true;

    for (const item of results) {
        const card = document.createElement("div");
        card.className = "search-card";

        const img = document.createElement("img");
        img.className = "search-thumb";
        img.src = item.thumbnail || "";
        img.alt = item.title || "";

        const info = document.createElement("div");
        info.className = "search-info";

        const titleDiv = document.createElement("div");
        titleDiv.className = "search-title";
        titleDiv.textContent = item.title || "Untitled";

        const metaDiv = document.createElement("div");
        metaDiv.className = "search-meta";
        metaDiv.textContent = `${item.uploader || 'Creator'} • ${formatDuration(item.duration)}`;

        const btn = document.createElement("button");
        btn.className = "search-btn";
        btn.type = "button";
        btn.textContent = "Select & Convert";

        btn.addEventListener("click", () => {
            urlInput.value = item.url;
            clearButton.hidden = false;
            searchResultsSection.hidden = true;
            analyzeForm.requestSubmit();
        });

        info.appendChild(titleDiv);
        info.appendChild(metaDiv);
        info.appendChild(btn);

        card.appendChild(img);
        card.appendChild(info);

        searchResultsGrid.appendChild(card);
    }
    searchResultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render Selective Playlist Item Picker (100% Safe DOM rendering)
function renderPlaylistPicker(entries) {
    currentPlaylistEntries = entries || [];
    selectedPlaylistIndices = new Set(currentPlaylistEntries.map(e => e.index));
    playlistItemsList.replaceChildren();

    if (!currentPlaylistEntries.length) {
        playlistPickerContainer.hidden = true;
        return;
    }

    playlistPickerContainer.hidden = false;
    updateSelectedCount();

    currentPlaylistEntries.forEach(entry => {
        const row = document.createElement("label");
        row.className = "playlist-item-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedPlaylistIndices.add(entry.index);
            } else {
                selectedPlaylistIndices.delete(entry.index);
            }
            updateSelectedCount();
        });

        const titleSpan = document.createElement("span");
        titleSpan.className = "playlist-item-title";
        titleSpan.textContent = `${entry.index}. ${entry.title}`;

        const durationSpan = document.createElement("span");
        durationSpan.className = "playlist-item-duration";
        durationSpan.textContent = formatDuration(entry.duration);

        row.appendChild(checkbox);
        row.appendChild(titleSpan);
        row.appendChild(durationSpan);

        playlistItemsList.appendChild(row);
    });
}

function updateSelectedCount() {
    selectedItemCountSpan.textContent = `${selectedPlaylistIndices.size} of ${currentPlaylistEntries.length}`;
}

selectAllBtn.addEventListener("click", () => {
    selectedPlaylistIndices = new Set(currentPlaylistEntries.map(e => e.index));
    playlistItemsList.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
    updateSelectedCount();
});

deselectAllBtn.addEventListener("click", () => {
    selectedPlaylistIndices.clear();
    playlistItemsList.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
    updateSelectedCount();
});

// Render Resolution Cards Grid (100% Safe DOM rendering)
function renderResolutionCards(cards) {
    resolutionGrid.replaceChildren();
    if (!cards || !cards.length) return;

    cards.forEach((cardData, idx) => {
        const card = document.createElement("div");
        card.className = `res-card ${idx === 0 ? 'active' : ''}`;

        const leftDiv = document.createElement("div");
        leftDiv.className = "res-card-left";

        const iconSpan = document.createElement("span");
        iconSpan.className = "res-icon";
        iconSpan.textContent = cardData.icon || "▶";

        const labelSpan = document.createElement("span");
        labelSpan.className = "res-label";
        labelSpan.textContent = cardData.label || "HD";

        leftDiv.appendChild(iconSpan);
        leftDiv.appendChild(labelSpan);

        const badgeSpan = document.createElement("span");
        badgeSpan.className = "res-badge";
        badgeSpan.textContent = cardData.badge || "HD";

        card.appendChild(leftDiv);
        card.appendChild(badgeSpan);

        card.addEventListener("click", () => {
            document.querySelectorAll(".res-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            if (cardData.is_audio) {
                downloadForm.elements.mode.value = "audio";
                audioFormatSelect.value = "mp3";
                audioBitrateSelect.value = "320";
            } else {
                downloadForm.elements.mode.value = "video";
                qualitySelect.value = cardData.quality;
            }
            syncMode();
        });

        resolutionGrid.appendChild(card);
    });
}

// Render Single Media Info Details
function renderDetails(media) {
    currentMediaInfo = media;
    searchResultsSection.hidden = true;

    const thumbnail = document.getElementById("thumbnail");
    if (media.thumbnail) {
        thumbnail.src = media.thumbnail;
        thumbnail.hidden = false;
    } else {
        thumbnail.removeAttribute("src");
        thumbnail.hidden = true;
    }
    thumbnail.alt = media.title || "";

    document.getElementById("media-type-badge").textContent = media.is_playlist ? "Playlist" : (media.platform ? media.platform.toUpperCase() : "Media");
    document.getElementById("duration-badge").textContent = formatDuration(media.duration);
    document.getElementById("uploader").textContent = media.uploader || "Unknown";
    document.getElementById("title").textContent = media.title || "Untitled";
    document.getElementById("views").textContent = media.view_count
        ? new Intl.NumberFormat().format(media.view_count)
        : "—";
    document.getElementById("published").textContent = formatDate(media.upload_date);
    document.getElementById("max-quality").textContent =
        media.qualities.length ? `${media.qualities[0]}p` : "Best available";

    const itemCountWrap = document.getElementById("item-count-wrap");
    itemCountWrap.hidden = !media.is_playlist;
    document.getElementById("item-count").textContent = media.item_count || "—";

    const descriptionWrap = document.getElementById("description-wrap");
    descriptionWrap.hidden = !media.description;
    document.getElementById("description").textContent = media.description || "";

    if (media.thumbnail) {
        thumbnailDownloadBtn.hidden = false;
        thumbnailDownloadBtn.href = `/api/thumbnail?url=${encodeURIComponent(media.thumbnail)}&id=${encodeURIComponent(media.id || "video")}`;
    } else {
        thumbnailDownloadBtn.hidden = true;
    }

    qualitySelect.replaceChildren();
    const bestOpt = new Option("Best available", "best");
    qualitySelect.add(bestOpt);
    for (const height of media.qualities) {
        qualitySelect.add(new Option(`${height}p High Definition`, height));
    }
    qualitySelect.value = media.qualities.includes("1080") ? "1080" : (media.qualities[0] || "best");

    document.getElementById("playlist").checked = media.is_playlist;

    renderResolutionCards(media.resolution_cards);
    renderPlaylistPicker(media.playlist_entries);

    subtitleLanguage.replaceChildren();
    for (const lang of media.subtitle_languages || []) {
        subtitleLanguage.add(new Option(lang.toUpperCase(), lang));
    }
    subtitleRow.hidden = !(media.subtitle_languages && media.subtitle_languages.length > 0);
    includeSubtitles.checked = false;
    if (media.subtitle_languages && media.subtitle_languages.includes("en")) {
        subtitleLanguage.value = "en";
    }
}

// Mode toggle (Video vs Audio vs GIF)
function syncMode() {
    const mode = downloadForm.elements.mode.value;
    const isAudio = mode === "audio";
    const isGif = mode === "gif";

    qualityGroup.hidden = isAudio || isGif;
    audioFormatGroup.hidden = !isAudio;
    audioBitrateGroup.hidden = !isAudio;
    audioEffectGroup.hidden = !isAudio;
    normalizeRow.hidden = !isAudio;
}

for (const radio of downloadForm.elements.mode) {
    radio.addEventListener("change", syncMode);
}

// Form Submit: Fetch Media Info
analyzeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");
    setBusy(analyzeButton, true, "Fetching...");
    previewSection.hidden = true;
    progressSection.hidden = true;
    searchResultsSection.hidden = true;
    skeletonLoader.hidden = false;
    currentUrl = urlInput.value.trim();

    try {
        const response = await fetch("/api/info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: currentUrl,
                cookies_from_browser: cookiesBrowserSelect.value || null,
            }),
        });
        const data = await readResponse(response);

        if (data.is_search) {
            renderSearchResults(data.results || []);
        } else {
            renderDetails(data);
            previewSection.hidden = false;
            syncMode();
            previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    } catch (err) {
        showError(err.message);
    } finally {
        skeletonLoader.hidden = true;
        setBusy(analyzeButton, false, "Fetch Details");
    }
});

// Quick Download Handlers
quickMp3Btn.addEventListener("click", () => {
    downloadForm.elements.mode.value = "audio";
    audioFormatSelect.value = "mp3";
    audioBitrateSelect.value = "320";
    syncMode();
    downloadForm.requestSubmit();
});

quickMp4Btn.addEventListener("click", () => {
    downloadForm.elements.mode.value = "video";
    syncMode();
    downloadForm.requestSubmit();
});

// Update Live Pipeline Checklist Items
function updatePipelineChecklist(stage) {
    const steps = [
        { id: "step-connecting", key: "connecting" },
        { id: "step-downloading", key: "downloading" },
        { id: "step-encoding", key: "encoding" },
        { id: "step-packaging", key: "packaging" }
    ];

    let foundCurrent = false;
    steps.forEach(step => {
        const el = document.getElementById(step.id);
        if (!el) return;
        el.classList.remove("active", "done");

        if (step.key === stage) {
            el.classList.add("active");
            foundCurrent = true;
        } else if (!foundCurrent && stage !== "connecting") {
            el.classList.add("done");
        }
    });

    if (stage === "ready") {
        steps.forEach(step => {
            const el = document.getElementById(step.id);
            if (el) { el.classList.remove("active"); el.classList.add("done"); }
        });
    }
}

// Render Progress Info & Failure Summaries (100% Safe DOM rendering)
function renderProgress(job) {
    progressMessage.textContent = job.message || "Converting and downloading…";

    if (job.progress === null || job.progress === undefined) {
        progressFill.style.width = "100%";
        progressPercent.textContent = "Processing…";
    } else {
        progressFill.style.width = `${job.progress}%`;
        progressPercent.textContent = `${job.progress.toFixed(1)}%`;
    }

    updatePipelineChecklist(job.stage || "downloading");

    const details = [];
    if (job.downloaded_bytes) {
        details.push(
            job.total_bytes
                ? `${formatBytes(job.downloaded_bytes)} of ${formatBytes(job.total_bytes)}`
                : formatBytes(job.downloaded_bytes)
        );
    }
    if (job.speed) details.push(`${formatBytes(job.speed)}/s`);
    if (job.eta !== null && job.eta !== undefined) details.push(`~${job.eta}s remaining`);
    progressDetail.textContent = details.join(" • ") || "Converting media stream…";

    if (job.failures && job.failures.length > 0) {
        skippedCount.textContent = job.failures.length;
        failureList.replaceChildren();
        for (const fail of job.failures) {
            const li = document.createElement("li");

            const itemSpan = document.createElement("span");
            itemSpan.textContent = fail.message || 'Media Item';

            const reasonSpan = document.createElement("span");
            reasonSpan.className = "failure-reason";
            reasonSpan.textContent = fail.reason || 'Failed';

            li.appendChild(itemSpan);
            li.appendChild(reasonSpan);
            failureList.appendChild(li);
        }
        failureReport.hidden = false;
    } else {
        failureReport.hidden = true;
    }
}

// Job Polling Loop
async function pollJob(jobId) {
    try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const job = await readResponse(response);
        renderProgress(job);

        if (job.status === "ready") {
            progressSpinner.hidden = true;
            resultCard.hidden = false;
            newDownloadButton.hidden = false;
            cancelButton.hidden = true;
            currentFileDownloadUrl = `/api/jobs/${jobId}/file`;
            downloadLink.href = currentFileDownloadUrl;
            downloadLink.textContent = `Save ${job.filename || "file"}`;

            if (job.failures && job.failures.length > 0) {
                resultTitle.textContent = "Conversion Complete (Skipped Items)";
                resultMessage.textContent = `${job.success_count || 1} file(s) ready. Inaccessible items were skipped.`;
            } else {
                resultTitle.textContent = "Conversion Complete!";
                resultMessage.textContent = "Your media file is ready to save.";
            }

            if (job.filename && (job.filename.endsWith(".mp3") || job.filename.endsWith(".m4a") || job.filename.endsWith(".wav"))) {
                audioPreview.src = currentFileDownloadUrl;
                audioPlayerWrapper.hidden = false;
            } else {
                audioPlayerWrapper.hidden = true;
            }

            setBusy(downloadButton, false, "Start Conversion");
            showToast("Media ready to download!", "success");
            sendDesktopNotification("Media Ready to Save!", job.filename || "Your converted media file is ready.");

            if (currentMediaInfo) {
                saveToHistory(currentMediaInfo, job);
            }
            return;
        }

        if (job.status === "canceled") {
            progressSpinner.hidden = true;
            cancelButton.hidden = true;
            newDownloadButton.hidden = false;
            setBusy(downloadButton, false, "Start Conversion");
            showToast("Download canceled", "info");
            return;
        }

        if (job.status === "error") {
            throw new Error(job.error || "Download failed.");
        }

        window.setTimeout(() => pollJob(jobId), 600);
    } catch (err) {
        progressSpinner.hidden = true;
        progressMessage.textContent = "Download Failed";
        progressPercent.textContent = "Error";
        progressDetail.textContent = err.message;
        progressFill.style.width = "0%";
        cancelButton.hidden = true;
        newDownloadButton.hidden = false;
        setBusy(downloadButton, false, "Try Again");
        showToast(err.message, "error");
    }
}

// Start Single Download Handler
downloadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    requestNotificationPermission();
    showError("");
    resultCard.hidden = true;
    failureReport.hidden = true;
    audioPlayerWrapper.hidden = true;
    newDownloadButton.hidden = true;
    cancelButton.hidden = false;
    cancelButton.disabled = false;
    cancelButton.textContent = "Cancel Download";
    progressSpinner.hidden = false;
    progressSection.hidden = false;
    progressFill.style.width = "0%";
    progressMessage.textContent = "Connecting to media source…";
    progressPercent.textContent = "0%";
    progressDetail.textContent = "Initializing stream…";
    updatePipelineChecklist("connecting");
    setBusy(downloadButton, true, "Preparing…");
    progressSection.scrollIntoView({ behavior: "smooth", block: "start" });

    const mode = downloadForm.elements.mode.value;
    const selectedItemsArray = Array.from(selectedPlaylistIndices);

    try {
        const response = await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: currentUrl,
                mode: mode,
                quality: qualitySelect.value,
                audio_bitrate: audioBitrateSelect.value,
                audio_format: audioFormatSelect.value,
                audio_effect: audioEffectSelect.value,
                normalize_audio: normalizeAudio.checked,
                start_time: startTimeInput.value.trim() || null,
                end_time: endTimeInput.value.trim() || null,
                playlist: document.getElementById("playlist").checked,
                items_to_download: selectedItemsArray.length ? selectedItemsArray : null,
                subtitles: includeSubtitles.checked,
                subtitle_language: includeSubtitles.checked ? subtitleLanguage.value : null,
                cookies_from_browser: cookiesBrowserSelect.value || null,
                sponsorblock: (document.getElementById("sponsorblock") || {}).value || null,
                mute_video: !!(document.getElementById("mute-video") || {}).checked,
            }),
        });
        const job = await readResponse(response);
        currentJobId = job.job_id;
        pollJob(currentJobId);
    } catch (err) {
        progressSpinner.hidden = true;
        progressMessage.textContent = "Could not start download";
        progressDetail.textContent = err.message;
        cancelButton.hidden = true;
        setBusy(downloadButton, false, "Try Again");
        showToast(err.message, "error");
    }
});

// Start Batch Download Handler
batchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");
    const urls = batchUrlsTextarea.value.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length) {
        showError("Paste at least one media URL into the batch queue.");
        return;
    }

    resultCard.hidden = true;
    failureReport.hidden = true;
    audioPlayerWrapper.hidden = true;
    newDownloadButton.hidden = true;
    cancelButton.hidden = false;
    cancelButton.disabled = false;
    progressSpinner.hidden = false;
    progressSection.hidden = false;
    progressFill.style.width = "0%";
    progressMessage.textContent = `Starting batch queue (${urls.length} links)…`;
    progressSection.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
        const response = await fetch("/api/batch_jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                urls: urls,
                mode: downloadForm.elements.mode.value,
                quality: qualitySelect.value,
                audio_bitrate: audioBitrateSelect.value,
                audio_format: audioFormatSelect.value,
            }),
        });
        const job = await readResponse(response);
        currentJobId = job.job_id;
        pollJob(currentJobId);
    } catch (err) {
        progressSpinner.hidden = true;
        progressMessage.textContent = "Could not start batch";
        progressDetail.textContent = err.message;
        cancelButton.hidden = true;
        showToast(err.message, "error");
    }
});

// Cancel Download Button
cancelButton.addEventListener("click", async () => {
    if (!currentJobId) return;
    cancelButton.disabled = true;
    cancelButton.textContent = "Canceling...";
    try {
        await readResponse(await fetch(`/api/jobs/${currentJobId}`, { method: "DELETE" }));
        progressMessage.textContent = "Canceling download...";
    } catch (err) {
        progressDetail.textContent = err.message;
        cancelButton.disabled = false;
        cancelButton.textContent = "Cancel Download";
    }
});

// New Download Button
newDownloadButton.addEventListener("click", () => {
    searchResultsSection.hidden = true;
    previewSection.hidden = true;
    progressSection.hidden = true;
    resultCard.hidden = true;
    failureReport.hidden = true;
    cancelButton.hidden = true;
    currentJobId = null;
    currentMediaInfo = null;
    currentFileDownloadUrl = "";
    urlInput.value = "";
    batchUrlsTextarea.value = "";
    clearButton.hidden = true;
    urlInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Local Storage History & Storage Purge Management (100% Safe DOM rendering)
const HISTORY_KEY = "mediadrop_download_history";

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

function saveToHistory(media, job) {
    let history = getHistory();
    const item = {
        id: media.id || Date.now().toString(),
        title: media.title || "Media",
        uploader: media.uploader || "Creator",
        thumbnail: media.thumbnail || "",
        filename: job.filename,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        url: currentUrl,
    };
    history = [item, ...history.filter(h => h.id !== item.id)].slice(0, 15);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

const historySearchInput = document.getElementById("history-search-input");
if (historySearchInput) {
    historySearchInput.addEventListener("input", () => {
        renderHistory(historySearchInput.value.toLowerCase().trim());
    });
}

function renderHistory(filterQuery = "") {
    let history = getHistory();
    historyCountBadge.textContent = history.length;
    historyCountBadge.hidden = history.length === 0;

    if (filterQuery) {
        history = history.filter(item =>
            (item.title || "").toLowerCase().includes(filterQuery) ||
            (item.uploader || "").toLowerCase().includes(filterQuery)
        );
    }

    historyList.replaceChildren();
    emptyHistoryMsg.hidden = history.length > 0;

    for (const item of history) {
        const card = document.createElement("div");
        card.className = "history-card-item";

        const img = document.createElement("img");
        img.src = item.thumbnail || "";
        img.alt = item.title || "";

        const metaDiv = document.createElement("div");
        metaDiv.style.flex = "1";
        metaDiv.style.minWidth = "0";

        const titleDiv = document.createElement("div");
        titleDiv.className = "history-item-title";
        titleDiv.textContent = item.title || "Untitled";

        const infoDiv = document.createElement("div");
        infoDiv.className = "history-item-meta";
        infoDiv.textContent = `${item.uploader || 'Creator'} • ${item.timestamp || ''}`;

        metaDiv.appendChild(titleDiv);
        metaDiv.appendChild(infoDiv);

        const btn = document.createElement("button");
        btn.className = "btn-ghost";
        btn.type = "button";
        btn.textContent = "Re-fetch";

        btn.addEventListener("click", () => {
            urlInput.value = item.url;
            clearButton.hidden = false;
            analyzeForm.requestSubmit();
            historySection.hidden = true;
        });

        card.appendChild(img);
        card.appendChild(metaDiv);
        card.appendChild(btn);

        historyList.appendChild(card);
    }
}

historyToggleBtn.addEventListener("click", () => {
    historySection.hidden = !historySection.hidden;
    if (!historySection.hidden) {
        historySection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});

clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    showToast("Download history cleared", "info");
});

purgeDiskBtn.addEventListener("click", async () => {
    try {
        const res = await fetch("/api/clean_downloads", { method: "POST" });
        const data = await res.json();
        showToast(`Freed ${data.freed_mb || 0} MB storage (${data.cleaned_items || 0} files purged)`, "success");
        checkDiagnostics();
    } catch {
        showToast("Storage purge failed", "error");
    }
});

renderHistory();

// Web Audio API Waveform Visualizer Setup
const audioWaveformCanvas = document.getElementById("audio-waveform-canvas");
let audioCtx = null;
let audioAnalyser = null;
let audioSourceNode = null;

function setupAudioWaveform() {
    if (!audioWaveformCanvas || !audioPreview) return;
    audioPreview.addEventListener("play", () => {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                audioAnalyser = audioCtx.createAnalyser();
                audioAnalyser.fftSize = 64;
                audioSourceNode = audioCtx.createMediaElementSource(audioPreview);
                audioSourceNode.connect(audioAnalyser);
                audioAnalyser.connect(audioCtx.destination);
            } catch (e) {}
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        drawWaveform();
    });
}

function drawWaveform() {
    if (!audioAnalyser || !audioWaveformCanvas) return;
    const ctx = audioWaveformCanvas.getContext("2d");
    const width = audioWaveformCanvas.width;
    const height = audioWaveformCanvas.height;
    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function render() {
        if (audioPreview.paused || audioPreview.ended) return;
        requestAnimationFrame(render);
        audioAnalyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);
        const barWidth = (width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, "#6366f1");
            gradient.addColorStop(0.5, "#a855f7");
            gradient.addColorStop(1, "#ec4899");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }
    }
    render();
}
setupAudioWaveform();
