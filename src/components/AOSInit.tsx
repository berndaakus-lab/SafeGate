"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function AOSInit() {
  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
    });

    // Images and web fonts loading after the initial paint shift layout,
    // which throws off AOS's cached element offsets and can leave
    // below-the-fold sections stuck at opacity 0. Refresh once everything
    // has actually settled.
    const refresh = () => AOS.refresh();

    window.addEventListener("load", refresh);
    document.fonts?.ready?.then(refresh);

    const images = Array.from(document.images).filter((img) => !img.complete);
    images.forEach((img) => img.addEventListener("load", refresh, { once: true }));

    return () => {
      window.removeEventListener("load", refresh);
      images.forEach((img) => img.removeEventListener("load", refresh));
    };
  }, []);

  return null;
}
