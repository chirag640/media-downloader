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

// Playlist Intelligence DOM elements
const playlistInfoBar = document.getElementById("playlist-info-bar");
const playlistTotalItems = document.getElementById("playlist-total-items");
const playlistTotalDuration = document.getElementById("playlist-total-duration");
const playlistEstSize = document.getElementById("playlist-est-size");
const playlistDurationTags = document.getElementById("playlist-duration-tags");
const playlistFilterShorts = document.getElementById("playlist-filter-shorts");
const playlistFilterLongs = document.getElementById("playlist-filter-longs");
const playlistRangeInput = document.getElementById("playlist-range-input");
const playlistRangeApply = document.getElementById("playlist-range-apply");

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
    const closeBtn = diagnosticsModal.querySelector(".btn-clear");
    if (closeBtn) closeBtn.focus();
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
    closeQrBtn.focus();
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
    closeTranscriptBtn.focus();
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
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return prefersDark.matches ? "dark" : "light";
}

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

// Auto-detect OS theme preference changes
prefersDark.addEventListener("change", (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
    }
});

applyTheme(getPreferredTheme());

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

// ── Playlist Intelligence State ──
let playlistFilterState = {
    hideShorts: false,
    hideLongs: false,
};

// ── Render Selective Playlist Item Picker with Thumbnails ──
function renderPlaylistPicker(entries) {
    currentPlaylistEntries = entries || [];
    // Only auto-select items that are not filtered out
    selectedPlaylistIndices = new Set(
        currentPlaylistEntries
            .filter(e => !isPlaylistItemFiltered(e))
            .map(e => e.index)
    );
    playlistItemsList.replaceChildren();

    if (!currentPlaylistEntries.length) {
        playlistPickerContainer.hidden = true;
        return;
    }

    playlistPickerContainer.hidden = false;
    updatePlaylistInfoBar();
    updateSelectedCount();
    renderPlaylistItems();
}

function isPlaylistItemFiltered(entry) {
    if (!entry.duration) return false;
    if (playlistFilterState.hideShorts && entry.duration < 60) return true;
    if (playlistFilterState.hideLongs && entry.duration > 1200) return true;
    return false;
}

function renderPlaylistItems() {
    playlistItemsList.replaceChildren();

    currentPlaylistEntries.forEach(entry => {
        const isFiltered = isPlaylistItemFiltered(entry);
        const row = document.createElement("label");
        row.className = "playlist-item-row" + (isFiltered ? " filtered-out" : "");
        row.dataset.index = entry.index;

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !isFiltered && selectedPlaylistIndices.has(entry.index);
        checkbox.disabled = isFiltered;
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedPlaylistIndices.add(entry.index);
            } else {
                selectedPlaylistIndices.delete(entry.index);
            }
            updateSelectedCount();
        });

        // Thumbnail image or placeholder
        if (entry.thumbnail) {
            const thumb = document.createElement("img");
            thumb.className = "playlist-item-thumb";
            thumb.src = entry.thumbnail;
            thumb.alt = entry.title || "";
            thumb.loading = "lazy";
            row.appendChild(thumb);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "playlist-item-thumb-placeholder";
            placeholder.textContent = "🎬";
            row.appendChild(placeholder);
        }

        row.appendChild(checkbox);

        // Title
        const titleSpan = document.createElement("span");
        titleSpan.className = "playlist-item-title";
        titleSpan.textContent = `${entry.index}. ${entry.title}`;
        row.appendChild(titleSpan);

        // Duration badge
        const durationSpan = document.createElement("span");
        durationSpan.className = "playlist-item-duration-badge";
        durationSpan.textContent = formatDuration(entry.duration);
        row.appendChild(durationSpan);

        playlistItemsList.appendChild(row);
    });
}

// ── Playlist Info Bar ──
function updatePlaylistInfoBar() {
    if (!currentPlaylistEntries.length) {
        playlistInfoBar.hidden = true;
        return;
    }
    playlistInfoBar.hidden = false;

    // Update item count
    playlistTotalItems.textContent = currentPlaylistEntries.length;

    // Calculate and display total duration
    const totalSeconds = currentPlaylistEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (hours > 0) {
        playlistTotalDuration.textContent = `${hours}h ${minutes}m`;
    } else {
        playlistTotalDuration.textContent = `${minutes}m ${secs}s`;
    }

    // Estimate total size (~5 MB per minute for 720p video, ~1 MB per minute for audio)
    const estSizeMB = Math.round((totalSeconds / 60) * 3);
    playlistEstSize.textContent = `~${estSizeMB > 0 ? estSizeMB : 1} MB`;

    // Show duration filter tags if playlist has varied durations
    const hasShorts = currentPlaylistEntries.some(e => e.duration && e.duration < 60);
    const hasLongs = currentPlaylistEntries.some(e => e.duration && e.duration > 1200);
    playlistDurationTags.hidden = !(hasShorts || hasLongs);
}

function updateSelectedCount() {
    const total = currentPlaylistEntries.filter(e => !isPlaylistItemFiltered(e)).length;
    selectedItemCountSpan.textContent = `${selectedPlaylistIndices.size} of ${total}`;
}

// ── Select All / Deselect All ──
selectAllBtn.addEventListener("click", () => {
    selectedPlaylistIndices = new Set(
        currentPlaylistEntries.filter(e => !isPlaylistItemFiltered(e)).map(e => e.index)
    );
    playlistItemsList.querySelectorAll("input[type=checkbox]:not([disabled])").forEach(cb => cb.checked = true);
    updateSelectedCount();
});

deselectAllBtn.addEventListener("click", () => {
    selectedPlaylistIndices.clear();
    playlistItemsList.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
    updateSelectedCount();
});

// ── Duration Filter Handlers ──
if (playlistFilterShorts) {
    playlistFilterShorts.addEventListener("click", () => {
        playlistFilterState.hideShorts = !playlistFilterState.hideShorts;
        playlistFilterShorts.classList.toggle("active", playlistFilterState.hideShorts);
        // When filtering shorts, deselect their indices
        if (playlistFilterState.hideShorts) {
            currentPlaylistEntries
                .filter(e => e.duration && e.duration < 60)
                .forEach(e => selectedPlaylistIndices.delete(e.index));
        } else {
            // Re-select shorts
            currentPlaylistEntries
                .filter(e => e.duration && e.duration < 60)
                .forEach(e => selectedPlaylistIndices.add(e.index));
        }
        renderPlaylistItems();
        updateSelectedCount();
        showToast(
            playlistFilterState.hideShorts
                ? `Hidden ${currentPlaylistEntries.filter(e => e.duration && e.duration < 60).length} short videos`
                : "Showing all videos",
            "info"
        );
    });
}

if (playlistFilterLongs) {
    playlistFilterLongs.addEventListener("click", () => {
        playlistFilterState.hideLongs = !playlistFilterState.hideLongs;
        playlistFilterLongs.classList.toggle("active", playlistFilterState.hideLongs);
        if (playlistFilterState.hideLongs) {
            currentPlaylistEntries
                .filter(e => e.duration && e.duration > 1200)
                .forEach(e => selectedPlaylistIndices.delete(e.index));
        } else {
            currentPlaylistEntries
                .filter(e => e.duration && e.duration > 1200)
                .forEach(e => selectedPlaylistIndices.add(e.index));
        }
        renderPlaylistItems();
        updateSelectedCount();
        showToast(
            playlistFilterState.hideLongs
                ? `Hidden ${currentPlaylistEntries.filter(e => e.duration && e.duration > 1200).length} long videos`
                : "Showing all videos",
            "info"
        );
    });
}

// ── Range Selection Handler ──
function parseRangeInput(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const indices = new Set();
    const parts = trimmed.split(",");
    for (const part of parts) {
        const rangeMatch = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                if (i >= 1 && i <= currentPlaylistEntries.length) {
                    indices.add(i);
                }
            }
        } else {
            const num = parseInt(part.trim(), 10);
            if (!isNaN(num) && num >= 1 && num <= currentPlaylistEntries.length) {
                indices.add(num);
            }
        }
    }
    return indices.size > 0 ? indices : null;
}

function applyPlaylistRange() {
    if (!playlistRangeInput) return;
    const rangeStr = playlistRangeInput.value.trim();
    if (!rangeStr) {
        showToast("Enter a range like 1,3,5-10", "info");
        return;
    }
    const parsed = parseRangeInput(rangeStr);
    if (!parsed) {
        showToast("Invalid range. Use format: 1,3,5-10", "error");
        return;
    }
    // Apply parsed range: only select items in the specified range
    selectedPlaylistIndices = parsed;
    // Update checkboxes
    playlistItemsList.querySelectorAll("input[type=checkbox]").forEach(cb => {
        const row = cb.closest(".playlist-item-row");
        if (row && row.dataset.index) {
            const idx = parseInt(row.dataset.index, 10);
            cb.checked = parsed.has(idx) && !cb.disabled;
        }
    });
    updateSelectedCount();
    showToast(`Selected ${parsed.size} item(s) from range`, "success");
}

