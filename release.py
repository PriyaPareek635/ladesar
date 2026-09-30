"""Build the Ladesar site for one release phase into dist/.

    python release.py 1   # Coming Soon       (live Fri 2 Oct 2026)
    python release.py 2   # + Rooms & Dining  (live Mon 12 Oct 2026)
    python release.py 3   # Full site         (live Fri 16 Oct 2026)

Add --preview to build and then open it locally, without publishing:

    python release.py 1 --preview

Upload the contents of dist/ to the web host. Sections for later phases are
removed from the built page entirely, not just hidden, so unreleased content
never appears in the page source.

Contact details come from site.json and are filled into {{placeholders}} in
index.html, so preview the built dist/index.html rather than index.html itself.

Markers in index.html:
    <!--phase:N--> ... <!--/phase:N-->   kept from phase N onwards
    <!--only:N-->  ... <!--/only:N-->    kept in phase N only
"""
import json
import re
import shutil
import socket
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
PHASES = {1: "Coming Soon", 2: "Rooms & Dining", 3: "Full site"}


def load_settings():
    """Read site.json and derive the values the page needs."""
    try:
        raw = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        sys.exit(f"Could not read site.json: {e}")

    problems = []
    for key in ("phone", "whatsapp", "email", "site_url"):
        if not str(raw.get(key, "")).strip():
            problems.append(f'"{key}" is missing')
    if problems:
        sys.exit("site.json: " + "; ".join(problems))

    phone_digits = re.sub(r"\D", "", raw["phone"])
    whatsapp_digits = re.sub(r"\D", "", raw["whatsapp"])
    if not 10 <= len(phone_digits) <= 15:
        problems.append(f'phone "{raw["phone"]}" should be a full number with country code, e.g. +91 98290 12345')
    if not 11 <= len(whatsapp_digits) <= 15:
        problems.append(f'whatsapp "{raw["whatsapp"]}" needs the country code, e.g. +91 98290 12345')
    if not re.fullmatch(r"[^@\s\"<>]+@[^@\s\"<>]+\.[A-Za-z]{2,}", raw["email"].strip()):
        problems.append(f'email "{raw["email"]}" does not look like an email address')
    if not re.fullmatch(r"https?://[^\s\"<>]+", raw["site_url"].strip()):
        problems.append(f'site_url "{raw["site_url"]}" should start with https://')
    if problems:
        sys.exit("site.json: " + "; ".join(problems))

    return {
        "phone": raw["phone"].strip(),
        "phone_link": "+" + phone_digits,
        "whatsapp": whatsapp_digits,
        "email": raw["email"].strip(),
        "site_url": raw["site_url"].strip().rstrip("/"),
    }


def build(phase):
    html = (ROOT / "index.html").read_text(encoding="utf-8")

    def keep_from(m):
        return m.group(2) if phase >= int(m.group(1)) else ""

    def keep_only(m):
        return m.group(2) if phase == int(m.group(1)) else ""

    html = re.sub(r"<!--phase:(\d)-->(.*?)<!--/phase:\1-->", keep_from, html, flags=re.S)
    html = re.sub(r"<!--only:(\d)-->(.*?)<!--/only:\1-->", keep_only, html, flags=re.S)

    # Before reservations open, every "Book" link goes to the register-interest form.
    if phase == 1:
        html = html.replace('href="#book"', 'href="#interest"')

    settings = load_settings()
    html = re.sub(r"\{\{(\w+)\}\}", lambda m: settings.get(m.group(1), m.group(0)), html)
    unknown = sorted(set(re.findall(r"\{\{\w+\}\}", html)))
    if unknown:
        sys.exit(f"index.html uses placeholders that site.json does not provide: {unknown}")

    leftover = re.findall(r"<!--/?(?:phase|only):\d-->", html)
    if leftover:
        sys.exit(f"Unbalanced phase markers in index.html: {leftover}")

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    (DIST / "index.html").write_text(html, encoding="utf-8")
    for folder in ("css", "js", "assets", "images"):
        if (ROOT / folder).exists():
            shutil.copytree(ROOT / folder, DIST / folder)
    print(f"Built phase {phase} ({PHASES[phase]}) into {DIST}")


def preview(port=8000):
    """Serve dist/ on this computer and on the local Wi-Fi, so it can be checked on a phone too."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))  # picks the Wi-Fi address; nothing is sent
            lan_ip = s.getsockname()[0]
    except OSError:
        lan_ip = None
    handler = partial(SimpleHTTPRequestHandler, directory=str(DIST))
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    url = f"http://localhost:{port}/"
    print(f"\nPreview on this computer:  {url}")
    if lan_ip:
        print(f"Preview on a phone (same Wi-Fi):  http://{lan_ip}:{port}/")
    print("Press Ctrl+C to stop.\n")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Preview stopped.")


if __name__ == "__main__":
    args = sys.argv[1:]
    want_preview = "--preview" in args
    args = [a for a in args if a != "--preview"]
    if len(args) != 1 or not args[0].isdigit() or int(args[0]) not in PHASES:
        sys.exit(__doc__)
    build(int(args[0]))
    if want_preview:
        preview()
