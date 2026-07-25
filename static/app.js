// DOM Elements
const toastContainer = document.getElementById("toast-container");
const dropzoneOverlay = document.getElementById("dropzone-overlay");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");

const healthStatusBadge = document.getElementById("health-status-badge");
const ffmpegStatusTxt = document.getElementById("ffmpeg-status-txt");

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

const modeSingleBtn = document.getElementById("mode-single-btn");
const modeBatchBtn = document.getElementById("mode-batch-btn");

const searchResultsSection = document.getElementById("search-results-section");
const searchResultsGrid = document.getElementById("search-results-grid");

const previewSection = document.getElementById("preview-section");
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

const normalizeRow = document.getElementById("normalize-row");
const normalizeAudio = document.getElementById("normalize-audio");

const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");

const progressFill = document.getElementById("progress-fill");
const progressMessage = document.getElementById("progress-message");
const progressPercent = document.getElementById("progress-percent");
const progressDetail = document.getElementById("progress-detail");
const progressSpinner = document.getElementById("progress-spinner");

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

// App State
let currentUrl = "";
let currentJobId = null;
let currentMediaInfo = null;
let isBatchMode = false;

// Toast Notification Manager
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "error" ? "⚠️" : type === "success" ? "✓" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

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

// Initialize Theme from localStorage
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

// System Health Check on Load
async function checkHealth() {
    try {
        const response = await fetch("/api/health");
        const health = await response.json();
        if (health.status === "ok") {
            healthStatusBadge.textContent = "🟢 Engine Online";
            if (health.ffmpeg_available) {
                ffmpegStatusTxt.textContent = `FFmpeg Ready • ${health.free_space_mb || 0} MB Storage Available`;
            } else {
                ffmpegStatusTxt.textContent = "Native Mode • FFmpeg Not Installed";
            }
        }
    } catch {
        healthStatusBadge.textContent = "🟡 Offline Mode";
    }
}
checkHealth();

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