if (playlistRangeApply) {
    playlistRangeApply.addEventListener("click", applyPlaylistRange);
}
if (playlistRangeInput) {
    playlistRangeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            applyPlaylistRange();
        }
    });
}

// Render Resolution Cards Grid (100% Safe DOM rendering)
function renderResolutionCards(cards) {
    if (!resolutionGrid) return;
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
    const playlistCheckCell = document.getElementById("playlist-check-cell");
    if (playlistCheckCell) {
        playlistCheckCell.hidden = !media.is_playlist;
    }

    const sponsorblockGroup = document.getElementById("sponsorblock-group");
    if (sponsorblockGroup) {
        sponsorblockGroup.hidden = media.platform !== "youtube";
    }

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

// ─────────────────────────────────────────────
// Phase 3: SSE-based real-time progress (with polling fallback)
// ─────────────────────────────────────────────
let activeEventSource = null;

function closeEventSource() {
    if (activeEventSource) {
        activeEventSource.close();
        activeEventSource = null;
    }
}

async function pollJobViaSSE(jobId) {
    closeEventSource();

    // Check if EventSource is supported
    if (typeof EventSource === "undefined") {
        pollJobViaPolling(jobId);
        return;
    }

    const url = `/api/jobs/${jobId}/events`;
    const es = new EventSource(url);
    activeEventSource = es;

    es.onmessage = (event) => {
        try {
            const job = JSON.parse(event.data);
            handleJobUpdate(job, jobId);
        } catch (e) {
            // ignore parse errors
        }
    };

    es.addEventListener("done", () => {
        es.close();
        if (activeEventSource === es) activeEventSource = null;
    });

    es.addEventListener("error", () => {
        // Network error or connection closed — fall back to polling
        es.close();
        if (activeEventSource === es) {
            activeEventSource = null;
            pollJobViaPolling(jobId);
        }
    });

    es.addEventListener("timeout", () => {
        es.close();
        if (activeEventSource === es) {
            activeEventSource = null;
            pollJobViaPolling(jobId);
        }
    });
}

// Fallback polling-based progress
let pollTimer = null;

async function pollJobViaPolling(jobId) {
    closeEventSource();

    async function tick() {
        try {
            const response = await fetch(`/api/jobs/${jobId}`);
            const job = await readResponse(response);
            const shouldStop = handleJobUpdate(job, jobId);
            if (!shouldStop) {
                pollTimer = setTimeout(tick, 600);
            }
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
    tick();
}

// Shared job update handler
function handleJobUpdate(job, jobId) {
    renderProgress(job);

    if (job.status === "ready") {
        onJobReady(job, jobId);
        return true; // stop
    }

    if (job.status === "canceled") {
        progressSpinner.hidden = true;
        cancelButton.hidden = true;
        newDownloadButton.hidden = false;
        setBusy(downloadButton, false, "Start Conversion");
        showToast("Download canceled", "info");
        return true;
    }

    if (job.status === "error") {
        progressSpinner.hidden = true;
        progressMessage.textContent = "Download Failed";
        progressPercent.textContent = "Error";
        progressDetail.textContent = job.error || "Unknown error";
        progressFill.style.width = "0%";
        cancelButton.hidden = true;
        newDownloadButton.hidden = false;
        setBusy(downloadButton, false, "Try Again");
        showToast(job.error || "Download failed", "error");
        return true;
    }

    return false;
}

function onJobReady(job, jobId) {
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
}

// Legacy alias for backward compatibility
function pollJob(jobId) {
    pollJobViaSSE(jobId);
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

// ─────────────────────────────────────────────
// Phase 4: SponsorBlock Timeline Preview
// ─────────────────────────────────────────────
const sbTimelineContainer = document.getElementById("sb-timeline-container");
const sbTimelineSummary = document.getElementById("sb-timeline-summary");
const sbTimeSavedBadge = document.getElementById("sb-time-saved-badge");
const sbTimelineBar = document.getElementById("sb-timeline-bar");
const sbTimelineEndLabel = document.getElementById("sb-timeline-end-label");
const sbCategoryChips = document.getElementById("sb-category-chips");
const sbSegmentCount = document.getElementById("sb-segment-count");
const sbTimeSaved = document.getElementById("sb-time-saved");
const sbSegmentList = document.getElementById("sb-segment-list");

let sbSegmentsData = [];
let sbActiveCategories = new Set();
let sbVideoDuration = null;

// Category display names and colors
const SB_CATEGORY_INFO = {
    sponsor: { label: "Sponsor", color: "#f43f5e" },
    intro: { label: "Intro", color: "#8b5cf6" },
    outro: { label: "Outro", color: "#ec4899" },
    selfpromo: { label: "Self Promo", color: "#f59e0b" },
    interaction: { label: "Interaction", color: "#06b6d4" },
    music_offtopic: { label: "Music Offtopic", color: "#10b981" },
    preview: { label: "Preview/Recap", color: "#3b82f6" },
    filler: { label: "Filler", color: "#64748b" },
    exclusive_access: { label: "Exclusive", color: "#a855f7" },
    unknown: { label: "Other", color: "#64748b" },
};

// Extract YouTube video ID from URL
function extractVideoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
        if (u.hostname.includes("youtube.com")) {
            if (u.pathname === "/watch") return u.searchParams.get("v");
            if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
        }
    } catch {}
    return null;
}

// Fetch SponsorBlock segments when media info loads
async function fetchSponsorBlockSegments(url) {
    const videoId = extractVideoId(url);
    if (!videoId || !sbTimelineContainer) {
        if (sbTimelineContainer) sbTimelineContainer.hidden = true;
        return;
    }

    try {
        const response = await fetch(`/api/sponsorblock_segments?videoId=${encodeURIComponent(videoId)}`);
        const data = await response.json();

        if (data.error) {
            sbTimelineContainer.hidden = true;
            return;
        }

        sbSegmentsData = data.segments || [];
        sbVideoDuration = data.video_duration;

        if (sbSegmentsData.length === 0) {
            sbTimelineContainer.hidden = true;
            return;
        }

        // Initialize all categories as active
        const allCategories = new Set(sbSegmentsData.map(s => s.category));
        sbActiveCategories = allCategories;

        renderSponsorBlockTimeline();
        sbTimelineContainer.hidden = false;
    } catch {
        sbTimelineContainer.hidden = true;
    }
}

// Render the SponsorBlock timeline
function renderSponsorBlockTimeline() {
    // Update badge with total time saved
    const totalSaved = sbSegmentsData.reduce((sum, s) => sum + (s.duration || 0), 0);
    sbTimeSavedBadge.textContent = `-${formatDuration(totalSaved)}`;

    // Update labels
    const duration = sbVideoDuration || sbSegmentsData.reduce((max, s) => Math.max(max, s.end || 0), 0);
    sbTimelineEndLabel.textContent = formatDuration(duration);

    // Clear timeline markers but keep fill
    const fill = sbTimelineBar.querySelector(".sb-timeline-fill");
    sbTimelineBar.replaceChildren();
    if (fill) sbTimelineBar.appendChild(fill);

    // Render segment markers on the timeline bar
    const filteredSegments = sbSegmentsData.filter(s => sbActiveCategories.has(s.category));
    filteredSegments.forEach(seg => {
        const marker = document.createElement("div");
        marker.className = "sb-segment-marker";
        const catClass = SB_CATEGORY_INFO[seg.category] ? `sb-cat-${seg.category}` : "sb-cat-unknown";
        marker.classList.add(catClass);

        const leftPct = (seg.start / duration) * 100;
        const widthPct = Math.max(((seg.end - seg.start) / duration) * 100, 1);
        marker.style.left = `${leftPct}%`;
        marker.style.width = `${widthPct}%`;
        marker.title = `${SB_CATEGORY_INFO[seg.category]?.label || seg.category}: ${formatDuration(seg.start)} - ${formatDuration(seg.end)}`;

        sbTimelineBar.appendChild(marker);
    });

    // Render category chips
    renderSBCategoryChips();

    // Render stats
    sbSegmentCount.textContent = `${filteredSegments.length} segment${filteredSegments.length !== 1 ? 's' : ''}`;
    sbTimeSaved.textContent = `${formatDuration(totalSaved)} saved`;

    // Render segment list
    renderSBSegmentList();
}

function renderSBCategoryChips() {
    sbCategoryChips.replaceChildren();

    const categories = [...new Set(sbSegmentsData.map(s => s.category))];
    categories.forEach(cat => {
        const info = SB_CATEGORY_INFO[cat] || { label: cat, color: "#64748b" };
        const chip = document.createElement("button");
        chip.className = `sb-cat-chip ${sbActiveCategories.has(cat) ? 'active' : ''}`.trim();
        chip.type = "button";

        const dot = document.createElement("span");
        dot.className = "sb-cat-dot";
        dot.style.background = info.color;
        chip.appendChild(dot);

        const label = document.createElement("span");
        label.textContent = info.label;
        chip.appendChild(label);

        const count = sbSegmentsData.filter(s => s.category === cat).length;
        const badge = document.createElement("span");
        badge.textContent = count;
        badge.style.cssText = "font-size:9px;opacity:0.6;margin-left:2px;";
        chip.appendChild(badge);

        chip.addEventListener("click", () => {
            if (sbActiveCategories.has(cat)) {
                sbActiveCategories.delete(cat);
                chip.classList.remove("active");
            } else {
                sbActiveCategories.add(cat);
                chip.classList.add("active");
            }
            // Full re-render handles markers, chips, segment list, and stats
            renderSponsorBlockTimeline();
        });

        sbCategoryChips.appendChild(chip);
    });
}

function renderSBSegmentList() {
    sbSegmentList.replaceChildren();

    const filtered = sbSegmentsData.filter(s => sbActiveCategories.has(s.category));
    if (filtered.length === 0) {
        const empty = document.createElement("div");
        empty.style.cssText = "text-align:center;padding:8px;font-size:11px;color:var(--text-muted);";
        empty.textContent = "No segments selected";
        sbSegmentList.appendChild(empty);
        return;
    }

    filtered.forEach(seg => {
        const item = document.createElement("div");
        item.className = "sb-segment-item";

        const color = document.createElement("div");
        color.className = "sb-segment-color";
        const catClass = SB_CATEGORY_INFO[seg.category] ? `sb-cat-${seg.category}` : "sb-cat-unknown";
        color.classList.add(catClass);
        item.appendChild(color);

        const range = document.createElement("span");
        range.className = "sb-segment-range";
        range.textContent = `${formatDuration(seg.start)} - ${formatDuration(seg.end)}`;
        item.appendChild(range);

        const catLabel = document.createElement("span");
        catLabel.className = "sb-segment-category";
        catLabel.textContent = SB_CATEGORY_INFO[seg.category]?.label || seg.category;
        item.appendChild(catLabel);

        const dur = document.createElement("span");
        dur.className = "sb-segment-duration";
        dur.textContent = formatDuration(seg.duration);
        item.appendChild(dur);

        sbSegmentList.appendChild(item);
    });
}

// Hook into media details rendering
const origRenderDetails = renderDetails;
renderDetails = function(media) {
    origRenderDetails(media);
    // Fetch SponsorBlock segments after details are rendered
    if (currentUrl && media.platform === "youtube") {
        fetchSponsorBlockSegments(currentUrl);
    }
};


// ─────────────────────────────────────────────
// Phase 4: Command Palette (⌘K / Ctrl+K)
// ─────────────────────────────────────────────
const commandPalette = document.getElementById("command-palette");
const commandPaletteInput = document.getElementById("command-palette-input");
const commandPaletteResults = document.getElementById("command-palette-results");

// ── Command Registry ──
const COMMAND_CATEGORIES = {
    actions: { label: "Actions", icon: "⚡" },
    navigation: { label: "Navigation", icon: "🧭" },
    themes: { label: "Themes", icon: "🎨" },
    downloads: { label: "Downloads", icon: "📥" },
};

const COMMANDS = [
    // ── Actions ──
    {
        id: "fetch-details",
        name: "Fetch Media Details",
        desc: "Fetch details for the current URL",
        icon: "🔍",
        category: "actions",
        shortcut: "Enter",
        action: () => {
            if (urlInput.value.trim()) {
                closeCommandPalette();
                analyzeForm.requestSubmit();
            } else {
                urlInput.focus();
                closeCommandPalette();
            }
        },
        visible: () => !!urlInput.value.trim(),
    },
    {
        id: "start-download",
        name: "Start Conversion",
        desc: "Begin downloading with current settings",
        icon: "⬇️",
        category: "actions",
        shortcut: "Ctrl+Enter",
        action: () => {
            if (!previewSection.hidden && progressSection.hidden) {
                closeCommandPalette();
                downloadForm.requestSubmit();
            }
        },
        visible: () => !previewSection.hidden && progressSection.hidden,
    },
    {
        id: "redownload",
        name: "Run Last Download Again",
        desc: "Re-download the last URL with same settings",
        icon: "🔄",
        category: "actions",
        action: () => {
            const history = getHistory();
            if (history.length > 0) {
                const last = history[0];
                urlInput.value = last.url;
                clearButton.hidden = false;
                closeCommandPalette();
                analyzeForm.requestSubmit();
            }
        },
        visible: () => getHistory().length > 0,
    },
    {
        id: "batch-mode",
        name: "Switch to Batch Mode",
        desc: "Switch to batch queue for multiple URLs",
        icon: "📋",
        category: "actions",
        action: () => {
            if (!isBatchMode) {
                modeBatchBtn.click();
            }
            closeCommandPalette();
        },
        visible: () => !isBatchMode,
    },
    {
        id: "single-mode",
        name: "Switch to Single Mode",
        desc: "Switch back to single URL mode",
        icon: "🔗",
        category: "actions",
        action: () => {
            if (isBatchMode) {
                modeSingleBtn.click();
            }
            closeCommandPalette();
        },
        visible: () => isBatchMode,
    },

    // ── Navigation ──
    {
        id: "nav-history",
        name: "Toggle History Panel",
        desc: "Show or hide recent downloads history",
        icon: "📜",
        category: "navigation",
        shortcut: "Ctrl+H",
        action: () => { historyToggleBtn.click(); closeCommandPalette(); },
    },
    {
        id: "nav-diagnostics",
        name: "Open Diagnostics",
        desc: "Check system health and dependencies",
        icon: "🛠️",
        category: "navigation",
        shortcut: "Ctrl+D",
        action: () => { openDiagnosticsBtn.click(); closeCommandPalette(); },
    },
    {
        id: "nav-settings",
        name: "Open Settings",
        desc: "Configure app preferences",
        icon: "⚙️",
        category: "navigation",
        action: () => { openSettingsBtn.click(); closeCommandPalette(); },
    },
    {
        id: "nav-presets",
        name: "Open Presets",
        desc: "Browse and apply download presets",
        icon: "🎯",
        category: "navigation",
        action: () => { openPresetsBtn.click(); closeCommandPalette(); },
    },
    {
        id: "nav-library",
        name: "Open Media Library",
        desc: "Browse downloaded files",
        icon: "📁",
        category: "navigation",
        action: () => { openLibraryBtn.click(); closeCommandPalette(); },
    },
    {
        id: "nav-shortcuts",
        name: "Show Keyboard Shortcuts",
        desc: "View all available keyboard shortcuts",
        icon: "⌨️",
        category: "navigation",
        shortcut: "?",
        action: () => { openShortcutsModal(); closeCommandPalette(); },
    },
    {
        id: "nav-clear-input",
        name: "Clear URL Input",
        desc: "Clear the current URL input field",
        icon: "🧹",
        category: "navigation",
        action: () => { clearButton.click(); closeCommandPalette(); },
        visible: () => !!urlInput.value.trim(),
    },

    // ── Themes ──
    {
        id: "theme-dark",
        name: "Switch to Dark Theme",
        desc: "Apply dark color scheme",
        icon: "🌙",
        category: "themes",
        action: () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            if (current !== "dark") {
                localStorage.setItem(THEME_KEY, "dark");
                applyTheme("dark");
                showToast("Switched to DARK theme", "info");
            }
            closeCommandPalette();
        },
        visible: () => (document.documentElement.getAttribute("data-theme") || "dark") !== "dark",
    },
    {
        id: "theme-light",
        name: "Switch to Light Theme",
        desc: "Apply light color scheme",
        icon: "☀️",
        category: "themes",
        action: () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            if (current !== "light") {
                localStorage.setItem(THEME_KEY, "light");
                applyTheme("light");
                showToast("Switched to LIGHT theme", "info");
            }
            closeCommandPalette();
        },
        visible: () => (document.documentElement.getAttribute("data-theme") || "dark") !== "light",
    },
    {
        id: "theme-auto",
        name: "Use System Theme",
        desc: "Auto-detect theme from OS preference",
        icon: "🔄",
        category: "themes",
        action: () => {
            localStorage.removeItem(THEME_KEY);
            applyTheme(getPreferredTheme());
            showToast("Switched to AUTO theme", "info");
            closeCommandPalette();
        },
        visible: () => !!localStorage.getItem(THEME_KEY),
    },

    // ── Downloads ──
    {
        id: "dl-mp3",
        name: "Quick Download MP3 (320k)",
        desc: "Quickly download audio as high-quality MP3",
        icon: "♫",
        category: "downloads",
        action: () => { quickMp3Btn.click(); closeCommandPalette(); },
        visible: () => !previewSection.hidden,
    },
    {
        id: "dl-mp4",
        name: "Quick Download 1080p MP4",
        desc: "Quickly download video at 1080p",
        icon: "▶",
        category: "downloads",
        action: () => { quickMp4Btn.click(); closeCommandPalette(); },
        visible: () => !previewSection.hidden,
    },
    {
        id: "dl-cancel",
        name: "Cancel Current Download",
        desc: "Cancel the active download in progress",
        icon: "⏹️",
        category: "downloads",
        action: () => {
            if (!cancelButton.hidden && !cancelButton.disabled) {
                cancelButton.click();
            }
            closeCommandPalette();
        },
        visible: () => !cancelButton.hidden && !cancelButton.disabled,
    },
    {
        id: "dl-purge",
        name: "Purge Disk Storage",
        desc: "Clean up all downloaded files from disk",
        icon: "🧹",
        category: "downloads",
        action: () => { purgeDiskBtn.click(); closeCommandPalette(); },
    },
    {
        id: "dl-clear-history",
        name: "Clear Download History",
        desc: "Remove all download history entries",
        icon: "🗑️",
        category: "downloads",
        action: () => { clearHistoryBtn.click(); closeCommandPalette(); },
        visible: () => getHistory().length > 0,
    },
];

