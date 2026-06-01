import json
import os
import subprocess
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]


def _install_fake_curl(tmp_path: Path) -> tuple[Path, Path]:
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log_file = tmp_path / "curl.log"
    fake_curl = bin_dir / "curl"
    fake_curl.write_text(
        """#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$CURL_LOG"
if [[ "$*" == *"--data-binary @-"* ]]; then
  cat >/dev/null
else
  printf '{"cases":[]}\\n'
fi
""",
        encoding="utf-8",
    )
    fake_curl.chmod(0o755)
    return bin_dir, log_file


def test_backup_uses_default_curl_timeouts(tmp_path: Path) -> None:
    bin_dir, log_file = _install_fake_curl(tmp_path)
    backup_dir = tmp_path / "backups"
    env = {
        **os.environ,
        "BACKUP_DIR": str(backup_dir),
        "CURL_LOG": str(log_file),
        "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}",
    }

    result = subprocess.run(
        ["bash", "ops/backup.sh"],
        cwd=ROOT_DIR,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )

    backup_file = Path(result.stdout.strip())
    curl_args = log_file.read_text(encoding="utf-8")

    assert backup_file.exists()
    assert "--connect-timeout 10" in curl_args
    assert "--max-time 60" in curl_args


def test_restore_uses_default_curl_timeouts(tmp_path: Path) -> None:
    bin_dir, log_file = _install_fake_curl(tmp_path)
    backup_file = tmp_path / "backup.json"
    backup_file.write_text(json.dumps({"cases": [{"case_id": "PV-1"}]}), encoding="utf-8")
    env = {
        **os.environ,
        "CURL_LOG": str(log_file),
        "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}",
    }

    subprocess.run(
        ["bash", "ops/restore.sh", str(backup_file)],
        cwd=ROOT_DIR,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )

    curl_args = log_file.read_text(encoding="utf-8")

    assert "--connect-timeout 10" in curl_args
    assert "--max-time 60" in curl_args
    assert "-X POST" in curl_args
