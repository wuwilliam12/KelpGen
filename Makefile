APP_DIR := kelpgen
NPM := npm --prefix "$(APP_DIR)"

.PHONY: help install dev build preview typecheck clean

help:
	@echo "Available targets:"
	@echo "  make install    Install project dependencies"
	@echo "  make dev        Start the Vite dev server"
	@echo "  make build      Create a production build"
	@echo "  make preview    Preview the production build"
	@echo "  make typecheck  Run TypeScript type-checking"
	@echo "  make clean      Remove the build output"

install:
	$(NPM) ci

dev:
	$(NPM) run dev

build:
	$(NPM) run build

preview:
	$(NPM) run preview

typecheck:
	npx --prefix "$(APP_DIR)" tsc --noEmit --project "$(APP_DIR)/tsconfig.json"

clean:
	powershell -NoProfile -Command "Remove-Item -Recurse -Force '$(APP_DIR)/dist' -ErrorAction SilentlyContinue"
