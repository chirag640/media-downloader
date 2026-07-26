from __future__ import annotations

import os
import shutil
import sys
import uuid
import zipfile
from io import BytesIO
from pathlib import Path
from threading import Lock, Thread
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import yt_dlp
from flask import Flask, jsonify, render_template, request, send_file
from yt_dlp.utils import DownloadError

BASE_DIR = Path(__file__).resolve().parent
DOWNLOAD_ROOT = BASE_DIR / "downloads"
DOWNLOAD_ROOT.mkdir(exist_ok=True)

ALLOWED_HOSTS = {
    # YouTube
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    # Instagram
    "instagram.com",
    "www.instagram.com",
    # TikTok
    "tiktok.com",
    "www.tiktok.com",
    "vm.tiktok.com",
    # Twitter / X
    "twitter.com",
    "www.twitter.com",
    "x.com",
    "www.x.com",
    # Reddit
    "reddit.com",
    "www.reddit.com",
    # Soundcloud
    "soundcloud.com",
    "www.soundcloud.com",
    # Facebook
    "facebook.com",
    "www.facebook.com",
    "fb.watch",
    # Vimeo & Twitch & Pinterest
    "vimeo.com",
    "www.vimeo.com",
    "twitch.tv",
    "www.twitch.tv",
    "pinterest.com",
    "www.pinterest.com",
}
ALLOWED_QUALITIES = {
    "144",
    "240",
    "360",
    "480",
    "720",
    "1080",
    "1440",
    "2160",
    "best",
}
ALLOWED_BITRATES = {"128", "192", "320"}
ALLOWED_AUDIO_FORMATS = {"mp3", "m4a", "wav"}
THUMBNAIL_HOSTS = {"i.ytimg.com", "img.youtube.com"}

app = Flask(__name__)

# ponytail: in-memory jobs fit this single-user local app; use a persistent
# queue and expiry worker before multi-user hosting.
JOBS: dict[str, dict] = {}
JOBS_LOCK = Lock()


class JobCancelled(Exception):
    pass


class JobLogger:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.failures = []

    def debug(self, *_):
        pass

    def info(self, *_):
        pass

    def warning(self, msg):
        if "ERROR:" in str(msg) or "WARNING:" in str(msg):
            self.error(msg)

    def error(self, msg):
        message = str(msg).removeprefix("ERROR: ").removeprefix("WARNING: ").strip()
        lowered = message.lower()
        if any(keyword in lowered for keyword in ["private video", "unavailable", "sign in to confirm", "age-restricted", "copyright", "deleted"]):
            reason = friendly_error(Exception(message))
            entry = {"message": message, "reason": reason}
            self.failures.append(entry)
            with JOBS_LOCK:
                if job := JOBS.get(self.job_id):
                    job.setdefault("failures", []).append(entry)


def find_ffmpeg() -> str | None:
    if location := os.getenv("FFMPEG_LOCATION") or shutil.which("ffmpeg"):
        return location
    if local_app_data := os.getenv("LOCALAPPDATA"):
        return next(
            (
                str(path)
                for path in (Path(local_app_data) / "Microsoft/WinGet/Packages").glob(
                    "Gyan.FFmpeg*/*/bin/ffmpeg.exe"
                )
            ),
            None,
        )
    return None


def friendly_error(exc: Exception) -> str:
    message = str(exc).removeprefix("ERROR: ").strip()
    lowered = message.lower()

    if "private video" in lowered:
        return "This video is private and cannot be accessed."
    if "sign in to confirm your age" in lowered or "age-restricted" in lowered:
        return "This video is age-restricted and cannot be downloaded without restricted access."
    if "unavailable" in lowered or "not available" in lowered:
        return "This video is unavailable or has been removed."
    return message


def is_valid_youtube_url(value: str) -> bool:
    """Accept only normal HTTP(S) YouTube URLs."""
    try:
        parsed = urlparse(value.strip())
    except ValueError:
        return False

    return parsed.scheme in {"http", "https"} and parsed.hostname in ALLOWED_HOSTS


def parse_time_seconds(time_str: str | None) -> int | None:
    if not time_str:
        return None
    try:
        parts = time_str.strip().split(":")
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        return int(parts[0])
    except Exception:
        return None


