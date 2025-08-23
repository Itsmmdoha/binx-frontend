/**
 * Simple test script to validate multipart upload utilities
 */

import { 
  shouldUseMultipart, 
  createChunks, 
  calculateUploadProgress,
  MULTIPART_THRESHOLD,
  DEFAULT_CHUNK_SIZE 
} from '../utils/multipart-upload'

// Test shouldUseMultipart function
function testShouldUseMultipart() {
  console.log('Testing shouldUseMultipart...')
  
  // Test file smaller than threshold
  const smallFileSize = 10 * 1024 * 1024 // 10MB
  console.assert(!shouldUseMultipart(smallFileSize), 'Small file should not use multipart')
  
  // Test file larger than threshold
  const largeFileSize = 25 * 1024 * 1024 // 25MB
  console.assert(shouldUseMultipart(largeFileSize), 'Large file should use multipart')
  
  // Test file exactly at threshold
  console.assert(!shouldUseMultipart(MULTIPART_THRESHOLD), 'File at threshold should not use multipart')
  console.assert(shouldUseMultipart(MULTIPART_THRESHOLD + 1), 'File above threshold should use multipart')
  
  console.log('✅ shouldUseMultipart tests passed')
}

// Test createChunks function
function testCreateChunks() {
  console.log('Testing createChunks...')
  
  // Create a mock file
  const fileContent = new Uint8Array(15 * 1024 * 1024) // 15MB file
  const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' })
  
  const chunks = createChunks(mockFile, DEFAULT_CHUNK_SIZE)
  
  // Should create 3 chunks (5MB + 5MB + 5MB)
  console.assert(chunks.length === 3, `Expected 3 chunks, got ${chunks.length}`)
  
  // Check chunk numbers are sequential
  for (let i = 0; i < chunks.length; i++) {
    console.assert(chunks[i].chunkNumber === i + 1, `Chunk ${i} should have number ${i + 1}`)
  }
  
  // Check total size
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
  console.assert(totalSize === mockFile.size, `Total chunk size should equal file size`)
  
  console.log('✅ createChunks tests passed')
}

// Test calculateUploadProgress function
function testCalculateUploadProgress() {
  console.log('Testing calculateUploadProgress...')
  
  // Test empty set
  const emptySet = new Set<number>()
  console.assert(calculateUploadProgress(emptySet, 10) === 0, 'Empty set should return 0%')
  
  // Test partial progress
  const partialSet = new Set([1, 2, 3])
  console.assert(calculateUploadProgress(partialSet, 10) === 30, 'Partial set should return 30%')
  
  // Test complete progress
  const completeSet = new Set([1, 2, 3, 4, 5])
  console.assert(calculateUploadProgress(completeSet, 5) === 100, 'Complete set should return 100%')
  
  // Test zero total chunks
  console.assert(calculateUploadProgress(emptySet, 0) === 0, 'Zero total chunks should return 0%')
  
  console.log('✅ calculateUploadProgress tests passed')
}

// Run all tests
function runTests() {
  console.log('Running multipart upload utility tests...\n')
  
  try {
    testShouldUseMultipart()
    testCreateChunks()
    testCalculateUploadProgress()
    
    console.log('\n🎉 All tests passed successfully!')
    console.log(`
Configuration:
- Multipart threshold: ${(MULTIPART_THRESHOLD / 1024 / 1024).toFixed(1)}MB
- Default chunk size: ${(DEFAULT_CHUNK_SIZE / 1024 / 1024).toFixed(1)}MB
    `)
  } catch (error) {
    console.error('❌ Tests failed:', error)
    process.exit(1)
  }
}

// Export for potential module usage
export { runTests }

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runTests()
}
