#!/usr/bin/env python3
"""
PreToolUse hook: git commit 前に index.html のバージョンを自動インクリメントする。
例: v2.0 → v2.1
"""
import sys, json, re, subprocess, os

try:
    data = json.load(sys.stdin)
    cmd = data.get('command', '')
    if 'git commit' not in cmd:
        sys.exit(0)

    idx = os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
    idx = os.path.abspath(idx)

    if not os.path.exists(idx):
        sys.exit(0)

    with open(idx, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r'(class="app-version">v)(\d+)\.(\d+)(<)', content)
    if not m:
        sys.exit(0)

    major, minor = int(m.group(2)), int(m.group(3))
    old_ver = f'v{major}.{minor}'
    new_ver = f'v{major}.{minor + 1}'

    new_content = content.replace(
        f'class="app-version">{old_ver}<',
        f'class="app-version">{new_ver}<'
    )

    with open(idx, 'w', encoding='utf-8') as f:
        f.write(new_content)

    project_dir = os.path.dirname(idx)
    subprocess.run(['git', '-C', project_dir, 'add', idx], check=False)

    print(f'[bump-version] {old_ver} → {new_ver}', file=sys.stderr)

except Exception:
    pass  # コミットをブロックしない