def set_job(job_id: str, **kwargs) -> None:
    with JOBS_LOCK:
        job = JOBS.setdefault(job_id, {})
        job.update(kwargs)
        storage.save_job_record(
            job_id,
            status=job.get("status", "queued"),
            stage=job.get("stage", "connecting"),
            progress=job.get("progress"),
            message=job.get("message", ""),
            filename=job.get("filename"),
            job_dir=str(job.get("job_dir")) if job.get("job_dir") else None,
            path=str(job.get("path")) if job.get("path") else None,
            error=job.get("error"),
            failures=job.get("failures"),
        )


def build_options(
    job_dir: Path,
    mode: str,
    quality: str,
    download_playlist: bool,
    cookies_from_browser: tuple | None = None,
    include_subtitles: bool = False,
    subtitle_language: str | None = None,
    audio_bitrate: str = "192",
    audio_format: str = "mp3",
    job_id: str | None = None,
    start_time: str | None = None,
    end_time: str | None = None,
    normalize_audio: bool = False,
    audio_effect: str = "none",
    playlist_items: str | None = None,
    sponsorblock: str | None = None,
    mute_video: bool = False,
) -> dict:
    if download_playlist:
        out_path = str(job_dir / "%(playlist_index&{} - |)s%(title).150B [%(id)s].%(ext)s")
    else:
        out_path = str(job_dir / "%(title).200s [%(id)s].%(ext)s")

    options = {
        "outtmpl": out_path,
        "noplaylist": not download_playlist,
        "concurrent_fragment_downloads": 4,
        "format": "bestvideo/best" if mute_video else "bestvideo+bestaudio/best",
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "extract_flat": False,
        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
        "ignoreerrors": True,
    }

    if sponsorblock == "remove":
        options["postprocessors"] = [{
            "key": "SponsorBlock",
            "categories": ["sponsor", "intro", "outro", "selfpromo"],
            "when": "after_filter"
        }, {
            "key": "ModifyChapters",
            "remove_sponsor_segments": ["sponsor", "intro", "outro", "selfpromo"]
        }]
    elif sponsorblock == "mark":
        options["postprocessors"] = [{
            "key": "SponsorBlock",
            "categories": ["sponsor", "intro", "outro", "selfpromo"],
            "when": "after_filter"
        }]

    if playlist_items:
        options["playlist_items"] = playlist_items
        
    options.update({
        "noprogress": True,
        "logger": JobLogger(job_id) if job_id else JobLogger("standalone"),
        "concurrent_fragment_downloads": 4,
        "retries": 10,
        "fragment_retries": 10,
        "extractor_args": {
            "youtube": {
                "player_client": ["tv", "android_vr", "web_creator", "mweb", "web"],
            }
        },
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    })

    start_sec = parse_time_seconds(start_time)
    end_sec = parse_time_seconds(end_time)
    if start_sec is not None or end_sec is not None:
        try:
            from yt_dlp.utils import download_range_func
            options["download_ranges"] = download_range_func([], [(start_sec, end_sec)])
            options["force_keyframes_at_cuts"] = True
        except ImportError:
            pass

    if ffmpeg_location := find_ffmpeg():
        options["ffmpeg_location"] = ffmpeg_location
    if cookies_from_browser:
        options["cookiesfrombrowser"] = cookies_from_browser
    if include_subtitles:
        options.update(
            {
                "writesubtitles": True,
                "writeautomaticsub": True,
                "subtitleslangs": [subtitle_language],
                "subtitlesformat": "vtt/best",
            }
        )

    if mode == "gif":
        options.update(
            {
                "format": "bestvideo[height<=720]/best",
                "postprocessors": [
                    {
                        "key": "FFmpegVideoConvertor",
                        "preferedformat": "gif",
                    }
                ],
                "postprocessor_args": {
                    "FFmpegVideoConvertor": [
                        "-vf",
                        "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                    ]
                },
            }
        )
        return options

    if mode == "audio":
        codec = audio_format if audio_format in ALLOWED_AUDIO_FORMATS else "mp3"
        bitrate = audio_bitrate if audio_bitrate in ALLOWED_BITRATES else "192"
        postprocessors = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": codec,
                "preferredquality": bitrate,
            }
        ]
        args = []
        if normalize_audio:
            args.extend(["-af", "loudnorm"])
        if audio_effect == "nightcore":
            args.extend(["-af", "asetrate=44100*1.25,aresample=44100"])
        elif audio_effect == "slowed":
            args.extend(["-af", "asetrate=44100*0.85,aresample=44100"])

        if args:
            options["postprocessor_args"] = {"FFmpegExtractAudio": args}

        options.update(
            {
                "format": "bestaudio/best",
                "postprocessors": postprocessors,
            }
        )
        return options

    if mute_video:
        video_format = "bestvideo/best" if quality == "best" else f"bv*[height<={quality}]/bestvideo/best"
    elif quality == "best":
        video_format = "bv*+ba/b"
    else:
        video_format = f"bv*[height<={quality}]+ba/b[height<={quality}]/b"

    options.update(
        {
            "format": video_format,
            "merge_output_format": "mp4",
        }
    )
    return options


