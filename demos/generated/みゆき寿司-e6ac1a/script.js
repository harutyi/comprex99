const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const showVisibleItem = (item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      item.classList.add("is-visible");
      return true;
    }
    return false;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  revealItems.forEach((item) => {
    if (!showVisibleItem(item)) {
      observer.observe(item);
    }
  });

  window.addEventListener(
    "pageshow",
    () => {
      revealItems.forEach((item) => {
        if (!item.classList.contains("is-visible")) {
          showVisibleItem(item);
        }
      });
    },
    { once: true }
  );
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
