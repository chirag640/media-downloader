# Simple Media Downloader

Small local web app using HTML, CSS, Flask, yt-dlp, and FFmpeg.

Use only for media you own, public-domain media, Creative Commons media, or media you have permission to download.

## Requirements

- Python 3.10+
- FFmpeg and ffprobe available in PATH
- Node.js, Deno, or another yt-dlp-supported JavaScript runtime

## Windows setup

```powershell
cd yt-downloader-starter
winget install --id Gyan.FFmpeg.Essentials --exact
py -3 -m venv .venv
.venv\Scripts\activate
python -m pip install -U pip
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

## Use

1. Paste a YouTube URL and select **Fetch video**.
2. Review the thumbnail, title, channel, duration, views, date, and available qualities.
3. Choose video or MP3, select the quality, and prepare the download.
4. Optionally include captions or save the source thumbnail.
5. Follow the live percentage, transfer speed, ETA, conversion, and merge status.
6. Select **Save file** when processing finishes, or cancel an unwanted job.

### Private and age-restricted videos

The app cannot bypass YouTube access controls. If your account has permission:

1. Sign in to YouTube in Chrome, Edge, Firefox, or Brave.
2. Expand **Private or age-restricted video?** in the app.
3. Enable **Use my browser login**, select that browser, and fetch the video.
4. If you use a non-default browser profile, enter `Default`, `Profile 1`, or
   the profile name shown by your browser.

yt-dlp reads the selected browser session locally. This app does not export,
store, log, or send browser cookies anywhere except to YouTube as part of the
authorized request. If cookie reading fails, close the browser completely and
retry; Firefox is often the least troublesome fallback.

Check dependencies:

```powershell
ffmpeg -version
node --version
python -m yt_dlp --version
```

Run the checks:

```powershell
python -m unittest -v
```

## Ubuntu setup

```bash
sudo apt update
sudo apt install -y python3-venv ffmpeg
cd yt-downloader-starter
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

## Update yt-dlp

```bash
python -m pip install -U --pre "yt-dlp[default]"
```

## Important

Keep app local/private. Before public deployment, add authentication, rate limits, job queue, playlist-size limits, file-size limits, disk quotas, expiry cleanup, reverse proxy, HTTPS, and CSRF protection.
