import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window and all scrollable layout containers to top whenever the route changes.
 * Must be rendered inside <BrowserRouter>.
 */
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If there is a hash (e.g., #section-id), scroll to that element
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // Scroll main window to top
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

    // Scroll any inner layout scroll containers to top
    const scrollableElements = document.querySelectorAll(
      "main, .overflow-y-auto, .overflow-auto, [data-radix-scroll-area-viewport]"
    );
    scrollableElements.forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;