// ── Fuzzy match: check if all chars of query appear in order in the text ──
function fuzzyMatch(text, query) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let ti = 0;
    for (let qi = 0; qi < lowerQuery.length; qi++) {
        const ch = lowerQuery[qi];
        // Skip spaces in query
        if (ch === " ") continue;
        ti = lowerText.indexOf(ch, ti);
        if (ti === -1) return false;
        ti++;
    }
    return true;
}

// ── Get matching commands based on the query ──
function getFilteredCommands(query) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
        // No query: return all visible commands, grouped by category
        return COMMANDS.filter(cmd => !cmd.visible || cmd.visible());
    }
    return COMMANDS.filter(cmd => {
        if (cmd.visible && !cmd.visible()) return false;
        return fuzzyMatch(cmd.name, trimmed) || fuzzyMatch(cmd.desc, trimmed) || fuzzyMatch(cmd.category, trimmed);
    });
}

// ── Render command results ──
let selectedCommandIndex = -1;

function renderCommandPalette(query) {
    const commands = getFilteredCommands(query);
    commandPaletteResults.replaceChildren();
    selectedCommandIndex = -1;

    if (commands.length === 0) {
        const empty = document.createElement("div");
        empty.className = "cmd-result-empty";
        empty.innerHTML = `<span class="cmd-result-empty-icon">🔍</span><span>No commands found for "${query}"</span>`;
        commandPaletteResults.appendChild(empty);
        return;
    }

    // Group by category
    const grouped = {};
    commands.forEach(cmd => {
        if (!grouped[cmd.category]) grouped[cmd.category] = [];
        grouped[cmd.category].push(cmd);
    });

    let globalIndex = 0;

    Object.keys(grouped).forEach(catKey => {
        const catInfo = COMMAND_CATEGORIES[catKey] || { label: catKey, icon: "📌" };
        const items = grouped[catKey];

        // Section title
        const title = document.createElement("div");
        title.className = "cmd-section-title";
        title.textContent = `${catInfo.icon} ${catInfo.label}`;
        commandPaletteResults.appendChild(title);

        // Items
        items.forEach(cmd => {
            const item = document.createElement("div");
            item.className = "cmd-item";
            item.dataset.index = globalIndex;
            item.setAttribute("role", "option");
            item.setAttribute("aria-selected", "false");

            const icon = document.createElement("div");
            icon.className = "cmd-item-icon";
            icon.textContent = cmd.icon || "⚡";

            const info = document.createElement("div");
            info.className = "cmd-item-info";

            const name = document.createElement("div");
            name.className = "cmd-item-name";
            name.textContent = cmd.name;

            const desc = document.createElement("div");
            desc.className = "cmd-item-desc";
            desc.textContent = cmd.desc || "";

            info.appendChild(name);
            info.appendChild(desc);

            item.appendChild(icon);
            item.appendChild(info);

            if (cmd.shortcut) {
                const badge = document.createElement("span");
                badge.className = "cmd-item-badge";
                badge.textContent = cmd.shortcut;
                item.appendChild(badge);
            }

            item.addEventListener("click", () => {
                cmd.action();
            });

            item.addEventListener("mouseenter", () => {
                document.querySelectorAll(".cmd-item.highlighted").forEach(el => el.classList.remove("highlighted"));
                item.classList.add("highlighted");
                selectedCommandIndex = globalIndex;
            });

            commandPaletteResults.appendChild(item);
            globalIndex++;
        });
    });

    // Highlight first item by default
    const firstItem = commandPaletteResults.querySelector(".cmd-item");
    if (firstItem) {
        firstItem.classList.add("highlighted");
        selectedCommandIndex = 0;
        scrollToItem(firstItem);
    }
}

