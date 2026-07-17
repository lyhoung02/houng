"use client";

import { createContext, useContext } from "react";

/** In-app navigation for the Nokor tabs, provided by the shell so any nested
 *  component (a post author, a profile card) can jump to a profile or DM. */
export type NokorNav = {
  openProfile: (userId: string) => void;
  openChat: (userId: string) => void;
};

const NokorNavContext = createContext<NokorNav | null>(null);

export const NokorNavProvider = NokorNavContext.Provider;

export function useNokorNav() {
  return useContext(NokorNavContext);
}
