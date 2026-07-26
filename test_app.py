import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import app
from yt_dlp.utils import DownloadError


class FakeYoutubeDL:
    files = {"video.mp4": b"video"}
    error = None
    info = {
        "id": "example",
        "title": "Example video",
        "uploader": "Example channel",
        "thumbnail": "https://example.com/thumb.jpg",
        "duration": 125,
        "view_count": 1234,
        "upload_date": "20260723",
        "description": "Example description",
        "formats": [{"height": 360}, {"height": 720}, {"height": 1080}],
    }
    last_options = None

    def __init__(self, options):
        self.options = options
        FakeYoutubeDL.last_options = options

    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass

    def extract_info(self, *_args, **_kwargs):
        if self.error:
            raise self.error
        return self.info

    def download(self, _urls):
        if self.error:
            raise self.error
        for hook in self.options.get("progress_hooks", []):
            hook(
                {
                    "status": "downloading",
                    "downloaded_bytes": 256,
                    "total_bytes": 1000,
                    "speed": 128,
                    "eta": 6,
                    "info_dict": {},
                }
            )
            hook({"status": "finished"})
        for hook in self.options.get("postprocessor_hooks", []):
            hook({"status": "started"})
        job_dir = Path(self.options["outtmpl"]).parent
        for name, contents in self.files.items():
            (job_dir / name).write_bytes(contents)


class ImmediateThread:
    def __init__(self, target, args, **_kwargs):
        self.target = target
        self.args = args

    def start(self):
        self.target(*self.args)


class FakeThumbnailResponse:
    url = "https://i.ytimg.com/vi/example/maxresdefault.jpg"

    class Headers:
        @staticmethod
        def get_content_type():
            return "image/jpeg"

    headers = Headers()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass

    @staticmethod
    def read(_size):
        return b"thumbnail"