function scrollToItem(item) {
    if (item) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

// ── Open / Close ──
function openCommandPalette() {
    commandPalette.hidden = false;
    commandPaletteInput.value = "";
    renderCommandPalette("");
    // Small delay to ensure animation plays, then focus
    requestAnimationFrame(() => {
        commandPaletteInput.focus();
    });
}

function closeCommandPalette() {
    commandPalette.hidden = true;
    commandPaletteInput.blur();
}

// ── Command palette input handler ──
if (commandPaletteInput) {
    commandPaletteInput.addEventListener("input", () => {
        renderCommandPalette(commandPaletteInput.value);
    });

    commandPaletteInput.addEventListener("keydown", (event) => {
        const items = commandPaletteResults.querySelectorAll(".cmd-item");
        if (items.length === 0) return;

        switch (event.key) {
            case "ArrowDown": {
                event.preventDefault();
                const nextIndex = Math.min(selectedCommandIndex + 1, items.length - 1);
                items.forEach((el, i) => {
                    el.classList.toggle("highlighted", i === nextIndex);
                    el.setAttribute("aria-selected", i === nextIndex ? "true" : "false");
                });
                selectedCommandIndex = nextIndex;
                scrollToItem(items[nextIndex]);
                break;
            }
            case "ArrowUp": {
                event.preventDefault();
                const prevIndex = Math.max(selectedCommandIndex - 1, 0);
                items.forEach((el, i) => {
                    el.classList.toggle("highlighted", i === prevIndex);
                    el.setAttribute("aria-selected", i === prevIndex ? "true" : "false");
                });
                selectedCommandIndex = prevIndex;
                scrollToItem(items[prevIndex]);
                break;
            }
            case "Enter": {
                event.preventDefault();
                const highlighted = commandPaletteResults.querySelector(".cmd-item.highlighted");
                if (highlighted) {
                    highlighted.click();
                }
                break;
            }
            case "Escape": {
                event.preventDefault();
                closeCommandPalette();
                break;
            }
        }
    });
}

// ── Click outside to close ──
if (commandPalette) {
    commandPalette.addEventListener("click", (e) => {
        if (e.target === commandPalette) {
            closeCommandPalette();
        }
    });
}

// ── Focus trap ──
if (commandPalette) {
    commandPalette.addEventListener("keydown", (e) => trapFocusInModal(commandPalette, e));
}


// ─────────────────────────────────────────────
// Keyboard Shortcuts
// ─────────────────────────────────────────────
const shortcutsModal = document.getElementById("shortcuts-modal");
const closeShortcutsBtn = document.getElementById("close-shortcuts-btn");

function openShortcutsModal() {
    shortcutsModal.hidden = false;
    // Set initial focus to close button
    const closeBtn = shortcutsModal.querySelector(".btn-clear");
    if (closeBtn) closeBtn.focus();
}
function closeShortcutsModal() {
    shortcutsModal.hidden = true;
}
if (closeShortcutsBtn) {
    closeShortcutsBtn.addEventListener("click", closeShortcutsModal);
}
if (shortcutsModal) {
    shortcutsModal.addEventListener("click", (e) => {
        if (e.target === shortcutsModal) closeShortcutsModal();
    });
}

// Close any open modal on Escape
document.addEventListener("keydown", (event) => {
    const key = event.key;
    const isInputFocused = ["input", "textarea", "select"].includes(
        document.activeElement?.tagName?.toLowerCase()
    );

    // Escape: close any open modal
    if (key === "Escape") {
        const openModals = [
            commandPalette, shortcutsModal, diagnosticsModal, qrModal, transcriptModal, previewPlayerModal
        ].filter(m => m && !m.hidden);
        if (openModals.length > 0) {
            openModals[openModals.length - 1].hidden = true;
            event.preventDefault();
            return;
        }
        // If progress section visible and download active, cancel
        if (!progressSection.hidden && currentJobId && !cancelButton.hidden && !cancelButton.disabled) {
            cancelButton.click();
            event.preventDefault();
            return;
        }
    }

    // Don't process shortcuts when typing in inputs
    if (isInputFocused) {
        // Allow Escape to blur input
        if (key === "Escape") {
            document.activeElement.blur();
            event.preventDefault();
        }
        return;
    }

    // / : Focus URL input
    if (key === "/") {
        event.preventDefault();
        urlInput.focus();
        urlInput.select();
        return;
    }

    // Ctrl+K or Cmd+K : Open command palette
    if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        if (commandPalette.hidden) {
            openCommandPalette();
        } else {
            closeCommandPalette();
        }
        return;
    }

    // ? : Show keyboard shortcuts
    if (key === "?") {
        event.preventDefault();
        openShortcutsModal();
        return;
    }

    // Ctrl+H or Cmd+H : Toggle history
    if ((event.ctrlKey || event.metaKey) && key === "h") {
        event.preventDefault();
        historyToggleBtn.click();
        return;
    }

    // Ctrl+D or Cmd+D : Open diagnostics
    if ((event.ctrlKey || event.metaKey) && key === "d") {
        event.preventDefault();
        openDiagnosticsBtn.click();
        return;
    }

    // Ctrl+Shift+T : Toggle theme
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "T") {
        event.preventDefault();
        themeToggleBtn.click();
        return;
    }

    // Ctrl+Enter : Start download if form visible
    if ((event.ctrlKey || event.metaKey) && key === "Enter") {
        event.preventDefault();
        if (!previewSection.hidden && progressSection.hidden && !downloadButton.disabled) {
            downloadForm.requestSubmit();
        } else if (!analyzeForm.hidden && urlInput.value.trim()) {
            analyzeForm.requestSubmit();
        }
        return;
    }
});

