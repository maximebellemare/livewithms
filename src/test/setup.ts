import { expect } from "vitest";

expect.extend({
  toBeInTheDocument(received: unknown) {
    const pass = received instanceof Node && Boolean(received.ownerDocument?.contains(received));

    return {
      pass,
      message: () =>
        pass
          ? "Expected element not to be present in the document."
          : "Expected element to be present in the document.",
    };
  },
  toHaveAttribute(received: unknown, attribute: string, expectedValue?: string) {
    const element = received instanceof Element ? received : null;
    const actualValue = element?.getAttribute(attribute) ?? null;
    const pass =
      Boolean(element) &&
      (typeof expectedValue === "undefined" ? element.hasAttribute(attribute) : actualValue === expectedValue);

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have attribute ${attribute}.`
          : `Expected element to have attribute ${attribute}${typeof expectedValue === "undefined" ? "" : `="${expectedValue}"`}.`,
    };
  },
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
