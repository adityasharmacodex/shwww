import json
import os
import posixpath
import secrets
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")
WISHES_DIR = os.path.join(DATA_DIR, "wishes")


class ChatHandler(BaseHTTPRequestHandler):
    def _serve_file(self, relative_path):
        if relative_path == "/" or relative_path.startswith("/wish/"):
            relative_path = "/index.html"

        safe_path = posixpath.normpath(relative_path.lstrip("/"))
        file_path = os.path.abspath(os.path.join(ROOT, safe_path))

        if not file_path.startswith(ROOT):
            self.send_error(403, "Forbidden")
            return

        if not os.path.isfile(file_path):
            self.send_error(404, "Not found")
            return

        ext = os.path.splitext(file_path)[1]
        content_type = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
        }.get(ext, "text/plain; charset=utf-8")

        with open(file_path, "rb") as file:
            data = file.read()

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, payload, status=200):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            raise ValueError("Missing request body")

        raw = self.rfile.read(content_length)
        return json.loads(raw.decode("utf-8"))

    def _wish_path(self, wish_id):
        safe_id = "".join(char for char in wish_id if char.isalnum() or char in "-_")
        return os.path.join(WISHES_DIR, f"{safe_id}.json")

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/wishes/"):
            wish_id = parsed.path.rsplit("/", 1)[-1]
            wish_path = self._wish_path(wish_id)
            if not os.path.isfile(wish_path):
                self._send_json({"error": "Wish not found"}, status=404)
                return

            with open(wish_path, "r", encoding="utf-8") as file:
                payload = json.load(file)

            self._send_json(payload)
            return

        self._serve_file(parsed.path)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/wishes":
            self.send_error(404, "Not found")
            return

        try:
            payload = self._read_json()
        except (ValueError, json.JSONDecodeError):
            self._send_json({"error": "Invalid JSON body"}, status=400)
            return

        name = str(payload.get("name", "")).strip()[:60]
        photos = payload.get("photos", [])

        if not isinstance(photos, list) or len(photos) < 10:
            self._send_json({"error": "At least 10 photos are required"}, status=400)
            return

        photos = [photo for photo in photos[:10] if isinstance(photo, str) and photo.startswith("data:image/")]
        if len(photos) < 10:
            self._send_json({"error": "Photos must be valid image data URLs"}, status=400)
            return

        os.makedirs(WISHES_DIR, exist_ok=True)
        wish_id = secrets.token_urlsafe(6)
        wish_path = self._wish_path(wish_id)
        wish_payload = {"id": wish_id, "name": name, "photos": photos}

        with open(wish_path, "w", encoding="utf-8") as file:
            json.dump(wish_payload, file)

        host = self.headers.get("Host", f"localhost:{PORT}")
        scheme = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"
        share_url = f"{scheme}://{host}/wish/{wish_id}"
        self._send_json({"id": wish_id, "share_url": share_url}, status=201)


if __name__ == "__main__":
    os.makedirs(WISHES_DIR, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), ChatHandler)
    print(f"Birthday Wish website running on http://localhost:{PORT}")
    print("Same Wi-Fi par use karne ke liye apne computer ka local IP use karo, jaise http://192.168.x.x:8000")
    server.serve_forever()
