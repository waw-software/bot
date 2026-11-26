---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv (product owner)
scope: stack
summary: "In the context of a self-hosted server with iOS and desktop clients, facing the choice of languages, frameworks and storage, we decided on a TypeScript pnpm monorepo with React Native, Electron, Node and Postgres and rejected a Swift app with a separate desktop client, a web UI in Electron next to React Native, and a Go or Python server, to achieve one client codebase and one language, accepting a less common desktop setup."
supersedes: []
---

# Stack: TypeScript pnpm monorepo with React Native, Electron, Node and Postgres

## Context and Problem Statement

WAW Bot needs two clients, for iOS and for the desktop, and a server that the user hosts. The
clients and the server share request and response types. Which languages, frameworks, repository
layout, storage and packaging does the project use? See [the spec](../SPEC.md) and
[the requirements](../requirements.md).

## Considered Options

* A pnpm monorepo: React Native for iOS, the same client with React Native Web in Electron, a
  Node and TypeScript server, and Postgres
* A native iOS app in Swift and a separate desktop client
* One web UI wrapped in Electron for the desktop, and React Native for iOS
* A server in another language (Go or Python) with the same clients

## Decision Outcome

Chosen option: "A pnpm monorepo: React Native for iOS, the same client with React Native Web in
Electron, a Node and TypeScript server, and Postgres", because iOS and the desktop share one
client codebase, one language covers the client, the server and the contract package, and
Postgres as the job queue keeps the self-hosted install to two services. The owner accepted the
proposed stack on 26 Nov 2026. The alternatives were not discussed with the owner; they were
weighed when this decision was recorded, against the forces in the spec. The layout and
packaging are in [the spec, section 3](../SPEC.md#3-architecture). Exact versions, the ORM, the
test runner, the linter and the formatter are not decided here; they are chosen in Milestone 1.

Rejected in that analysis: Swift with a separate desktop client, because the two clients would
not share one codebase; a web UI in Electron next to React Native, because it also means two
client codebases; a Go or Python server, because the server would not share one language with
the clients and the contract package.

### Consequences

* Good, because iOS and the desktop share one client codebase
* Good, because one language covers the client, the server and the contract package
* Good, because the self-hosted install is two services, the server and Postgres
* Bad, because React Native Web inside Electron is less common than a DOM web app
* Bad, because desktop-only native features such as the global shortcut and the tray need
  Electron main-process code

### Confirmation

Not checked yet: Milestone 1 ([roadmap](../roadmap.md)) scaffolds this layout with the stack's
generators and adds the manifests, lockfile and toolchain files as gate paths in
`.claude/path-classes`.