def collect_finished_files(job_dir: Path) -> list[Path]:
    ignored_suffixes = {".part", ".ytdl", ".tmp"}
    return sorted(
        path
        for path in job_dir.rglob("*")
        if path.is_file() and path.suffix.lower() not in ignored_suffixes
    )


def sanitize_folder_name(name: str | None) -> str:
    if not name:
        return "media-download"
    clean = "".join(char if char.isalnum() or char in " -_()." else "_" for char in name).strip()
    return clean[:150] or "media-download"


def make_zip(job_dir: Path, files: list[Path], title: str | None = None) -> Path:
    folder_name = sanitize_folder_name(title)
    zip_path = job_dir / f"{folder_name}.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in files:
            arcname = Path(folder_name) / file_path.name
            archive.write(file_path, arcname=str(arcname))
    return zip_path


def set_job(job_id: str, **changes) -> None:
    with JOBS_LOCK:
        if job := JOBS.get(job_id):
            job.update(changes)


def ensure_not_cancelled(job_id: str) -> None:
    with JOBS_LOCK:
        if job := JOBS.get(job_id):
            if job.get("cancel_requested"):
                raise JobCancelled


def update_progress(job_id: str, data: dict) -> None:
    ensure_not_cancelled(job_id)
    status = data.get("status")
    if status == "finished":
        set_job(
            job_id,
            status="processing",
            progress=100,
            message="Download complete. Converting and preparing your file…",
        )
        return
    if status != "downloading":
        return

    downloaded = data.get("downloaded_bytes") or 0
    total = data.get("total_bytes") or data.get("total_bytes_estimate")
    progress = min(downloaded / total * 100, 100) if total else None
    info = data.get("info_dict") or {}
    index = info.get("playlist_index")
    count = info.get("playlist_count") or info.get("n_entries")
    playlist_title = info.get("playlist_title") or info.get("playlist") or info.get("title")
    message = "Downloading media…"
    stage = "downloading"

    if index and count:
        message = f"Downloading playlist item {index} of {count}…"
        progress = ((index - 1) + (progress or 0) / 100) / count * 100
    
    if progress and progress >= 95:
        stage = "encoding"

    changes = {
        "status": "downloading",
        "progress": round(progress, 1) if progress is not None else None,
        "downloaded_bytes": downloaded,
        "total_bytes": total,
        "speed": data.get("speed"),
        "eta": data.get("eta"),
        "message": message,
        "stage": stage,
    }
    if playlist_title:
        changes["playlist_title"] = playlist_title

    set_job(job_id, **changes)