// Render Search Results Grid
function renderSearchResults(results) {
    searchResultsGrid.replaceChildren();
    searchResultsSection.hidden = false;
    previewSection.hidden = true;

    for (const item of results) {
        const card = document.createElement("div");
        card.className = "search-card";
        card.innerHTML = `
            <img class="search-thumb" src="${item.thumbnail}" alt="${item.title}">
            <div class="search-info">
                <div class="search-title">${item.title}</div>
                <div class="search-meta">${item.uploader} • ${formatDuration(item.duration)}</div>
                <button class="search-btn" type="button">Select & Convert</button>
            </div>
        `;
        card.querySelector(".search-btn").addEventListener("click", () => {
            urlInput.value = item.url;
            clearButton.hidden = false;
            searchResultsSection.hidden = true;
            analyzeForm.requestSubmit();
        });
        searchResultsGrid.appendChild(card);
    }
    searchResultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
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
    thumbnail.alt = media.title;

    document.getElementById("media-type-badge").textContent = media.is_playlist ? "Playlist" : (media.platform ? media.platform.toUpperCase() : "Media");
    document.getElementById("duration-badge").textContent = formatDuration(media.duration);
    document.getElementById("uploader").textContent = media.uploader;
    document.getElementById("title").textContent = media.title;
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
    document.getElementById("description").textContent = media.description;

    // Thumbnail direct download chip
    if (media.thumbnail) {
        thumbnailDownloadBtn.hidden = false;
        thumbnailDownloadBtn.href = `/api/thumbnail?url=${encodeURIComponent(media.thumbnail)}&id=${encodeURIComponent(media.id || "video")}`;
    } else {
        thumbnailDownloadBtn.hidden = true;
    }

    // Populate Quality Dropdown
    qualitySelect.replaceChildren();
    const bestOpt = new Option("Best available", "best");
    qualitySelect.add(bestOpt);
    for (const height of media.qualities) {
        qualitySelect.add(new Option(`${height}p High Definition`, height));
    }
    qualitySelect.value = media.qualities.includes("1080") ? "1080" : (media.qualities[0] || "best");

    document.getElementById("playlist").checked = media.is_playlist;

    // Populate Subtitles Dropdown
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

// Mode toggle (Video vs Audio)
function syncMode() {
    const mode = downloadForm.elements.mode.value;
    const isAudio = mode === "audio";
    qualityGroup.hidden = isAudio;
    audioFormatGroup.hidden = !isAudio;
    audioBitrateGroup.hidden = !isAudio;
    normalizeRow.hidden = !isAudio;
}

for (const radio of downloadForm.elements.mode) {
    radio.addEventListener("change", syncMode);
}

// Form Submit: Fetch Media Info or Search Keywords
analyzeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");
    setBusy(analyzeButton, true, "Fetching...");
    previewSection.hidden = true;
    progressSection.hidden = true;
    searchResultsSection.hidden = true;
    currentUrl = urlInput.value.trim();

    try {
        const response = await fetch("/api/info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentUrl }),
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

// Render Progress Info & Skipped Failure Summaries
function renderProgress(job) {
    progressMessage.textContent = job.message || "Converting and downloading…";

    if (job.progress === null || job.progress === undefined) {
        progressFill.style.width = "100%";
        progressPercent.textContent = "Processing…";
    } else {
        progressFill.style.width = `${job.progress}%`;
        progressPercent.textContent = `${job.progress.toFixed(1)}%`;
    }

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
            li.innerHTML = `
                <span>${fail.message || 'Media Item'}</span>
                <span class="failure-reason">${fail.reason}</span>
            `;
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
            const fileUrl = `/api/jobs/${jobId}/file`;
            downloadLink.href = fileUrl;
            downloadLink.textContent = `Save ${job.filename || "file"}`;

            if (job.failures && job.failures.length > 0) {
                resultTitle.textContent = "Conversion Complete (Skipped Items)";
                resultMessage.textContent = `${job.success_count || 1} file(s) ready. Inaccessible items were skipped.`;
            } else {
                resultTitle.textContent = "Conversion Complete!";
                resultMessage.textContent = "Your media file is ready to save.";
            }

            // Audio Player Preview
            if (job.filename && (job.filename.endsWith(".mp3") || job.filename.endsWith(".m4a") || job.filename.endsWith(".wav"))) {
                audioPreview.src = fileUrl;
                audioPlayerWrapper.hidden = false;
            } else {
                audioPlayerWrapper.hidden = true;
            }

            setBusy(downloadButton, false, "Start Conversion");
            showToast("Media ready to download!", "success");

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
    setBusy(downloadButton, true, "Preparing…");
    progressSection.scrollIntoView({ behavior: "smooth", block: "start" });

    const mode = downloadForm.elements.mode.value;
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
                normalize_audio: normalizeAudio.checked,
                start_time: startTimeInput.value.trim() || null,
                end_time: endTimeInput.value.trim() || null,
                playlist: document.getElementById("playlist").checked,
                subtitles: includeSubtitles.checked,
                subtitle_language: includeSubtitles.checked ? subtitleLanguage.value : null,
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
    urlInput.value = "";
    batchUrlsTextarea.value = "";
    clearButton.hidden = true;
    urlInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Local Storage History & Storage Purge Management
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
        title: media.title,
        uploader: media.uploader,
        thumbnail: media.thumbnail,
        filename: job.filename,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        url: currentUrl,
    };
    history = [item, ...history.filter(h => h.id !== item.id)].slice(0, 15);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = getHistory();
    historyCountBadge.textContent = history.length;
    historyCountBadge.hidden = history.length === 0;

    historyList.replaceChildren();
    emptyHistoryMsg.hidden = history.length > 0;

    for (const item of history) {
        const card = document.createElement("div");
        card.className = "history-card-item";
        card.innerHTML = `
            <img src="${item.thumbnail || ''}" alt="${item.title}">
            <div style="flex:1; min-width:0;">
                <div class="history-item-title">${item.title}</div>
                <div class="history-item-meta">${item.uploader} • ${item.timestamp}</div>
            </div>
            <button class="btn-ghost" type="button">Re-fetch</button>
        `;
        card.querySelector("button").addEventListener("click", () => {
            urlInput.value = item.url;
            clearButton.hidden = false;
            analyzeForm.requestSubmit();
            historySection.hidden = true;
        });
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
        checkHealth();
    } catch {
        showToast("Storage purge failed", "error");
    }
});

// Initialize History on Load
renderHistory();
