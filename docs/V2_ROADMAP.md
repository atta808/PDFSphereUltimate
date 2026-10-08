# PDFSphere Ultimate V2 Roadmap

V2 is an incremental product evolution on top of the stabilized Expo SDK 55 baseline. Existing PDF viewing, scanning, extraction, OCR and AI engines are preserved unless a concrete defect requires replacement.

## Phase 1 — Document Domain
- Establish DocumentService and FolderService application boundaries.
- Add persistent folders with optional parent folders.
- Support favorites, recents, search, rename and move-to-folder operations.
- Keep SQLite as the local source of truth.

## Phase 2 — Document Workspace UI
- Replace the basic file list with a professional document workspace.
- Add All Documents, Recent, Favorites and folder navigation.
- Add view mode, sorting, filtering and contextual document actions.
- Add consistent loading, empty and error states.

## Phase 3 — Document Actions
Every document should expose a predictable action surface:
- Open
- Rename
- Favorite
- Move
- Share
- Delete
- Information
- Extract Text
- OCR
- Edit
- AI Summary
- AI Chat
- Translate

## Phase 4 — AI Workspace
- Remove dummy file IDs from AI entry points.
- Make every AI feature document-aware.
- Persist conversations and generated artifacts through the existing SQLite cache tables.

## Phase 5 — Reliability & Production
- Add migrations/versioning for SQLite schema changes.
- Add automated TypeScript and Expo validation.
- Test the complete document lifecycle on a real Android device.
- Only then expand synchronization, backup/restore and multi-device features.

## Engineering rule
Code → TypeScript → Expo Doctor → autolinking verification → Metro → real-device test → commit.

V2 changes are intentionally kept small and reviewable. main remains the stable baseline.