def run_download(
    job_id: str,
    job_dir: Path,
    url: str,
    mode: str,
    quality: str,
    download_playlist: bool,
    cookies_from_browser: tuple | None = None,
    include_subtitles: bool = False,
    subtitle_language: str | None = None,
    audio_bitrate: str = "192",
    audio_format: str = "mp3",
    start_time: str | None = None,
    end_time: str | None = None,
    normalize_audio: bool = False,
    audio_effect: str = "none",
    playlist_items: str | None = None,
    sponsorblock: str | None = None,
    mute_video: bool = False,
) -> None:
    try:
        set_job(job_id, status="starting", stage="connecting", message="Connecting to media source…")
        options = build_options(
            job_dir,
            mode,
            quality,
            download_playlist,
            cookies_from_browser=cookies_from_browser,
            include_subtitles=include_subtitles,
            subtitle_language=subtitle_language,
            audio_bitrate=audio_bitrate,
            audio_format=audio_format,
            job_id=job_id,
            start_time=start_time,
            end_time=end_time,
            normalize_audio=normalize_audio,
            audio_effect=audio_effect,
            playlist_items=playlist_items,
            sponsorblock=sponsorblock,
            mute_video=mute_video,
        )
        options["progress_hooks"] = [lambda data: update_progress(job_id, data)]

        def postprocessor_hook(data):
            ensure_not_cancelled(job_id)
            if data.get("status") in {"started", "processing"}:
                set_job(
                    job_id,
                    status="processing",
                    stage="encoding",
                    message=(
                        f"Extracting and converting audio to {audio_format.upper()}…"
                        if mode == "audio"
                        else "Merging video and audio streams…"
                    ),
                )

        options["postprocessor_hooks"] = [postprocessor_hook]

        with yt_dlp.YoutubeDL(options) as downloader:
            downloader.download([url])

        ensure_not_cancelled(job_id)
        files = collect_finished_files(job_dir)
        with JOBS_LOCK:
            failures = JOBS.get(job_id, {}).get("failures") or []
            playlist_title = JOBS.get(job_id, {}).get("playlist_title")

        if not files:
            if failures:
                raise RuntimeError(failures[0]["reason"])
            raise RuntimeError("No downloadable file was produced.")

        if len(files) > 1:
            set_job(job_id, status="processing", stage="packaging", message="Creating ZIP archive…")
            output_path = make_zip(job_dir, files, title=playlist_title)
        else:
            output_path = files[0]

        set_job(
            job_id,
            status="ready",
            stage="ready",
            progress=100,
            filename=output_path.name,
            path=output_path,
            message="Media ready to download.",
            success_count=len(files),
            failed_count=len(failures),
            failures=failures,
        )
    except JobCancelled:
        shutil.rmtree(job_dir, ignore_errors=True)
        set_job(
            job_id,
            status="canceled",
            stage="canceled",
            message="Download canceled.",
            progress=0,
        )
    except Exception as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        with JOBS_LOCK:
            failures = JOBS.get(job_id, {}).get("failures") or []
        set_job(
            job_id,
            status="error",
            stage="error",
            message="Download failed.",
            error=friendly_error(exc),
            failures=failures,
        )


def video_details(info: dict) -> dict:
    is_playlist = info.get("_type") == "playlist"
    entries = [entry for entry in info.get("entries") or [] if entry]
    media = entries[0] if is_playlist and entries else info
    formats = media.get("formats") or []
    subtitle_languages = sorted(
        (
            set((media.get("subtitles") or {}).keys())
            | set((media.get("automatic_captions") or {}).keys())
        )
        - {"live_chat"}
    )
    heights = sorted(
        {
            int(item["height"])
            for item in formats
            if item.get("height") and str(int(item["height"])) in ALLOWED_QUALITIES
        },
        reverse=True,
    )

    if not heights:
        heights = [1080, 720, 360]

    extractor = (info.get("extractor") or media.get("extractor") or "").lower()
    if "instagram" in extractor:
        platform = "instagram"
    elif "tiktok" in extractor:
        platform = "tiktok"
    elif "twitter" in extractor or "x" in extractor:
        platform = "twitter"
    elif "soundcloud" in extractor:
        platform = "soundcloud"
    elif "reddit" in extractor:
        platform = "reddit"
    elif "facebook" in extractor:
        platform = "facebook"
    else:
        platform = "youtube"

    playlist_entries = []
    if is_playlist and entries:
        for idx, entry in enumerate(entries[:50], 1):
            if entry:
                playlist_entries.append({
                    "index": idx,
                    "id": entry.get("id"),
                    "title": entry.get("title") or f"Item {idx}",
                    "duration": entry.get("duration"),
                    "thumbnail": entry.get("thumbnail"),
                })

    resolution_cards = []
    for h in heights:
        if h >= 2160:
            resolution_cards.append({"quality": str(h), "label": "4K Ultra HD", "badge": "PRO 4K", "icon": "⚡"})
        elif h >= 1080:
            resolution_cards.append({"quality": str(h), "label": "1080p Full HD", "badge": "POPULAR", "icon": "▶"})
        elif h >= 720:
            resolution_cards.append({"quality": str(h), "label": "720p HD", "badge": "FAST", "icon": "🎬"})
        else:
            resolution_cards.append({"quality": str(h), "label": f"{h}p Standard", "badge": "COMPACT", "icon": "📱"})

    resolution_cards.append({"quality": "mp3-320", "label": "320k MP3 Audio", "badge": "AUDIO", "icon": "♫", "is_audio": True})

    return {
        "id": media.get("id") or info.get("id"),
        "title": info.get("title") or media.get("title") or "Untitled media",
        "uploader": (
            info.get("uploader")
            or info.get("channel")
            or media.get("uploader")
            or media.get("channel")
            or "Unknown channel"
        ),
        "thumbnail": info.get("thumbnail") or media.get("thumbnail"),
        "duration": media.get("duration"),
        "view_count": media.get("view_count"),
        "upload_date": media.get("upload_date"),
        "description": (media.get("description") or "").strip()[:500],
        "live_status": media.get("live_status"),
        "is_playlist": is_playlist,
        "item_count": info.get("playlist_count") or len(entries) if is_playlist else None,
        "platform": platform,
        "qualities": [str(height) for height in heights],
        "resolution_cards": resolution_cards,
        "playlist_entries": playlist_entries,
        "audio_bitrates": ["320", "192", "128"],
        "audio_formats": ["mp3", "m4a", "wav"],
        "subtitle_languages": subtitle_languages,
    }