// ─────────────────────────────────────────────
// Accessibility: manage focus trap in modals
// ─────────────────────────────────────────────
function trapFocusInModal(modal, event) {
    if (modal.hidden) return;
    const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
}

// Add focus trap to each modal
[commandPalette, diagnosticsModal, qrModal, transcriptModal, shortcutsModal, previewPlayerModal].forEach(modal => {
    if (modal) {
        modal.addEventListener("keydown", (e) => trapFocusInModal(modal, e));
    }
});

// ─────────────────────────────────────────────
// Improved Error Messages with Actionable Hints
// ─────────────────────────────────────────────
const ERROR_HINTS = {
    "private video": "This video is private. Try using browser cookies (select your browser below the input) to access it if you have permission.",
    "age-restricted": "This video is age-restricted. Enable browser cookie access to download it if your account has permission.",
    "unavailable": "This video is unavailable or has been removed. Check if the URL is correct or try another link.",
    "sign in to confirm": "YouTube requires sign-in. Select your browser in the Cookies dropdown to use your logged-in session.",
    "ffmpeg": "FFmpeg is not installed. Install it with: winget install Gyan.FFmpeg (Windows) or apt install ffmpeg (Linux).",
    "enter a valid": "Please paste a valid URL from YouTube, Instagram, TikTok, Twitter/X, Reddit, or Soundcloud.",
    "search error": "Search failed. Try different keywords or paste a direct URL instead.",
    "no transcript": "No transcript available for this video. It may not have captions or auto-generated subtitles.",
};

function showError(msg) {
    // Remove any previous error hints to prevent accumulation
    const oldHints = errorBox.querySelectorAll(".error-hint");
    oldHints.forEach(h => h.remove());

    if (!msg) {
        errorBox.hidden = true;
        errorMessage.textContent = "";
        return;
    }
    const lower = msg.toLowerCase();
    let hint = "";
    for (const [keyword, suggestion] of Object.entries(ERROR_HINTS)) {
        if (lower.includes(keyword)) {
            hint = suggestion;
            break;
        }
    }
    errorMessage.textContent = msg;
    if (hint) {
        const hintEl = document.createElement("div");
        hintEl.className = "error-hint";
        hintEl.textContent = "💡 " + hint;
        hintEl.style.cssText = "margin-top:6px;font-size:12px;opacity:0.85;";
        errorBox.appendChild(hintEl);
    }
    errorBox.hidden = false;
    showToast(msg, "error");
}

// ─────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════
// Phase 2: Settings Panel
// ═══════════════════════════════════════════════════
const SETTINGS_KEY = "mediadrop_settings";
const defaultSettings = {
    theme: "auto",
    animations: true,
    defaultQuality: "1080",
    defaultFormat: "video",
    defaultBitrate: "192",
    autoFetch: true,
    notifications: false,
    sound: true,
};

function getSettings() {
    try {
        return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
    } catch {
        return { ...defaultSettings };
    }
}

function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettings() {
    const settings = getSettings();
    // Theme
    if (settings.theme === "auto") {
        localStorage.removeItem(THEME_KEY);
        applyTheme(getPreferredTheme());
    } else {
        localStorage.setItem(THEME_KEY, settings.theme);
        applyTheme(settings.theme);
    }
    // Animations
    document.body.style.setProperty("--anim-duration", settings.animations ? "" : "0.01ms");
    // Notifications
    if (settings.notifications && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

const settingsModal = document.getElementById("settings-modal");
const openSettingsBtn = document.getElementById("open-settings-btn");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const settingsThemeSelect = document.getElementById("settings-theme-select");
const settingsAnimationsToggle = document.getElementById("settings-animations-toggle");
const settingsDefaultQuality = document.getElementById("settings-default-quality");
const settingsDefaultFormat = document.getElementById("settings-default-format");
const settingsDefaultBitrate = document.getElementById("settings-default-bitrate");
const settingsAutoFetch = document.getElementById("settings-auto-fetch");
const settingsNotifications = document.getElementById("settings-notifications");
const settingsSoundToggle = document.getElementById("settings-sound-toggle");
const settingsDiskUsage = document.getElementById("settings-disk-usage");
const settingsPurgeBtn = document.getElementById("settings-purge-btn");

function populateSettingsUI() {
    const s = getSettings();
    settingsThemeSelect.value = s.theme;
    settingsAnimationsToggle.checked = s.animations;
    settingsDefaultQuality.value = s.defaultQuality;
    settingsDefaultFormat.value = s.defaultFormat;
    settingsDefaultBitrate.value = s.defaultBitrate;
    settingsAutoFetch.checked = s.autoFetch;
    settingsNotifications.checked = s.notifications;
    settingsSoundToggle.checked = s.sound;
    // Fetch disk usage
    fetch("/api/stats").then(r => r.json()).then(data => {
        settingsDiskUsage.textContent = `${data.disk_free_mb || 0} MB free of ${data.disk_total_mb || 0} MB`;
    }).catch(() => {
        settingsDiskUsage.textContent = "—";
    });
}

if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => {
        populateSettingsUI();
        settingsModal.hidden = false;
        closeSettingsBtn.focus();
    });
}
if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", () => {
        settingsModal.hidden = true;
    });
}
if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) settingsModal.hidden = true;
    });
}

// Settings change handlers
function onSettingsChange() {
    const settings = {
        theme: settingsThemeSelect.value,
        animations: settingsAnimationsToggle.checked,
        defaultQuality: settingsDefaultQuality.value,
        defaultFormat: settingsDefaultFormat.value,
        defaultBitrate: settingsDefaultBitrate.value,
        autoFetch: settingsAutoFetch.checked,
        notifications: settingsNotifications.checked,
        sound: settingsSoundToggle.checked,
    };
    saveSettings(settings);
    applySettings();
    applySettingsToForm();
}

[settingsThemeSelect, settingsDefaultQuality, settingsDefaultFormat, settingsDefaultBitrate].forEach(el => {
    if (el) el.addEventListener("change", onSettingsChange);
});
[settingsAnimationsToggle, settingsAutoFetch, settingsNotifications, settingsSoundToggle].forEach(el => {
    if (el) el.addEventListener("change", onSettingsChange);
});

if (settingsPurgeBtn) {
    settingsPurgeBtn.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/clean_downloads", { method: "POST" });
            const data = await res.json();
            showToast(`Freed ${data.freed_mb || 0} MB (${data.cleaned_items || 0} files)`, "success");
            populateSettingsUI();
        } catch {
            showToast("Purge failed", "error");
        }
    });
}

applySettings();

