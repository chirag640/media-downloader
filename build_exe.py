"""
MediaDrop Standalone Windows Desktop Packager Script
Builds a single MediaDrop.exe executable using PyInstaller.
"""

import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def build():
    print("Building standalone MediaDrop.exe using PyInstaller...")
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--name=MediaDropStudio",
        f"--add-data={BASE_DIR / 'templates'};templates",
        f"--add-data={BASE_DIR / 'static'};static",
        str(BASE_DIR / "app.py"),
    ]
    try:
        subprocess.run(cmd, check=True)
        print("Build complete! Executable located in dist/MediaDropStudio/")
    except Exception as exc:
        print(f"Build failed: {exc}")

if __name__ == "__main__":
    build()