def search_youtube(query: str):
    options = build_options(DOWNLOAD_ROOT, "video", "best", False)
    options["extract_flat"] = "in_playlist"
    with yt_dlp.YoutubeDL(options) as downloader:
        info = downloader.extract_info(f"ytsearch5:{query}", download=False)
    entries = info.get("entries") or []
    results = []
    for item in entries:
        if item:
            results.append({
                "id": item.get("id"),
                "url": f"https://www.youtube.com/watch?v={item.get('id')}",
                "title": item.get("title") or "Untitled video",
                "uploader": item.get("uploader") or item.get("channel") or "YouTube Creator",
                "duration": item.get("duration"),
                "thumbnail": item.get("thumbnail") or f"https://i.ytimg.com/vi/{item.get('id')}/hqdefault.jpg",
                "view_count": item.get("view_count"),
            })
    return jsonify(is_search=True, results=results)


from concurrent.futures import ThreadPoolExecutor

WORKER_POOL = ThreadPoolExecutor(max_workers=2, thread_name_prefix="mediadrop_worker")
ALLOWED_BROWSERS = {"chrome", "edge", "firefox", "brave", "safari"}

def run_job_async(func, *args):
    if app.config.get("TESTING") or app.testing:
        func(*args)
    else:
        WORKER_POOL.submit(func, *args)

@app.after_request
def apply_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https: http:; "
        "media-src 'self' blob:; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com;"
    )
    return response


@app.get("/api/diagnostics")
def get_diagnostics():
    ffmpeg_available = bool(shutil.which("ffmpeg"))
    ffprobe_available = bool(shutil.which("ffprobe"))
    node_available = bool(shutil.which("node"))
    deno_available = bool(shutil.which("deno"))
    
    total, used, free = shutil.disk_usage(DOWNLOAD_ROOT)
    free_mb = free // (1024 * 1024)

    return jsonify({
        "status": "ok",
        "python_version": sys.version.split()[0],
        "ytdlp_version": getattr(yt_dlp.version, "__version__", "unknown"),
        "ffmpeg_available": ffmpeg_available,
        "ffprobe_available": ffprobe_available,
        "node_available": node_available,
        "deno_available": deno_available,
        "free_space_mb": free_mb,
        "capabilities": {
            "can_merge_video": ffmpeg_available,
            "can_convert_audio": ffmpeg_available,
            "can_make_gif": ffmpeg_available,
            "can_solve_youtube_js": node_available or deno_available,
        }
    })


import socket

@app.get("/api/lan_info")
def get_lan_info():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "127.0.0.1"

    return jsonify({
        "local_ip": local_ip,
        "port": 5000,
        "lan_url": f"http://{local_ip}:5000",
    })


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/info")
def media_info():
    data = request.get_json(silent=True) or {}
    url = str(data.get("url", "")).strip()
    browser_cookie = str(data.get("cookies_from_browser") or "").strip().lower()

    cookies_tuple = None
    if browser_cookie and browser_cookie in ALLOWED_BROWSERS:
        cookies_tuple = (browser_cookie,)

    if not is_valid_youtube_url(url):
        if url and not url.startswith("http://") and not url.startswith("https://"):
            try:
                return search_youtube(url)
            except Exception as exc:
                return jsonify(error=f"Search error: {friendly_error(exc)}"), 400
        return jsonify(error="Enter a valid YouTube or YouTube Music URL."), 400

    try:
        options = build_options(
            DOWNLOAD_ROOT,
            "video",
            "best",
            False,
            cookies_from_browser=cookies_tuple,
        )
        options["extract_flat"] = "in_playlist"
        with yt_dlp.YoutubeDL(options) as downloader:
            info = downloader.extract_info(url, download=False)
        return jsonify(video_details(info))
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    except DownloadError as exc:
        return jsonify(error=friendly_error(exc)), 400
    except Exception as exc:
        return jsonify(error=friendly_error(exc)), 500