// ═══════════════════════════════════════════════════
// Phase 3: Media Preview Player
// ═══════════════════════════════════════════════════
const previewPlayerModal = document.getElementById("preview-player-modal");
const closePreviewBtn = document.getElementById("close-preview-btn");
const previewVideo = document.getElementById("preview-video");
const previewVideoContainer = document.getElementById("preview-video-container");
const previewAudio = document.getElementById("preview-audio");
const previewAudioContainer = document.getElementById("preview-audio-container");
const previewImage = document.getElementById("preview-image");
const previewImageContainer = document.getElementById("preview-image-container");
const previewFilename = document.getElementById("preview-filename");
const previewFilesize = document.getElementById("preview-filesize");
const previewFiletype = document.getElementById("preview-filetype");
const previewDownloadLink = document.getElementById("preview-download-link");
const previewWaveformCanvas = document.getElementById("preview-waveform-canvas");

let previewAudioCtx = null;
let previewAnalyser = null;
let previewSourceNode = null;

function openPreview(jobId, filename) {
    // Reset
    previewVideo.pause();
    previewVideo.removeAttribute("src");
    previewVideo.load();
    previewAudio.pause();
    previewAudio.removeAttribute("src");
    previewAudio.load();
    previewImage.removeAttribute("src");
    previewVideoContainer.hidden = true;
    previewAudioContainer.hidden = true;
    previewImageContainer.hidden = true;
    previewFilename.textContent = filename || "Unknown";

    // Fetch preview metadata
    fetch(`/api/jobs/${jobId}/preview`)
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            previewFilename.textContent = data.filename || filename;
            previewFilesize.textContent = formatBytes(data.size_bytes) || "—";
            previewFiletype.textContent = (data.media_type || "other").toUpperCase();
            previewDownloadLink.href = data.download_url || "#";
            previewDownloadLink.download = data.filename || "file";

            const downloadUrl = data.download_url;

            if (data.media_type === "video") {
                previewVideo.src = downloadUrl;
                previewVideoContainer.hidden = false;
            } else if (data.media_type === "audio") {
                previewAudio.src = downloadUrl;
                previewAudioContainer.hidden = false;
                setupPreviewWaveform();
            } else if (data.media_type === "image") {
                previewImage.src = downloadUrl;
                previewImageContainer.hidden = false;
            } else {
                // Unknown type — show file info only
                previewFiletype.textContent = "📄 File";
            }

            previewPlayerModal.hidden = false;
            closePreviewBtn.focus();
        })
        .catch(() => {
            showToast("Could not load preview", "error");
        });
}

function setupPreviewWaveform() {
    if (!previewWaveformCanvas || !previewAudio) return;
    
    const startWaveform = () => {
        if (!previewAudioCtx) {
            try {
                previewAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                previewAnalyser = previewAudioCtx.createAnalyser();
                previewAnalyser.fftSize = 64;
                previewSourceNode = previewAudioCtx.createMediaElementSource(previewAudio);
                previewSourceNode.connect(previewAnalyser);
                previewAnalyser.connect(previewAudioCtx.destination);
            } catch (e) {
                return;
            }
        }
        if (previewAudioCtx && previewAudioCtx.state === "suspended") {
            previewAudioCtx.resume();
        }
        drawPreviewWaveform();
    };

    previewAudio.addEventListener("play", startWaveform, { once: true });
}

