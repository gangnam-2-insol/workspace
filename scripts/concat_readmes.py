#!/usr/bin/env python3
"""
Concatenate all README-like markdown files into a single UTF-8 (with BOM) file.
Usage:
  python scripts/concat_readmes.py --root . --output COMBINED_README_UTF8.md
"""
import argparse
import os
from pathlib import Path
from typing import List


def find_readmes(root: Path) -> List[Path]:
    candidates: List[Path] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for name in filenames:
            lower = name.lower()
            if lower.endswith('.md') and 'readme' in lower:
                candidates.append(Path(dirpath) / name)
    candidates.sort(key=lambda p: str(p.relative_to(root)).lower())
    return candidates


essay_header = (
    "# Combined README\n\n"
    "본 문서는 저장소 내 모든 README 관련 문서를 한 파일로 통합한 것입니다. "
    "각 섹션의 제목에 원본 파일 경로를 명시했습니다.\n"
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=str, default='.')
    parser.add_argument('--output', type=str, default='COMBINED_README_UTF8.md')
    args = parser.parse_args()

    root = Path(args.root).resolve()
    out_path = root / args.output

    files = find_readmes(root)

    # Write UTF-8 with BOM to maximize compatibility on Windows viewers
    with open(out_path, 'w', encoding='utf-8-sig', newline='\n') as fw:
        fw.write(essay_header)
        for fp in files:
            rel = fp.relative_to(root).as_posix()
            fw.write(f"\n---\n## [{rel}]\n")
            # Read as UTF-8 (common in repos). If decoding errors, replace to avoid crashes.
            with open(fp, 'r', encoding='utf-8', errors='replace') as fr:
                fw.write(fr.read())

    print(f"Combined README created: {out_path}")


if __name__ == '__main__':
    main()