@app.post("/api/jobs")
def start_download():
    data = request.get_json(silent=True) or {}
    url = str(data.get("url", "")).strip()
    mode = str(data.get("mode", "video"))
    quality = str(data.get("quality", "720"))
    audio_bitrate = str(data.get("audio_bitrate", "192"))
    audio_format = str(data.get("audio_format", "mp3"))
    start_time = str(data.get("start_time") or "").strip() or None
    end_time = str(data.get("end_time") or "").strip() or None
    download_playlist = data.get("playlist") is True
    include_subtitles = data.get("subtitles") is True
    subtitle_language = str(data.get("subtitle_language") or "").strip()
    normalize_audio = data.get("normalize_audio") is True
    audio_effect = str(data.get("audio_effect") or "none")
    sponsorblock = str(data.get("sponsorblock") or "").strip() or None
    mute_video = data.get("mute_video") is True
    browser_cookie = str(data.get("cookies_from_browser") or "").strip().lower()
    cookies_tuple = (browser_cookie,) if browser_cookie in ALLOWED_BROWSERS else None

    items_to_download = data.get("items_to_download")
    playlist_items = None
    if items_to_download and isinstance(items_to_download, list):
        playlist_items = ",".join(str(idx) for idx in items_to_download)
    elif data.get("playlist_items"):
        playlist_items = str(data.get("playlist_items"))

    if not is_valid_youtube_url(url):
        return jsonify(error="Enter a valid YouTube or YouTube Music URL."), 400

    start_sec = parse_time_seconds(start_time)
    end_sec = parse_time_seconds(end_time)
    if start_sec is not None and end_sec is not None and start_sec >= end_sec:
        return jsonify(error="Start clip time must be less than end clip time."), 400

    if mode not in {"video", "audio", "gif"}:
        return jsonify(error="Invalid download type."), 400

    if quality not in ALLOWED_QUALITIES:
        return jsonify(error="Invalid video quality."), 400
    if audio_bitrate not in ALLOWED_BITRATES:
        return jsonify(error="Invalid audio bitrate."), 400
    if audio_format not in ALLOWED_AUDIO_FORMATS:
        return jsonify(error="Invalid audio format."), 400
    if include_subtitles and (
        not subtitle_language
        or len(subtitle_language) > 35
        or not subtitle_language.replace("-", "").replace("_", "").isalnum()
    ):
        return jsonify(error="Invalid subtitle language."), 400

    job_id = uuid.uuid4().hex
    job_dir = DOWNLOAD_ROOT / job_id
    job_dir.mkdir(parents=True)
    with JOBS_LOCK:
        JOBS[job_id] = {
            "status": "queued",
            "stage": "connecting",
            "progress": 0,
            "message": "Queued…",
            "job_dir": job_dir,
            "failures": [],
        }

    run_job_async(
        run_download,
        job_id,
        job_dir,
        url,
        mode,
        quality,
        download_playlist,
        cookies_tuple,
        include_subtitles,
        subtitle_language or None,
        audio_bitrate,
        audio_format,
        start_time,
        end_time,
        normalize_audio,
        audio_effect,
        playlist_items,
        sponsorblock,
        mute_video,
    )
    return jsonify(job_id=job_id), 202


@app.post("/api/transcript")
def fetch_transcript():
    data = request.get_json(silent=True) or {}
    url = str(data.get("url", "")).strip()
    if not is_valid_youtube_url(url):
        return jsonify(error="Provide a valid media URL for transcript extraction."), 400

    try:
        options = {
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["en", "auto"],
            "quiet": True,
        }
        with yt_dlp.YoutubeDL(options) as downloader:
            info = downloader.extract_info(url, download=False)

        subtitles = info.get("subtitles") or info.get("automatic_captions") or {}
        if not subtitles:
            return jsonify(error="No transcript or captions found for this media."), 404

        lang = "en" if "en" in subtitles else list(subtitles.keys())[0]
        caption_url = subtitles[lang][0].get("url")
        if not caption_url:
            return jsonify(error="Could not retrieve transcript URL."), 404

        req = Request(caption_url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=15) as source:
            raw = source.read().decode("utf-8", errors="ignore")

        lines = []
        for line in raw.splitlines():
            line = line.strip()
            if not line or "-->" in line or line.startswith("WEBVTT") or line.startswith("<"):
                continue
            if line not in lines:
                lines.append(line)

        transcript_text = "\n".join(lines[:200]) or "Transcript not available."
        return jsonify(title=info.get("title"), transcript=transcript_text)
    except Exception as exc:
        return jsonify(error=f"Transcript extraction failed: {friendly_error(exc)}"), 500