function drawPreviewWaveform() {
    if (!previewAnalyser || !previewWaveformCanvas) return;
    const ctx = previewWaveformCanvas.getContext("2d");
    const width = previewWaveformCanvas.width;
    const height = previewWaveformCanvas.height;
    const bufferLength = previewAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function render() {
        if (previewAudio.paused || previewAudio.ended) return;
        requestAnimationFrame(render);
        previewAnalyser.getByteFrequencyData(dataArray);

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

if (closePreviewBtn) {
    closePreviewBtn.addEventListener("click", () => {
        previewPlayerModal.hidden = true;
        previewVideo.pause();
        previewAudio.pause();
        if (previewAudioCtx) {
            previewAudioCtx.close().catch(() => {});
            previewAudioCtx = null;
        }
    });
}
if (previewPlayerModal) {
    previewPlayerModal.addEventListener("click", (e) => {
        if (e.target === previewPlayerModal) {
            closePreviewBtn.click();
        }
    });
    previewPlayerModal.addEventListener("keydown", (e) => trapFocusInModal(previewPlayerModal, e));
}

// ═══════════════════════════════════════════════════
// Phase 2: Smart Presets
// ═══════════════════════════════════════════════════
const presetsModal = document.getElementById("presets-modal");
const openPresetsBtn = document.getElementById("open-presets-btn");
const closePresetsBtn = document.getElementById("close-presets-btn");
const presetsList = document.getElementById("presets-list");
const createPresetBtn = document.getElementById("create-preset-btn");
const createPresetForm = document.getElementById("create-preset-form");
const savePresetBtn = document.getElementById("save-preset-btn");
const cancelPresetBtn = document.getElementById("cancel-preset-btn");
const presetNameInput = document.getElementById("preset-name-input");
const presetModeSelect = document.getElementById("preset-mode-select");
const presetQualitySelect = document.getElementById("preset-quality-select");
const presetBitrateSelect = document.getElementById("preset-bitrate-select");
const presetFormatSelect = document.getElementById("preset-format-select");

async function loadPresets() {
    try {
        const res = await fetch("/api/presets");
        const data = await res.json();
        renderPresets(data.presets || []);
    } catch {
        presetsList.innerHTML = '<p class="empty-txt">Could not load presets.</p>';
    }
}

function renderPresets(presets) {
    presetsList.replaceChildren();
    if (!presets.length) {
        presetsList.innerHTML = '<p class="empty-txt">No presets yet. Create one!</p>';
        return;
    }
    presets.forEach(preset => {
        const card = document.createElement("div");
        card.className = "preset-card";
        card.innerHTML = `
            <div class="preset-card-title">${preset.name}</div>
            <div class="preset-card-meta">
                <span class="preset-tag preset-tag-mode">${preset.mode}</span>
                <span class="preset-tag preset-tag-quality">${preset.quality}p</span>
                <span class="preset-tag preset-tag-format">${preset.audio_format}</span>
            </div>
            <div class="preset-card-actions">
                <button class="preset-apply-btn" type="button">Apply & Close</button>
                <button class="preset-delete-btn" type="button">✕</button>
            </div>
        `;
        // Apply preset
        card.querySelector(".preset-apply-btn").addEventListener("click", () => {
            applyPreset(preset);
            presetsModal.hidden = true;
            showToast(`Applied preset: ${preset.name}`, "success");
        });
        // Delete preset (only for non-default)
        card.querySelector(".preset-delete-btn").addEventListener("click", async (e) => {
            e.stopPropagation();
            try {
                await fetch(`/api/presets/${encodeURIComponent(preset.name)}`, { method: "DELETE" });
                loadPresets();
                showToast(`Deleted preset: ${preset.name}`, "info");
            } catch {
                showToast("Failed to delete preset", "error");
            }
        });
        presetsList.appendChild(card);
    });
}

function applyPreset(preset) {
    downloadForm.elements.mode.value = preset.mode;
    if (preset.mode === "video") {
        // Only set quality if the option exists in the select
        if (qualitySelect.querySelector(`option[value="${preset.quality}"]`)) {
            qualitySelect.value = preset.quality;
        }
    } else if (preset.mode === "audio") {
        audioFormatSelect.value = preset.audio_format;
        audioBitrateSelect.value = preset.audio_bitrate;
    }
    syncMode();
}

if (openPresetsBtn) {
    openPresetsBtn.addEventListener("click", () => {
        loadPresets();
        createPresetForm.hidden = true;
        presetsModal.hidden = false;
        closePresetsBtn.focus();
    });
}
if (closePresetsBtn) {
    closePresetsBtn.addEventListener("click", () => {
        presetsModal.hidden = true;
    });
}
if (presetsModal) {
    presetsModal.addEventListener("click", (e) => {
        if (e.target === presetsModal) presetsModal.hidden = true;
    });
}

if (createPresetBtn) {
    createPresetBtn.addEventListener("click", () => {
        createPresetForm.hidden = !createPresetForm.hidden;
    });
}
if (cancelPresetBtn) {
    cancelPresetBtn.addEventListener("click", () => {
        createPresetForm.hidden = true;
        presetNameInput.value = "";
    });
}
if (savePresetBtn) {
    savePresetBtn.addEventListener("click", async () => {
        const name = presetNameInput.value.trim();
        if (!name) {
            showToast("Enter a preset name", "error");
            return;
        }
        try {
            const res = await fetch("/api/presets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    mode: presetModeSelect.value,
                    quality: presetQualitySelect.value,
                    audio_bitrate: presetBitrateSelect.value,
                    audio_format: presetFormatSelect.value,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save preset");
            showToast(`Created preset: ${name}`, "success");
            presetNameInput.value = "";
            createPresetForm.hidden = true;
            loadPresets();
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

// ═══════════════════════════════════════════════════
// Phase 2: Download Queue Management
// ═══════════════════════════════════════════════════
const queueSection = document.getElementById("queue-section");
const queueList = document.getElementById("queue-list");
const emptyQueueMsg = document.getElementById("empty-queue-msg");
const queueCountBadgeNav = document.getElementById("queue-count-badge-nav");
const openQueueBtn = document.getElementById("open-queue-btn");

let downloadQueue = [];
let queuePollTimer = null;

function addToQueue(jobId, title, mode) {
    downloadQueue.push({
        jobId,
        title: title || "Download",
        mode: mode || "video",
        status: "queued",
        progress: 0,
        message: "Queued...",
    });
    renderQueue();
    startQueuePolling();
}

function removeFromQueue(jobId) {
    downloadQueue = downloadQueue.filter(q => q.jobId !== jobId);
    renderQueue();
}

// Apply settings defaults to form controls
function applySettingsToForm() {
    const s = getSettings();
    if (qualitySelect.querySelector(`option[value="${s.defaultQuality}"]`)) {
        qualitySelect.value = s.defaultQuality;
    }
    audioBitrateSelect.value = s.defaultBitrate;
    audioFormatSelect.value = s.defaultFormat;
}

function updateQueueItem(jobId, updates) {
    const item = downloadQueue.find(q => q.jobId === jobId);
    if (item) {
        Object.assign(item, updates);
        renderQueue();
    }
}

function renderQueue() {
    if (!queueList) return;
    queueList.replaceChildren();
    const activeCount = downloadQueue.filter(q => q.status !== "ready" && q.status !== "error" && q.status !== "canceled").length;
    if (queueCountBadgeNav) {
        queueCountBadgeNav.textContent = downloadQueue.length;
        queueCountBadgeNav.hidden = downloadQueue.length === 0;
    }
    emptyQueueMsg.hidden = downloadQueue.length > 0;
    downloadQueue.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "queue-item";
        const statusClass = item.status === "downloading" || item.status === "starting" ? "status-active" : "";
        row.innerHTML = `
            <div class="queue-item-position">${idx + 1}</div>
            <div class="queue-item-info">
                <div class="queue-item-title">${item.title}</div>
                <div class="queue-item-status ${statusClass}">${item.message || item.status}</div>
            </div>
            <div class="queue-item-progress">
                <div class="queue-item-progress-fill" style="width: ${item.progress || 0}%"></div>
            </div>
            <div class="queue-item-actions">
                ${item.status !== "ready" && item.status !== "error" && item.status !== "canceled" ?
                    `<button class="queue-cancel-btn" data-job="${item.jobId}" title="Cancel">✕</button>` : ''}
            </div>
        `;
        const cancelBtn = row.querySelector(".queue-cancel-btn");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", async () => {
                try {
                    await fetch(`/api/jobs/${item.jobId}`, { method: "DELETE" });
                    updateQueueItem(item.jobId, { status: "canceled", message: "Canceled" });
                } catch {}
            });
        }
        queueList.appendChild(row);
    });
}

function startQueuePolling() {
    if (queuePollTimer) return;
    queuePollTimer = setInterval(async () => {
        const activeItems = downloadQueue.filter(q => q.status !== "ready" && q.status !== "error" && q.status !== "canceled");
        if (activeItems.length === 0) {
            clearInterval(queuePollTimer);
            queuePollTimer = null;
            return;
        }
        for (const item of activeItems) {
            try {
                const res = await fetch(`/api/jobs/${item.jobId}`);
                if (!res.ok) continue;
                const job = await res.json();
                updateQueueItem(item.jobId, {
                    status: job.status,
                    progress: job.progress || 0,
                    message: job.message || job.status,
                });
            } catch {}
        }
    }, 1500);
}

if (openQueueBtn) {
    openQueueBtn.addEventListener("click", () => {
        queueSection.hidden = !queueSection.hidden;
        if (!queueSection.hidden) {
            renderQueue();
            queueSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
}

// ═══════════════════════════════════════════════════
// Phase 2: File Library / Media Manager
// ═══════════════════════════════════════════════════
const librarySection = document.getElementById("library-section");
const openLibraryBtn = document.getElementById("open-library-btn");
const libraryGrid = document.getElementById("library-grid");
const libraryListView = document.getElementById("library-list-view");
const emptyLibraryMsg = document.getElementById("empty-library-msg");
const libraryGridBtn = document.getElementById("library-grid-btn");
const libraryListBtn = document.getElementById("library-list-btn");
const librarySearch = document.getElementById("library-search");
const libraryRefreshBtn = document.getElementById("library-refresh-btn");
const librarySelectModeBtn = document.getElementById("library-select-mode-btn");
const libraryDeleteSelectedBtn = document.getElementById("library-delete-selected-btn");
const libraryCountBadge = document.getElementById("library-count-badge");
const libraryTotalFiles = document.getElementById("library-total-files");
const libraryTotalSize = document.getElementById("library-total-size");

let libraryFiles = [];
let librarySelectMode = false;
let selectedLibraryFiles = new Set();
let libraryViewMode = "grid";

function getFileIcon(filename) {
    if (!filename) return "📄";
    const ext = filename.split(".").pop().toLowerCase();
    const icons = {
        mp4: "🎬", mkv: "🎬", webm: "🎬", avi: "🎬",
        mp3: "🎵", m4a: "🎵", wav: "🎵", flac: "🎵", aac: "🎵",
        jpg: "🖼️", jpeg: "🖼️", png: "🖼️", webp: "🖼️", gif: "🖼️",
        zip: "📦",
    };
    return icons[ext] || "📄";
}

async function loadLibrary() {
    try {
        const res = await fetch("/api/library");
        const data = await res.json();
        libraryFiles = data.files || [];
        renderLibrary();
        if (libraryCountBadge) {
            libraryCountBadge.textContent = libraryFiles.length;
            libraryCountBadge.hidden = libraryFiles.length === 0;
        }
    } catch {
        libraryFiles = [];
        renderLibrary();
    }
}

function renderLibrary() {
    const filter = (librarySearch?.value || "").toLowerCase().trim();
    let files = libraryFiles;
    if (filter) {
        files = files.filter(f => (f.filename || "").toLowerCase().includes(filter));
    }
    emptyLibraryMsg.hidden = files.length > 0;

    // Stats
    const totalSize = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
    if (libraryTotalFiles) libraryTotalFiles.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;
    if (libraryTotalSize) libraryTotalSize.textContent = formatBytes(totalSize);

    // Clear views
    libraryGrid.replaceChildren();
    libraryListView.replaceChildren();

    files.forEach(file => {
        if (libraryViewMode === "grid") {
            const card = document.createElement("div");
            card.className = `library-grid-item ${selectedLibraryFiles.has(file.job_id) ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="library-item-icon">${getFileIcon(file.filename)}</div>
                <div class="library-item-name" title="${file.filename}">${file.filename || 'Unknown'}</div>
                <div class="library-item-meta">
                    <span>${formatBytes(file.size_bytes)}</span>
                    <span>${new Date(file.created_at * 1000).toLocaleDateString()}</span>
                </div>
                <div class="library-item-actions">
                    <button class="library-preview-btn" data-job="${file.job_id}" data-file="${file.filename}" type="button">👁️ Preview</button>
                    <a href="${file.url}" class="library-download-btn" download>💾 Save</a>
                    <button class="library-delete-btn" data-job="${file.job_id}" type="button">🗑️</button>
                </div>
                <div class="library-item-checkbox ${selectedLibraryFiles.has(file.job_id) ? 'checked' : ''}" data-job="${file.job_id}">
                    ${selectedLibraryFiles.has(file.job_id) ? '✓' : ''}
                </div>
            `;
            // Preview handler
            const previewBtn = card.querySelector(".library-preview-btn");
            if (previewBtn) {
                previewBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openPreview(file.job_id, file.filename);
                });
            }
            // Delete handler
            card.querySelector(".library-delete-btn").addEventListener("click", async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete ${file.filename}?`)) return;
                try {
                    await fetch(`/api/library/${file.job_id}`, { method: "DELETE" });
                    loadLibrary();
                    showToast(`Deleted ${file.filename}`, "info");
                } catch {
                    showToast("Delete failed", "error");
                }
            });
            // Select handler
            const checkbox = card.querySelector(".library-item-checkbox");
            checkbox.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFileSelection(file.job_id);
            });
            libraryGrid.appendChild(card);
        } else {
            // List view
            const row = document.createElement("div");
            row.className = `library-list-item ${selectedLibraryFiles.has(file.job_id) ? 'selected' : ''}`;
            row.innerHTML = `
                <div class="library-list-icon">${getFileIcon(file.filename)}</div>
                <div class="library-list-info">
                    <div class="library-list-name">${file.filename || 'Unknown'}</div>
                    <div class="library-list-meta">${formatBytes(file.size_bytes)} • ${new Date(file.created_at * 1000).toLocaleDateString()}</div>
                </div>
                <div class="library-item-actions">
                    <button class="library-preview-btn" data-job="${file.job_id}" data-file="${file.filename}" type="button">👁️ Preview</button>
                    <a href="${file.url}" class="library-download-btn" download>💾 Save</a>
                    <button class="library-delete-btn" data-job="${file.job_id}" type="button">🗑️</button>
                </div>
            `;
            // Preview handler
            const previewBtn = row.querySelector(".library-preview-btn");
            if (previewBtn) {
                previewBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openPreview(file.job_id, file.filename);
                });
            }
            row.querySelector(".library-delete-btn").addEventListener("click", async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete ${file.filename}?`)) return;
                try {
                    await fetch(`/api/library/${file.job_id}`, { method: "DELETE" });
                    loadLibrary();
                    showToast(`Deleted ${file.filename}`, "info");
                } catch {
                    showToast("Delete failed", "error");
                }
            });
            libraryListView.appendChild(row);
        }
    });
    libraryGrid.hidden = libraryViewMode !== "grid";
    libraryListView.hidden = libraryViewMode === "grid";
}

