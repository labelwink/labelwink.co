/**
 * loadRazorpay.js
 * Dynamically injects the Razorpay checkout script and resolves
 * only when window.Razorpay is ready. Safe to call multiple times
 * (re-uses the already-loaded instance on subsequent calls).
 */
export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    // Already loaded — resolve immediately
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    // Script tag might already be in DOM (e.g. HMR reload)
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    const onLoad = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error("Razorpay SDK loaded but window.Razorpay is undefined."));
      }
    };

    const onError = () =>
      reject(new Error("Failed to load Razorpay SDK. Check your internet connection."));

    if (existing) {
      // Script is in DOM but may still be loading
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onError);
      return;
    }

    // Inject fresh script tag
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = onLoad;
    script.onerror = onError;
    document.body.appendChild(script);
  });
}
