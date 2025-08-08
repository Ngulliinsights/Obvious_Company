/**
 * Jest Setup File
 * Runs before each test file
 */

// Mock DOM APIs that might not be available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      status: 200,
    })
  );
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods in tests (optional)
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    // Uncomment to suppress console.log in tests
    // log: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
  };
}

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock events
  createMockEvent: (type, properties = {}) => {
    const event = new Event(type);
    Object.assign(event, properties);
    return event;
  },
  
  // Helper to create mock elements
  createElement: (tag, attributes = {}, textContent = '') => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  }
};

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});