function toggleFileSelection(jobId) {
    if (selectedLibraryFiles.has(jobId)) {
        selectedLibraryFiles.delete(jobId);
    } else {
        selectedLibraryFiles.add(jobId);
    }
    libraryDeleteSelectedBtn.hidden = selectedLibraryFiles.size === 0;
    renderLibrary();
}

if (openLibraryBtn) {
    openLibraryBtn.addEventListener("click", () => {
        librarySection.hidden = !librarySection.hidden;
        if (!librarySection.hidden) {
            loadLibrary();
            librarySection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
}
if (libraryGridBtn) {
    libraryGridBtn.addEventListener("click", () => {
        libraryViewMode = "grid";
        libraryGridBtn.classList.add("active");
        libraryListBtn.classList.remove("active");
        renderLibrary();
    });
}
if (libraryListBtn) {
    libraryListBtn.addEventListener("click", () => {
        libraryViewMode = "list";
        libraryListBtn.classList.add("active");
        libraryGridBtn.classList.remove("active");
        renderLibrary();
    });
}
if (librarySearch) {
    librarySearch.addEventListener("input", () => renderLibrary());
}
if (libraryRefreshBtn) {
    libraryRefreshBtn.addEventListener("click", () => {
        loadLibrary();
        showToast("Library refreshed", "info");
    });
}
if (librarySelectModeBtn) {
    librarySelectModeBtn.addEventListener("click", () => {
        librarySelectMode = !librarySelectMode;
        librarySelectModeBtn.textContent = librarySelectMode ? "Cancel" : "Select";
        libraryGrid.classList.toggle("library-select-mode", librarySelectMode);
        if (!librarySelectMode) {
            selectedLibraryFiles.clear();
            libraryDeleteSelectedBtn.hidden = true;
        }
        renderLibrary();
    });
}
if (libraryDeleteSelectedBtn) {
    libraryDeleteSelectedBtn.addEventListener("click", async () => {
        if (!selectedLibraryFiles.size) return;
        if (!confirm(`Delete ${selectedLibraryFiles.size} file(s)?`)) return;
        for (const jobId of selectedLibraryFiles) {
            try {
                await fetch(`/api/library/${jobId}`, { method: "DELETE" });
            } catch {}
        }
        selectedLibraryFiles.clear();
        libraryDeleteSelectedBtn.hidden = true;
        librarySelectMode = false;
        librarySelectModeBtn.textContent = "Select";
        loadLibrary();
        showToast("Selected files deleted", "info");
    });
}

// ═══════════════════════════════════════════════════
// Phase 2: Enhanced Progress Visualization
// ═══════════════════════════════════════════════════
// Speed sparkline data and canvas
let speedHistory = [];
const speedSparklineCanvas = (function() {
    const c = document.createElement("canvas");
    c.className = "speed-sparkline-canvas";
    c.height = 40;
    return c;
})();

function addSpeedSparklineToProgress() {
    const progressCard = document.querySelector(".progress-card");
    if (!progressCard) return;
    const existing = progressCard.querySelector(".speed-sparkline-wrapper");
    if (existing) return;
    const wrapper = document.createElement("div");
    wrapper.className = "speed-sparkline-wrapper";
    wrapper.innerHTML = '<div class="speed-sparkline-label">Download Speed</div>';
    wrapper.appendChild(speedSparklineCanvas);
    const pipelineChecklist = document.getElementById("pipeline-checklist");
    if (pipelineChecklist) {
        pipelineChecklist.parentNode.insertBefore(wrapper, pipelineChecklist.nextSibling);
    }
}

function drawSpeedSparkline() {
    const ctx = speedSparklineCanvas.getContext("2d");
    // Resize canvas to actual CSS width for responsiveness
    const rect = speedSparklineCanvas.getBoundingClientRect();
    if (rect.width > 0) speedSparklineCanvas.width = rect.width;
    const w = speedSparklineCanvas.width;
    const h = speedSparklineCanvas.height;
    ctx.clearRect(0, 0, w, h);
    if (speedHistory.length < 2) return;
    const maxSpeed = Math.max(...speedHistory, 1);
    const step = w / (speedHistory.length - 1);
    // Draw gradient fill
    ctx.beginPath();
    ctx.moveTo(0, h);
    speedHistory.forEach((speed, i) => {
        const x = i * step;
        const y = h - (speed / maxSpeed) * (h - 4);
        ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.3)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.02)");
    ctx.fillStyle = gradient;
    ctx.fill();
    // Draw line
    ctx.beginPath();
    speedHistory.forEach((speed, i) => {
        const x = i * step;
        const y = h - (speed / maxSpeed) * (h - 4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Enhance renderProgress with detailed stats
const originalRenderProgress = renderProgress;
function renderProgressEnhanced(job) {
    originalRenderProgress(job);
    addSpeedSparklineToProgress();
    // Track speed history
    if (job.speed) {
        speedHistory.push(job.speed);
        if (speedHistory.length > 30) speedHistory.shift();
    } else {
        speedHistory.push(0);
        if (speedHistory.length > 30) speedHistory.shift();
    }
    drawSpeedSparkline();
    // Reset speed history on new download
    if (job.status === "starting" || job.status === "queued") {
        speedHistory = [];
    }
    // Add detailed stats grid if not present
    const progressCard = document.querySelector(".progress-card");
    if (!progressCard) return;
    let statsGrid = progressCard.querySelector(".progress-stats-grid");
    if (!statsGrid) {
        statsGrid = document.createElement("div");
        statsGrid.className = "progress-stats-grid";
        const progressTrack = progressCard.querySelector(".progress-track");
        if (progressTrack) progressTrack.parentNode.insertBefore(statsGrid, progressTrack.nextSibling);
    }
    const downloaded = job.downloaded_bytes ? formatBytes(job.downloaded_bytes) : "—";
    const total = job.total_bytes ? formatBytes(job.total_bytes) : "—";
    const speed = job.speed ? `${formatBytes(job.speed)}/s` : "—";
    const eta = job.eta ? `${job.eta}s` : "—";
    statsGrid.innerHTML = `
        <div class="progress-stat-card">
            <span class="progress-stat-label">Downloaded</span>
            <span class="progress-stat-value">${downloaded}</span>
        </div>
        <div class="progress-stat-card">
            <span class="progress-stat-label">Total</span>
            <span class="progress-stat-value">${total}</span>
        </div>
        <div class="progress-stat-card">
            <span class="progress-stat-label">Speed</span>
            <span class="progress-stat-value accent">${speed}</span>
        </div>
        <div class="progress-stat-card">
            <span class="progress-stat-label">ETA</span>
            <span class="progress-stat-value">${eta}</span>
        </div>
    `;
}
// Override renderProgress
renderProgress = renderProgressEnhanced;

// ═══════════════════════════════════════════════════
// Phase 2: Add to Queue on Download Start
// ═══════════════════════════════════════════════════
// Patch pollJob to add to queue when job starts
const originalPollJob = pollJob;
pollJob = async function patchedPollJob(jobId) {
    // On first poll, add to queue if not already there
    if (!downloadQueue.find(q => q.jobId === jobId)) {
        const title = currentMediaInfo ? currentMediaInfo.title : "Download";
        addToQueue(jobId, title, downloadForm.elements.mode.value);
    }
    return originalPollJob(jobId);
};

// Add focus trap to new modals
[settingsModal, presetsModal].forEach(modal => {
    if (modal) {
        modal.addEventListener("keydown", (e) => trapFocusInModal(modal, e));
    }
});
