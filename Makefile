.PHONY: help build start stop test logs clean backup restore restore-dry-run

help:
	@./ops/run.sh --help

build:
	@./ops/run.sh build

start:
	@./ops/run.sh start

stop:
	@./ops/run.sh stop

test:
	@./ops/run.sh test

logs:
	@./ops/run.sh logs

clean:
	@./ops/run.sh clean

backup:
	@./ops/backup.sh

restore:
	@test -n "$(BACKUP)" || { echo "usage: make restore BACKUP=backups/cases-<timestamp>.json" >&2; exit 2; }
	@./ops/restore.sh "$(BACKUP)"

restore-dry-run:
	@test -n "$(BACKUP)" || { echo "usage: make restore-dry-run BACKUP=backups/cases-<timestamp>.json" >&2; exit 2; }
	@./ops/restore.sh --dry-run "$(BACKUP)"
