import '@testing-library/jest-dom';

class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

(global as any).ResizeObserver = (global as any).ResizeObserver || ResizeObserver;
