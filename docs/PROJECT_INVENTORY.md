# Project Inventory
## PDFSphere Ultimate

This document catalogs the current structural inventory of the PDFSphere Ultimate application after the Expo SDK 55 migration.

### Application Architecture
The app follows a Clean Architecture approach separating UI concerns from business logic and local persistence layers.

#### Key Directories
1. **`src/business/useCases/`**: Encapsulates specific domain workflows (e.g., GenerateFlashcardsUseCase, TranslateDocumentUseCase).
2. **`src/components/`**: Reusable generic UI elements (e.g., `SkeletonLoader`, `Button`, `Modal`).
3. **`src/constants/`**: App-wide constants (e.g., `routes.ts`, typography, theme metrics).
4. **`src/navigation/`**: React Navigation `v7` stacks. Tab navigators and deeply nested flows.
5. **`src/repository/`**: SQLite 55 compliant persistence bindings for user-settings, files, extracted text, metadata, and embeddings.
6. **`src/screens/`**: Primary routed components representing distinct views (e.g., `HomeScreen`, `PDFViewerScreen`, `ScannerScreen`, `SettingsScreen`, `ChatScreen`).
7. **`src/services/`**: Feature-specific internal libraries handling API interactions and local integrations (AI providers, chat/retrieval, OCR extraction, text chunking).
8. **`src/theme/`**: Theming engine context configurations and style primitives.
9. **`src/utils/`**: Helper methodologies (`logger.ts`, `uuid.ts`, generic formatters).

#### Important Migration Scripts (Generated)
- `fix_all.js`
- `fix_nav_ids.js`
- `fix_scanner_final.js`
- `fix_editor_screen.js`

#### Package Ecosystem
- `@react-navigation/*` (v7)
- `expo` (SDK 55)
- `expo-file-system` (SDK 55 compliant)
- `expo-sqlite` (SDK 55 `getAllAsync` usage)
- `react-native-vision-camera` (v4 Hook usage)
- `@kishannareshpal/expo-pdf`
- `react-native-document-scanner-ai`