class AppTest(unittest.TestCase):
    def setUp(self):
        app.app.config["TESTING"] = True
        app.app.testing = True
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_download_root = app.DOWNLOAD_ROOT
        app.DOWNLOAD_ROOT = Path(self.temp_dir.name)
        with app.JOBS_LOCK:
            app.JOBS.clear()
        self.client = app.app.test_client()
        FakeYoutubeDL.files = {"video.mp4": b"video"}
        FakeYoutubeDL.error = None
        FakeYoutubeDL.info["subtitles"] = {}
        FakeYoutubeDL.info["automatic_captions"] = {}
        FakeYoutubeDL.last_options = None

    def tearDown(self):
        with app.JOBS_LOCK:
            app.JOBS.clear()
        app.DOWNLOAD_ROOT = self.original_download_root
        self.temp_dir.cleanup()

    def post_json(self, path, data):
        with (
            patch.object(app.yt_dlp, "YoutubeDL", FakeYoutubeDL),
            patch.object(app, "Thread", ImmediateThread),
        ):
            return self.client.post(path, json=data)

    def start_job(self, **data):
        response = self.post_json(
            "/api/jobs",
            {
                "url": "https://youtu.be/example",
                "mode": "video",
                "quality": "720",
                "playlist": False,
                **data,
            },
        )
        self.assertEqual(response.status_code, 202)
        return response.get_json()["job_id"]

    def test_page_metadata_and_validation(self):
        page = self.client.get("/")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"MediaDrop", page.data)
        with self.client.get("/static/app.js") as javascript:
            self.assertEqual(javascript.status_code, 200)

        invalid = {"url": "https://example.com"}
        self.assertEqual(self.client.post("/api/info", json=invalid).status_code, 400)
        self.assertEqual(self.client.post("/api/jobs", json=invalid).status_code, 400)

        response = self.post_json(
            "/api/info",
            {"url": "https://www.youtube.com/watch?v=example"},
        )
        self.assertEqual(response.status_code, 200)
        details = response.get_json()
        self.assertEqual(details["title"], "Example video")
        self.assertEqual(details["qualities"], ["1080", "720", "360"])

    def test_subtitles_and_audio_options(self):
        FakeYoutubeDL.info["subtitles"] = {"en": [{"ext": "vtt"}]}
        response = self.post_json(
            "/api/info",
            {
                "url": "https://youtu.be/example",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["subtitle_languages"], ["en"])

        options = app.build_options(
            app.DOWNLOAD_ROOT,
            "audio",
            "best",
            False,
            None,
            True,
            "en",
            "320",
            "mp3",
        )
        self.assertTrue(options["writesubtitles"])
        self.assertEqual(options["subtitleslangs"], ["en"])
        self.assertEqual(options["subtitlesformat"], "vtt/best")
        self.assertEqual(options["postprocessors"][0]["preferredquality"], "320")
        self.assertEqual(options["postprocessors"][0]["preferredcodec"], "mp3")

    def test_private_video_error_is_actionable(self):
        FakeYoutubeDL.error = DownloadError(
            "ERROR: [youtube] example: Private video. Sign in if granted access"
        )
        error_msg = self.post_json(
            "/api/info",
            {"url": "https://youtu.be/example"},
        ).get_json()["error"]
        self.assertIn("private", error_msg.lower())

    def test_search_and_time_trimming(self):
        FakeYoutubeDL.info["entries"] = [
            {"id": "abc", "title": "Searched Video", "uploader": "Artist", "duration": 180}
        ]
        search_res = self.post_json(
            "/api/info",
            {"url": "lofi beats"},
        )
        self.assertEqual(search_res.status_code, 200)
        json_data = search_res.get_json()
        self.assertTrue(json_data.get("is_search"))
        self.assertEqual(len(json_data.get("results")), 1)
        self.assertEqual(json_data["results"][0]["title"], "Searched Video")

        options = app.build_options(
            app.DOWNLOAD_ROOT,
            "video",
            "720",
            False,
            start_time="00:30",
            end_time="01:30",
        )
        self.assertIn("download_ranges", options)

    def test_video_options_and_playlist_filename(self):
        options = app.build_options(app.DOWNLOAD_ROOT, "video", "720", True)
        self.assertEqual(options["format"], "bv*[height<=720]+ba/b[height<=720]/b")
        self.assertFalse(options["noplaylist"])
        self.assertTrue(options["noprogress"])
        with app.yt_dlp.YoutubeDL(options) as downloader:
            filename = downloader.prepare_filename(
                {
                    "id": "example",
                    "title": "A title",
                    "ext": "mp4",
                    "playlist_index": 1,
                }
            )
        self.assertEqual(Path(filename).name, "1 - A title [example].mp4")

    def test_winget_ffmpeg_discovery(self):
        executable = (
            app.DOWNLOAD_ROOT
            / "Microsoft/WinGet/Packages"
            / "Gyan.FFmpeg.Essentials_package"
            / "ffmpeg-build"
            / "bin/ffmpeg.exe"
        )
        executable.parent.mkdir(parents=True)
        executable.touch()
        with (
            patch.dict(
                app.os.environ,
                {"FFMPEG_LOCATION": "", "LOCALAPPDATA": str(app.DOWNLOAD_ROOT)},
            ),
            patch.object(app.shutil, "which", return_value=None),
        ):
            self.assertEqual(app.find_ffmpeg(), str(executable))

    def test_progress_status(self):
        with app.JOBS_LOCK:
            app.JOBS["job"] = {"status": "queued"}
        app.update_progress(
            "job",
            {
                "status": "downloading",
                "downloaded_bytes": 256,
                "total_bytes": 1000,
                "speed": 128,
                "eta": 6,
                "info_dict": {},
            },
        )
        progress = self.client.get("/api/jobs/job").get_json()
        self.assertEqual(progress["progress"], 25.6)
        self.assertEqual(progress["eta"], 6)

        app.update_progress("job", {"status": "finished"})
        self.assertEqual(
            self.client.get("/api/jobs/job").get_json()["status"],
            "processing",
        )

    def test_cancel_download(self):
        with app.JOBS_LOCK:
            app.JOBS["job"] = {"status": "downloading"}
        response = self.client.delete("/api/jobs/job")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "canceling")
        with self.assertRaises(app.JobCancelled):
            app.update_progress("job", {"status": "downloading"})

    def test_thumbnail_download(self):
        self.assertEqual(
            self.client.get(
                "/api/thumbnail?url=https://example.com/image.jpg&id=example"
            ).status_code,
            400,
        )
        with patch.object(app, "urlopen", return_value=FakeThumbnailResponse()):
            response = self.client.get(
                "/api/thumbnail"
                "?url=https://i.ytimg.com/vi/example/maxresdefault.jpg&id=example"
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b"thumbnail")
        self.assertIn("example-thumbnail.jpg", response.headers["Content-Disposition"])
        response.close()

    def test_single_file_download_and_cleanup(self):
        job_id = self.start_job()
        status = self.client.get(f"/api/jobs/{job_id}").get_json()
        self.assertEqual(status["status"], "ready")
        self.assertEqual(status["filename"], "video.mp4")

        # File request is non-destructive for audio preview / repeated downloads
        response = self.client.get(f"/api/jobs/{job_id}/file")
        self.assertEqual(response.data, b"video")
        response.close()

        # Job remains intact after preview
        self.assertEqual(self.client.get(f"/api/jobs/{job_id}").status_code, 200)

        # Explicit clean_downloads purges ready job files
        self.client.post("/api/clean_downloads")
        self.assertEqual(list(app.DOWNLOAD_ROOT.iterdir()), [])

    def test_playlist_zip_and_cleanup(self):
        FakeYoutubeDL.files = {"one.mp4": b"one", "two.mp4": b"two"}
        job_id = self.start_job(playlist=True)
        response = self.client.get(f"/api/jobs/{job_id}/file")
        with zipfile.ZipFile(io.BytesIO(response.data)) as archive:
            self.assertIn("media-download/one.mp4", archive.namelist())
            self.assertEqual(archive.read("media-download/one.mp4"), b"one")
        response.close()

        # Explicit clean_downloads purges ready playlist files
        self.client.post("/api/clean_downloads")
        self.assertEqual(list(app.DOWNLOAD_ROOT.iterdir()), [])

    def test_multi_platform_url_validation(self):
        self.assertTrue(app.is_valid_youtube_url("https://www.instagram.com/reel/C123456/"))
        self.assertTrue(app.is_valid_youtube_url("https://www.tiktok.com/@user/video/12345678"))
        self.assertTrue(app.is_valid_youtube_url("https://x.com/user/status/12345678"))
        self.assertTrue(app.is_valid_youtube_url("https://soundcloud.com/artist/track"))
        self.assertFalse(app.is_valid_youtube_url("https://malicious-site.com/video"))

    def test_batch_jobs(self):
        batch_res = self.post_json(
            "/api/batch_jobs",
            {"urls": ["https://youtu.be/example", "https://www.instagram.com/reel/C123456/"]},
        )
        self.assertEqual(batch_res.status_code, 202)
        job_id = batch_res.get_json()["job_id"]
        status = self.client.get(f"/api/jobs/{job_id}").get_json()
        self.assertEqual(status["status"], "ready")

    def test_health_and_clean_downloads(self):
        health_res = self.client.get("/api/health")
        self.assertEqual(health_res.status_code, 200)
        self.assertEqual(health_res.get_json()["status"], "ok")

        clean_res = self.client.post("/api/clean_downloads")
        self.assertEqual(clean_res.status_code, 200)
        self.assertIn("cleaned_items", clean_res.get_json())

    def test_gif_mode_and_transcript(self):
        opts = app.build_options(app.DOWNLOAD_ROOT, "gif", "best", False)
        self.assertEqual(opts["format"], "bestvideo[height<=720]/best")

        transcript_res = self.post_json(
            "/api/transcript",
            {"url": "https://invalid-host.com/video"},
        )
        self.assertEqual(transcript_res.status_code, 400)

    def test_diagnostics_security_headers_and_stage(self):
        res = self.client.get("/api/diagnostics")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("capabilities", data)
        self.assertIn("Content-Security-Policy", res.headers)
        self.assertIn("X-Content-Type-Options", res.headers)

        job_id = self.start_job()
        status_res = self.client.get(f"/api/jobs/{job_id}")
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.get_json()
        self.assertIn("stage", status_data)

    def test_storage_sqlite_and_selective_playlist(self):
        import storage
        storage.save_job_record("test1234", "ready", "ready", 100.0, "Complete", "file.mp4")
        rec = storage.get_job_record("test1234")
        self.assertIsNotNone(rec)
        self.assertEqual(rec["status"], "ready")

        opts = app.build_options(app.DOWNLOAD_ROOT, "video", "best", True, playlist_items="1,3,5")
        self.assertEqual(opts["playlist_items"], "1,3,5")

    def test_clip_time_validation_and_history_search(self):
        # Clip validation test: start_time >= end_time returns 400
        invalid_clip_res = self.post_json(
            "/api/jobs",
            {
                "url": "https://youtu.be/example",
                "mode": "video",
                "start_time": "00:10:00",
                "end_time": "00:05:00",
            },
        )
        self.assertEqual(invalid_clip_res.status_code, 400)
        self.assertIn("Start clip time must be less than end clip time", invalid_clip_res.get_json()["error"])

        # History search query test
        import storage
        storage.save_history_item({
            "id": "item1",
            "title": "Python Tutorial",
            "uploader": "CodeChannel",
            "thumbnail": "http://example.com/thumb.jpg",
            "filename": "video.mp4",
            "url": "https://youtu.be/example",
            "timestamp": "12:00",
        })
        items = storage.get_history_items(query="Python")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Python Tutorial")

    def test_lan_info_and_sponsorblock_options(self):
        lan_res = self.client.get("/api/lan_info")
        self.assertEqual(lan_res.status_code, 200)
        data = lan_res.get_json()
        self.assertIn("local_ip", data)
        self.assertIn("lan_url", data)

        opts_sb = app.build_options(app.DOWNLOAD_ROOT, "video", "720", False, sponsorblock="remove", mute_video=True)
        self.assertIn("bestvideo", opts_sb["format"])
        self.assertIn("postprocessors", opts_sb)

    def test_pwa_manifest_and_sw(self):
        manifest_res = self.client.get("/static/manifest.json")
        self.assertEqual(manifest_res.status_code, 200)
        self.assertIn("MediaDrop", manifest_res.get_json()["name"])

        sw_res = self.client.get("/static/sw.js")
        self.assertEqual(sw_res.status_code, 200)

    def test_download_error_cleanup(self):
        FakeYoutubeDL.error = DownloadError("unavailable")
        job_id = self.start_job()
        status = self.client.get(f"/api/jobs/{job_id}").get_json()
        self.assertEqual(status["status"], "error")
        self.assertIn("unavailable", status["error"])
        self.assertEqual(list(app.DOWNLOAD_ROOT.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
