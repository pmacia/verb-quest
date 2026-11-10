# Home HTTPS Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Serve the built PWA on a household LAN with Node HTTPS and user-provided trusted certificates.

**Architecture:** Dependency-free ESM CLI, built-in https/fs/path modules, static dist root and extensionless SPA fallback. Certificates stay outside dist and Git. Trust setup remains an explicit manual task; no CA installation, firewall/router modification or public deployment.

**Tech Stack:** Node24, node:test, OpenSSL temporary test certificate, existing Vite/PWA build.

- [x] Write failing Node integration tests for real verified TLS, SPA fallback, static MIME/HEAD/cache, missing assets, traversal/symlink/dotfile isolation and method handling.
- [x] Implement scripts/serve-https.mjs, npm serve:https/test:https scripts and ignored .certs directory. Configurable port/host/root/cert/key; useful startup errors/help and LAN URLs.
- [x] Document mkcert generation for actual LAN IP/name, explicit device trust/root certificate, stable origins, running/build/update and local-data transfer. Do not install CA or alter trust automatically.
- [x] Run integration tests, current typecheck/build and real dist smoke test over verified TLS; fresh review; update README; commit/push.

## Verification

- Four Node integration tests pass with actual TLS verification using a temporary certificate supplied only to the client; system trust unchanged.
- Build/typecheck pass. CLI smoke test against actual dist verified SPA route, JS, manifest, service worker and source-file isolation over HTTPS; temporary process/certificates removed afterward.
- Fresh review found no actionable issues and independently ran all4 tests.
- Missing assets stay404, hidden paths and symlinks outside root (including aliases to hidden files) are not served, shell/worker revalidate and hashed assets cache.
- No extra dependencies, no CA installation/firewall/router modifications. Household device trust and PWA install remain user setup steps documented in the guide.
