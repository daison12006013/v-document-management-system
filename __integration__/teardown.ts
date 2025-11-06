/**
 * Global teardown for integration tests
 * - Optional: Can clean up test data or stop containers
 */
export async function teardown() {
  console.log('🧹 Integration test teardown complete')
  // Note: We don't stop Docker containers here so they can be reused
  // Containers should be managed by CI/CD or manually
}

