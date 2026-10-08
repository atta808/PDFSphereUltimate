# PDFSphere Ultimate V2 Architecture

## Source of truth
The local SQLite database remains the source of truth for the document workspace. Existing PDF and AI engines consume document IDs and local URIs rather than owning document state themselves.

## Layers

### UI
React Native screens and navigation. UI components should not contain SQL.

### Application services
DocumentService and FolderService provide the use-case boundary for document operations. This keeps screens independent from the persistence implementation.

### Repository
FileRepository owns SQLite access and maps database rows to domain models.

### Storage
SQLite database pdfsphere.db stores documents, folders, extracted text and AI artifacts.

## Domain objects
- FileModel — existing document representation.
- FolderModel — persistent folder representation with optional nesting.

## V2 folder rules
- Folder IDs are stable strings.
- parentId = null means a root-level folder.
- Deleting a folder does not delete documents; documents are moved to the root.
- Folder names are normalized by the application service.

## Compatibility
The V2 domain layer is additive. Existing scanner, viewer, extraction and AI code can continue using fileRepository while screens migrate gradually to the service boundary.