def run_batch_download(
    job_id: str,
    job_dir: Path,
    urls: list[str],
    mode: str,
    quality: str,
    audio_bitrate: str,
    audio_format: str,
) -> None:
    try:
        total = len(urls)
        set_job(job_id, status="starting", stage="connecting", message=f"Starting batch process ({total} items)…")
        
        for idx, url in enumerate(urls, 1):
            ensure_not_cancelled(job_id)
            try:
                set_job(job_id, status="downloading", stage="downloading", message=f"Downloading item {idx} of {total}…")
                options = build_options(job_dir, mode, quality, False, audio_bitrate=audio_bitrate, audio_format=audio_format, job_id=job_id)
                options["progress_hooks"] = [lambda d: update_progress(job_id, d)]
                with yt_dlp.YoutubeDL(options) as downloader:
                    downloader.download([url])
            except Exception as exc:
                with JOBS_LOCK:
                    failures = JOBS.get(job_id, {}).get("failures") or []
                    failures.append({"url": url, "reason": friendly_error(exc), "message": f"Item {idx}"})
                    JOBS[job_id]["failures"] = failures

        ensure_not_cancelled(job_id)
        files = collect_finished_files(job_dir)
        with JOBS_LOCK:
            failures = JOBS.get(job_id, {}).get("failures") or []

        if not files:
            if failures:
                raise RuntimeError(failures[0]["reason"])
            raise RuntimeError("No downloadable file was produced in batch.")

        if len(files) > 1:
            set_job(job_id, status="processing", stage="packaging", message="Creating ZIP archive for batch…")
            output_path = make_zip(job_dir, files, title="batch_downloads")
        else:
            output_path = files[0]

        msg = f"Batch complete. {len(files)} files ready."
        if failures:
            msg += f" {len(failures)} skipped."

        set_job(
            job_id,
            status="ready",
            stage="ready",
            progress=100,
            filename=output_path.name,
            path=output_path,
            message=msg,
            success_count=len(files),
            failed_count=len(failures),
            failures=failures,
        )
    except JobCancelled:
        shutil.rmtree(job_dir, ignore_errors=True)
        set_job(job_id, status="canceled", stage="canceled", message="Batch download canceled.", progress=0)
    except Exception as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        with JOBS_LOCK:
            failures = JOBS.get(job_id, {}).get("failures") or []
        set_job(job_id, status="error", stage="error", message="Batch download failed.", error=friendly_error(exc), failures=failures)


@app.post("/api/batch_jobs")
def start_batch_download():
    data = request.get_json(silent=True) or {}
    raw_urls = data.get("urls") or []
    if isinstance(raw_urls, str):
        raw_urls = [u.strip() for u in raw_urls.split("\n") if u.strip()]

    valid_urls = [u for u in raw_urls if is_valid_youtube_url(u)]
    if not valid_urls:
        return jsonify(error="Provide at least one valid media URL for batch queue."), 400

    mode = str(data.get("mode", "video"))
    quality = str(data.get("quality", "720"))
    audio_bitrate = str(data.get("audio_bitrate", "192"))
    audio_format = str(data.get("audio_format", "mp3"))

    job_id = uuid.uuid4().hex
    job_dir = DOWNLOAD_ROOT / job_id
    job_dir.mkdir(parents=True)
    with JOBS_LOCK:
        JOBS[job_id] = {
            "status": "queued",
            "stage": "connecting",
            "progress": 0,
            "message": "Queued batch…",
            "job_dir": job_dir,
            "failures": [],
        }

    run_job_async(run_batch_download, job_id, job_dir, valid_urls[:10], mode, quality, audio_bitrate, audio_format)
    return jsonify(job_id=job_id, count=len(valid_urls[:10])), 202


@app.get("/api/jobs/<job_id>")
def job_status(job_id: str):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if job:
            public_job = {
                key: job.get(key)
                for key in (
                    "status",
                    "stage",
                    "progress",
                    "message",
                    "downloaded_bytes",
                    "total_bytes",
                    "speed",
                    "eta",
                    "filename",
                    "error",
                    "failures",
                    "success_count",
                    "failed_count",
                )
                if key in job
            }

    if not job:
        return jsonify(error="Download job not found."), 404
    return jsonify(public_job)


