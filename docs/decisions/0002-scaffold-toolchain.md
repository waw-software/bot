---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv (product owner)
scope: stack
summary: "In the context of scaffolding the stack of ADR-0001, facing build tooling and an ORM that are costly to change once code depends on them, we decided on one Expo app for iOS and the web, an Electron shell serving its web export, a Fastify and TypeBox server, Biome, strict TypeScript, Vitest and Jest in a pnpm workspace, and Drizzle as the ORM, and rejected a bare React Native CLI app with a separate web build, Express or Hono, ESLint with Prettier, and Prisma, to achieve one client codebase and one API contract, accepting that Expo SDK upgrades pace React Native."
supersedes: []
---

# Scaffold toolchain and workspace layout

## Context and Problem Statement

[ADR-0001](0001-typescript-monorepo-stack.md) chose a TypeScript pnpm monorepo with React Native,
Electron, a Node server and Postgres. It left the exact versions, the ORM, the test runners, the
linter and the formatter to Milestone 1. Which tools and workspace layout does the scaffold build
on?

## Considered Options

* The WAW Notes toolchain set: Expo, an Electron shell, Fastify with TypeBox, Biome, with Drizzle
  as the ORM
* A bare React Native CLI app with a separate Vite or webpack web build
* Express or Hono instead of Fastify
* ESLint with Prettier instead of Biome
* Prisma instead of Drizzle

## Decision Outcome

Chosen option: "The WAW Notes toolchain set: Expo, an Electron shell, Fastify with TypeBox, Biome,
with Drizzle as the ORM", because it keeps one client codebase and one API contract, with the same
tools as WAW Notes and WAW Tasks.

* Toolchain: Node 24.21.0 ([`.nvmrc`](../../.nvmrc), also the minimum engine), pnpm 12.21.0,
  TypeScript 5.9.3 in strict mode ([`tsconfig.base.json`](../../tsconfig.base.json)) and Biome
  2.6.8 for format and lint ([`biome.json`](../../biome.json)).
* Tests: Vitest 5.1.1; the client uses Jest 30.5.2 with `jest-expo` ~58.0.15, Expo's Jest preset.
* [`apps/waw-bot-client`](../../apps/waw-bot-client/package.json) is one app for iOS and the web:
  Expo ~58.0.26, React Native 0.88.1 and React Native Web 0.21.4.
* [`apps/waw-bot-desktop`](../../apps/waw-bot-desktop/package.json) is the Electron main process
  (Electron 44.11.5, electron-vite 6.0.0). It serves the client's web export from its own bundle
  over `waw-bot://app/`, because the export's root-relative asset URLs break under `file://`.
* [`apps/waw-bot-server`](../../apps/waw-bot-server/package.json) holds the API and Worker entry
  points and uses Fastify 5.12.8 with TypeBox 1.4.7.
* [`packages/api-contract`](../../packages/api-contract/package.json) holds the API schemas and
  types; [`packages/core`](../../packages/core/package.json) holds code shared by the clients and
  the server.
* Drizzle is the ORM. It is added in Milestone 4, together with Postgres.

Rejected: a bare React Native CLI app with a separate web build, because the web would be a second
app setup to maintain; Express or Hono, because Fastify with TypeBox binds the shared schema to a
route and tests it in process; ESLint with Prettier, because they are two tools for what Biome
does alone; Prisma, because it would leave the WAW toolchain set, which uses Drizzle.

### Consequences

* Good, because WAW Bot shares one toolchain with WAW Notes and WAW Tasks
* Good, because the iOS and desktop clients come from one client codebase
* Bad, because Expo SDK upgrades pace React Native upgrades
* Bad, because iOS runs through Expo Go until a native build is needed

### Confirmation

[`scripts/check.sh`](../../scripts/check.sh) runs format, lint, types and unit tests.
