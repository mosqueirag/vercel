"use client";

import { useEffect, useRef } from "react";
import { useCoopia } from "../../components/coopia-context";

export function HelpArticleViewTracker({ slug, category }: { slug: string; category: string | null }) {
  const coopia = useCoopia();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !coopia.journeyId || !coopia.sessionId) return;
    tracked.current = true;
    coopia.track("help_article_view", { slug, ...(category ? { category } : {}) });
  }, [category, coopia, slug]);

  return null;
}
