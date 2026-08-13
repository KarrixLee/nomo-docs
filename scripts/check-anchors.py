#!/usr/bin/env python3
"""Verify every internal link's #fragment resolves to a real heading.

`mint broken-links` only checks page paths — it accepts any fragment, including
one that exists nowhere. Translated headings change slugs, so a link that works
in English can break in exactly one locale and nothing catches it.

Run from the docs repo root:   python3 scripts/check-anchors.py
"""
import re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# github-slugger: lowercase, drop everything that isn't a letter, number, mark,
# connector punctuation, hyphen or space, then spaces become hyphens.
KEEP = {"L", "N", "M", "Pc"}


def slug(text):
    text = re.sub(r"`([^`]*)`", r"\1", text)          # inline code
    text = re.sub(r"\*\*?([^*]*)\*\*?", r"\1", text)  # bold / italic
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)  # links
    text = text.strip().lower()
    out = "".join(
        c for c in text
        if unicodedata.category(c)[0] in {"L", "N", "M"}
        or unicodedata.category(c) == "Pc"
        or c in "- "
    )
    return out.replace(" ", "-")


def page_anchors(path):
    """Every anchor a page exposes: slugged headings, plus explicit {#id}."""
    anchors, in_code = set(), False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.lstrip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        m = re.match(r"^(#{2,6})\s+(.*)$", line)
        if not m:
            continue
        heading = m.group(2).strip()
        explicit = re.search(r"\{#([^}]+)\}", heading)
        # An explicit {#id} REPLACES the slugged heading text — it does not add
        # to it. Accepting both would let a link to the old translated slug keep
        # passing after a heading was pinned to an English one.
        anchors.add(explicit.group(1) if explicit else slug(heading))
    return anchors


pages, problems = {}, []
for mdx in ROOT.rglob("*.mdx"):
    if "node_modules" in mdx.parts:
        continue
    key = "/" + str(mdx.relative_to(ROOT)).removesuffix(".mdx")
    pages[key] = page_anchors(mdx)

LINK = re.compile(r"\]\((/[^)\s#]*)#([^)\s]+)\)|href=\"(/[^\"#]*)#([^\"]+)\"")

for mdx in ROOT.rglob("*.mdx"):
    if "node_modules" in mdx.parts:
        continue
    src = "/" + str(mdx.relative_to(ROOT)).removesuffix(".mdx")
    text = mdx.read_text(encoding="utf-8")
    for lineno, line in enumerate(text.splitlines(), 1):
        for m in LINK.finditer(line):
            target = m.group(1) or m.group(3)
            frag = m.group(2) or m.group(4)
            target = target or src  # same-page link
            if target not in pages:
                problems.append(f"{src}:{lineno}  page not found: {target}")
            elif frag not in pages[target]:
                near = ", ".join(sorted(pages[target])[:3])
                problems.append(f"{src}:{lineno}  {target}#{frag}  (has: {near}…)")

total = sum(len(v) for v in pages.values())
if problems:
    print(f"{len(problems)} unresolved anchor(s) across {len(pages)} pages:\n")
    print("\n".join("  " + p for p in problems))
    sys.exit(1)
print(f"All anchors resolve. {len(pages)} pages, {total} headings.")
