# Multipart Upload Implementation

This document outlines the multipart upload feature implementation for the Binx frontend application.

## Features Implemented

### 1. **Automatic Multipart Upload for Large Files**
- Files larger than 20MB automatically use multipart upload
- Configurable threshold in `utils/multipart-upload.ts`
- Files smaller than 20MB continue to use the existing single-part upload

### 2. **Pause and Resume Functionality**
- Users can pause multipart uploads in progress
- Paused uploads can be resumed later
- Upload progress is preserved during pause/resume cycles
- Visual indicators show paused state

### 3. **Incomplete Uploads Management**
- All incomplete multipart uploads are stored in browser localStorage
- "Incomplete Uploads" button in vault header opens management dialog
- Dialog shows all incomplete uploads with:
  - File name and size
  - Upload progress (chunks completed)
  - Time since last activity
  - Status (pending, uploading, paused, failed)
  - Retry and Abort buttons for each upload

### 4. **Reliable Upload Progress**
- Accurate progress tracking for both regular and multipart uploads
- Progress calculated based on completed chunks for multipart uploads
- Real-time progress updates during chunk uploads
- Cross-device compatibility ensured through proper progress calculation

### 5. **Local Storage Integration**
- Upload state persistence across browser sessions
- File metadata stored for retry functionality
- Automatic cleanup of completed uploads
- Error state preservation for troubleshooting

## Technical Implementation

### Key Components

#### 1. **MultipartUpload Utilities** (`utils/multipart-upload.ts`)
- **Constants**: `MULTIPART_THRESHOLD` (20MB), `DEFAULT_CHUNK_SIZE` (5MB)
- **File Chunking**: `createChunks()` splits files into uploadable chunks
- **Storage Management**: Functions for localStorage persistence
- **API Integration**: Functions for multipart upload API calls
- **Progress Calculation**: Accurate progress tracking utilities

#### 2. **Enhanced Upload Hook** (`hooks/use-file-upload.ts`)
- **Hybrid Upload Logic**: Automatically chooses between single-part and multipart
- **State Management**: Handles upload queue, progress, and control states
- **Pause/Resume**: Upload control functions with proper state management
- **Retry Logic**: Handles incomplete upload continuation
- **Error Handling**: Comprehensive error states and recovery

#### 3. **Enhanced Upload Progress** (`components/vault/upload-progress.tsx`)
- **Pause/Resume Controls**: Interactive buttons for multipart uploads
- **Status Indicators**: Visual feedback for all upload states including paused
- **Progress Bars**: Accurate progress display for all upload types
- **Minimal UX**: Clean, uncluttered interface


### Configuration

Key configuration values in `utils/multipart-upload.ts`:

```typescript
export const MULTIPART_THRESHOLD = 20 * 1024 * 1024 // 20MB
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024   // 5MB
export const STORAGE_KEY = "binx_incomplete_uploads"
```

## Usage

### For Users
1. **Large File Upload**: Simply select files > 20MB - multipart upload happens automatically
2. **Pause Upload**: Click pause button in detailed upload progress view
3. **Resume Upload**: Click resume button for paused uploads
4. **Clean Up**: Use abort button to remove incomplete uploads

### For Developers
1. **Threshold Adjustment**: Modify `MULTIPART_THRESHOLD` constant
2. **Chunk Size Tuning**: Adjust `DEFAULT_CHUNK_SIZE` for optimal performance
3. **API Integration**: Update endpoint URLs in utility functions
4. **Custom Progress**: Extend progress calculation logic if needed
5. **Error Handling**: Customize error messages and recovery logic

## Testing

The implementation includes test utilities in `utils/test-multipart-upload.ts` to validate:
- File size threshold logic
- Chunk creation and sizing
- Progress calculation accuracy
- Configuration constants

## Browser Compatibility

- **Local Storage**: Used for persistence (supported in all modern browsers)
- **File API**: Used for file chunking (supported in all modern browsers)  
- **XMLHttpRequest**: Used for chunk uploads with progress tracking
- **Blob API**: Used for file chunk manipulation

## Performance Optimization

- **Sequential Upload**: Chunks uploaded one at a time to prevent overwhelming
- **Progress Batching**: Progress updates batched to prevent UI thrashing
- **Memory Management**: Chunks created on-demand, not stored in memory
- **Storage Cleanup**: Completed uploads automatically removed from localStorage
- **Retry Logic**: Failed chunks can be retried without restarting entire upload
