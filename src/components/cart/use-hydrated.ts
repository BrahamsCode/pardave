"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false en el servidor y durante la hidratación; true después en el cliente. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
