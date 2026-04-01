// Global test setup
// Add any global matchers or mocks here

// Suppress console.error in tests unless explicitly testing logging
const originalError = console.error;
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation((...args) => {
    // Re-throw if it looks like an actual test failure
    const msg = String(args[0]);
    if (msg.includes("Warning:") || msg.includes("act(")) {
      originalError(...args);
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
