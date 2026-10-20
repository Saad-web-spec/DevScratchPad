"use client";

import { useLayoutEffect } from "react";

/**
 * Share links used to open the editor at /graph#g=… (or #graph=…), and links already sent in chats still
 * do: the graph is forwarded to /graph/studio. The hash never reaches the server, so this runs in the
 * browser, before the first client paint. A hash pasted while on this page only fires hashchange, hence
 * the listener. New links point at /graph/studio directly, so this only serves old ones.
 */
export function ShareLinkForward() {
  useLayoutEffect(() => {
    const forward = () => {
      if (/(?:^#|&)(?:g|graph)=/.test(window.location.hash)) {
        window.location.replace(`/graph/studio${window.location.search}${window.location.hash}`);
      }
    };
    forward();
    window.addEventListener("hashchange", forward);
    return () => window.removeEventListener("hashchange", forward);
  }, []);
  return null;
}
