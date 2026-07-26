"""
MediaDrop Standalone Windows Desktop Packager Script
Builds a single MediaDropStudio.exe executable using PyInstaller + PyWebView in no-console mode.
"""

import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def build():
    venv_pyinstaller = BASE_DIR / ".venv" / "Scripts" / "pyinstaller.exe"
    if venv_pyinstaller.exists():
        pyinstaller_bin = str(venv_pyinstaller)
    else:
        pyinstaller_bin = "pyinstaller"

    print(f"Building native MediaDropStudio.exe desktop application using {pyinstaller_bin}...")
    cmd = [
        pyinstaller_bin,
        "--noconfirm",
        "--onefile",
        "--noconsole",
        "--name=MediaDropStudio",
        f"--add-data={BASE_DIR / 'templates'};templates",
        f"--add-data={BASE_DIR / 'static'};static",
        str(BASE_DIR / "desktop.py"),
    ]


    try:
        subprocess.run(cmd, check=True)
        print("\n[SUCCESS] Build complete! Executable located at: dist/MediaDropStudio.exe")
    except Exception as exc:
        print(f"\n[ERROR] Build failed: {exc}")
        sys.exit(1)

if __name__ == "__main__":
    build()
