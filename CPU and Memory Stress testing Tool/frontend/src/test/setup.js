import '@testing-library/jest-dom';

// Mock ResizeObserver for Recharts in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock WebSocket for jsdom
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 10);
  }
  send(data) {}
  close() {
    if (this.onclose) this.onclose();
  }
};