@app.delete("/api/jobs/<job_id>")
def cancel_download(job_id: str):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if job and job["status"] not in {"ready", "error", "canceled"}:
            job.update(
                {
                    "cancel_requested": True,
                    "status": "canceling",
                    "message": "Canceling download…",
                }
            )

    if not job:
        return jsonify(error="Download job not found."), 404
    if job["status"] == "ready":
        return jsonify(error="The file is already ready."), 409
    return jsonify(status=job["status"])


@app.get("/api/jobs/<job_id>/file")
def download_file(job_id: str):
    with JOBS_LOCK:
        job = JOBS.get(job_id)

    if not job:
        return jsonify(error="Download job not found."), 404
    if job["status"] != "ready":
        return jsonify(error="The file is not ready yet."), 409

    output_path = Path(job["path"])
    response = send_file(
        output_path,
        as_attachment=True,
        download_name=output_path.name,
    )
    return response


@app.get("/api/thumbnail")
def download_thumbnail():
    url = request.args.get("url", "").strip()
    media_id = request.args.get("id", "video")
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in THUMBNAIL_HOSTS:
        return jsonify(error="Invalid YouTube thumbnail URL."), 400
    if not media_id or not all(char.isalnum() or char in "-_" for char in media_id):
        media_id = "video"

    try:
        with urlopen(
            Request(url, headers={"User-Agent": "Mozilla/5.0"}),
            timeout=15,
        ) as source:
            if urlparse(source.url).hostname not in THUMBNAIL_HOSTS:
                return jsonify(error="Unexpected thumbnail redirect."), 400
            mimetype = source.headers.get_content_type()
            content = source.read(10 * 1024 * 1024 + 1)
    except Exception as exc:
        return jsonify(error=f"Could not fetch thumbnail: {exc}"), 502

    if not mimetype.startswith("image/"):
        return jsonify(error="Thumbnail response was not an image."), 502
    if len(content) > 10 * 1024 * 1024:
        return jsonify(error="Thumbnail is too large."), 413

    extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(
        mimetype,
        "jpg",
    )
    return send_file(
        BytesIO(content),
        mimetype=mimetype,
        as_attachment=True,
        download_name=f"{media_id}-thumbnail.{extension}",
    )


@app.get("/api/health")
def health_check():
    ffmpeg_path = find_ffmpeg()
    ffmpeg_status = bool(ffmpeg_path)
    free_space = 0
    total_space = 0
    try:
        usage = shutil.disk_usage(DOWNLOAD_ROOT)
        free_space = usage.free
        total_space = usage.total
    except Exception:
        pass

    return jsonify(
        status="ok",
        ffmpeg_available=ffmpeg_status,
        ytdlp_version=getattr(yt_dlp, "__version__", "unknown"),
        free_space_mb=round(free_space / (1024 * 1024), 1),
        total_space_mb=round(total_space / (1024 * 1024), 1),
    )


@app.post("/api/clean_downloads")
def clean_downloads():
    count = 0
    freed_bytes = 0
    with JOBS_LOCK:
        active_dirs = {
            job["job_dir"]
            for job in JOBS.values()
            if "job_dir" in job and job.get("status") not in {"ready", "error", "canceled"}
        }

    for item in DOWNLOAD_ROOT.iterdir():
        if item not in active_dirs:
            try:
                if item.is_file():
                    freed_bytes += item.stat().st_size
                    item.unlink()
                    count += 1
                elif item.is_dir():
                    for sub in item.rglob("*"):
                        if sub.is_file():
                            freed_bytes += sub.stat().st_size
                    shutil.rmtree(item, ignore_errors=True)
                    count += 1
            except Exception:
                pass
    return jsonify(cleaned_items=count, freed_mb=round(freed_bytes / (1024 * 1024), 2))


@app.post("/api/update_ytdlp")
def update_ytdlp_engine():
    import subprocess
    try:
        res = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if res.returncode == 0:
            import importlib
            importlib.reload(yt_dlp)
            new_ver = getattr(yt_dlp, "__version__", "updated")
            return jsonify(status="ok", message=f"Successfully updated yt-dlp to version {new_ver}", version=new_ver)
        return jsonify(error=f"Update failed: {res.stderr[:200]}"), 500
    except Exception as exc:
        return jsonify(error=f"Update exception: {friendly_error(exc)}"), 500


if __name__ == "__main__":
    try:
        import waitress
        print("Starting MediaDrop Production Studio Server (Waitress) at http://127.0.0.1:5000")
        waitress.serve(app, host="127.0.0.1", port=5000)
    except ImportError:
        app.run(host="127.0.0.1", port=5000)
