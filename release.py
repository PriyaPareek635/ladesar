"""Build the Ladesar site for one release phase into dist/.

    python release.py 1   # Coming Soon       (live Fri 2 Oct 2026)
    python release.py 2   # + Rooms & Dining  (live Mon 12 Oct 2026)
    python release.py 3   # Full site         (live Fri 16 Oct 2026)

Upload the contents of dist/ to the web host. Sections for later phases are
removed from the built page entirely, not just hidden, so unreleased content
never appears in the page source.

Markers in index.html:
    <!--phase:N--> ... <!--/phase:N-->   kept from phase N onwards
    <!--only:N-->  ... <!--/only:N-->    kept in phase N only
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
PHASES = {1: "Coming Soon", 2: "Rooms & Dining", 3: "Full site"}


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


if __name__ == "__main__":
    if len(sys.argv) != 2 or not sys.argv[1].isdigit() or int(sys.argv[1]) not in PHASES:
        sys.exit(__doc__)
    build(int(sys.argv[1]))
