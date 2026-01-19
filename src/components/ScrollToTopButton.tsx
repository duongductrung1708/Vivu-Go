"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (typeof window === "undefined") return;
      setVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!visible) return null;

  const handleClick = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      className="bg-background/80 border-border fixed right-4 bottom-6 z-40 rounded-full border shadow-md backdrop-blur transition-opacity duration-200 hover:shadow-lg"
    >
      <ArrowUp className="h-4 w-4" />
      <span className="sr-only">Scroll to top</span>
    </Button>
  );
}
