"""
MediaDrop Studio Native Desktop Application Launcher
Launches Flask backend in a background thread and opens a native OS application window using PyWebView.
"""

import sys
import socket
import threading
import time
import webview
from app import app

def get_free_port() -> int:
    """Find an available local port automatically."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def run_server(port: int):
    """Run Flask server using Waitress or fallback to Flask WSGI."""
    try:
        from waitress import serve
        serve(app, host="127.0.0.1", port=port, _quiet=True)
    except ImportError:
        app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)

def main():
    port = get_free_port()
    
    # Start Flask server in background daemon thread
    server_thread = threading.Thread(target=run_server, args=(port,), daemon=True)
    server_thread.start()

    # Allow server to bind and start listening
    time.sleep(0.5)

    # Launch native OS window
    webview.create_window(
        title="MediaDrop Studio",
        url=f"http://127.0.0.1:{port}",
        width=1280,
        height=850,
        min_size=(900, 600),
        resizable=True,
        text_select=True,
        confirm_close=False,
    )
    
    # Start webview loop (blocks until native window is closed)
    webview.start()

if __name__ == "__main__":
    main()
