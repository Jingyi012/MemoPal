"""Compress only known runtime illustrations; preserve dimensions and exact alpha.
Run: uv run --no-project --with pillow python apps/mobile/scripts/optimize-runtime-images.py --backup-dir <outside-repo-dir>
Native app icons, launch images and editable art sources intentionally stay PNG.
"""

import argparse
import json
import re
import shutil
from pathlib import Path
from PIL import Image, ImageChops

parser = argparse.ArgumentParser()
parser.add_argument("--backup-dir", type=Path, required=True)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
backup = args.backup_dir.resolve()
if backup.is_relative_to(project.parents[1]):
    raise SystemExit("Keep original artwork backups outside the repository.")
backup.mkdir(parents=True, exist_ok=True)
candidates = sorted((project / "assets/images/momo-levels").glob("*.png")) + sorted(
    (project / "assets/images/leaderboard").glob("*.png")
)
candidates += [
    project / "assets/images/momo-reef-background.png",
    project / "assets/palaces/11-study-room.png",
]
changes = {}
report = []
for source in candidates:
    if not source.exists():
        continue
    if not source.resolve().is_relative_to(project / "assets"):
        raise SystemExit("Unexpected asset path")
    target = source.with_suffix(".webp")
    if target.exists():
        raise SystemExit(f"Refusing to overwrite {target}")
    relative = source.relative_to(project)
    original = backup / relative
    original.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        shutil.copy2(source, original)
    with Image.open(source) as image:
        rgba = image.convert("RGBA")
        rgba.save(target, "WEBP", quality=90, method=6, exact=True)
        with Image.open(target) as result:
            if (
                result.size != rgba.size
                or ImageChops.difference(
                    result.convert("RGBA").getchannel("A"), rgba.getchannel("A")
                ).getbbox()
                is not None
            ):
                target.unlink()
                raise SystemExit(f"Dimensions or transparency changed: {relative}")
    before, after = source.stat().st_size, target.stat().st_size
    if after >= before:
        target.unlink()
        continue
    changes[source.resolve()] = target.resolve()
    report.append(
        {"path": str(relative).replace("\\", "/"), "before": before, "after": after}
    )
# Change only literal local require paths, never server URLs containing the same filename.
pattern = re.compile(r"require\(\s*(['\"])([^'\"]+)\1\s*\)")
for file in (project / "src").rglob("*"):
    if file.suffix not in {".ts", ".tsx", ".js", ".jsx"}:
        continue
    text = file.read_text(encoding="utf-8")

    def replace(match):
        old = match.group(2)
        if not old.startswith("."):
            return match.group(0)
        resolved = (file.parent / old).resolve()
        if resolved not in changes:
            return match.group(0)
        return match.group(0).replace(
            old, str(Path(old).with_suffix(".webp")).replace("\\", "/")
        )

    updated = pattern.sub(replace, text)
    if updated != text:
        file.write_text(updated, encoding="utf-8")
for source in changes:
    source.unlink()
if report:
    (backup / "compression-report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
print(
    json.dumps(
        {
            "converted": len(report),
            "beforeBytes": sum(row["before"] for row in report),
            "afterBytes": sum(row["after"] for row in report),
            "backup": str(backup),
        },
        indent=2,
    )
)
