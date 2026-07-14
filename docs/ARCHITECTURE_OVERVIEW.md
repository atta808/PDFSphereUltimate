# Architecture Overview
## PDFSphere Ultimate

### Philosophy
PDFSphere Ultimate operates on an offline-first architecture utilizing `expo-sqlite` as its primary persistence engine. AI integration (via DeepSeek or Claude) relies on secure API key storage using `expo-secure-store`. The codebase heavily leverages TypeScript to ensure strong typing across data models, business logic operations, and navigational routing.

### UI Layer
- React Native components styled using a custom `ThemeContext`.
- Global UI constants defined in `globalStyles.ts`.
- Components load states handled gracefully with custom `SkeletonLoader` built to support `react-native`'s `DimensionValue`.

### Navigation Layer
Built around `React Navigation v7`.
The `RootNavigator` switches between the initial load sequence and the authenticated `MainTabs`. Secondary operations (scanning, editing, PDF viewing) run in distinct Stacks to maintain deep linking semantics and prevent memory bloat.

### Services & Data Flow
1. **Document Loading**: `expo-document-picker` grabs external files.
2. **Text Extraction**: Handled by `DigitalTextExtractor` (native PDFs) or `OCREngine` (scanned PDFs via `expo-text-extractor`).
3. **Chunking & Indexing**: Text is fed through `ChunkingService` and embedded via `SearchService` (TF-IDF local implementation) to allow RAG indexing.
4. **Chat & Intelligence**: `RetrievalService` finds top-k text blocks which are sent to the initialized `AIProvider` (via `AIProviderFactory`) enabling the RAG loop.
5. **Persistence**: `FileRepository` tracks all user assets and extracted AI outcomes natively.

### Error Handling & Reliability
Most edge cases are intercepted directly in `useCases` with appropriate user-facing notifications returned to the view. `utils/logger.ts` manages all runtime logging.

### Expo SDK 55 Specific Constraints
- The `expo-sqlite` driver now runs synchronously via `*Async` hooks (like `getAllAsync()`). `execAsync` has been completely stripped.
- The permissions model natively requests using React hooks (e.g., `useCameraPermission`) preventing older promise-chaining request models from blocking UI rendering.
