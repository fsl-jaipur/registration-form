type Listener = () => void;

let pendingRequestCount = 0;
let isTrackerInitialized = false;
const listeners = new Set<Listener>();

const notifyListeners = () => {
  for (const listener of listeners) {
    listener();
  }
};

const incrementPending = () => {
  pendingRequestCount += 1;
  notifyListeners();
};

const decrementPending = () => {
  pendingRequestCount = Math.max(0, pendingRequestCount - 1);
  notifyListeners();
};

export const getPendingRequestCount = () => pendingRequestCount;

export const subscribeToNetworkActivity = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setupGlobalNetworkActivityTracker = () => {
  if (isTrackerInitialized || typeof window === "undefined") {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    incrementPending();
    try {
      return await originalFetch(...args);
    } finally {
      decrementPending();
    }
  };

  isTrackerInitialized = true;
};
