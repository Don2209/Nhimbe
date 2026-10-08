import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during SSR and hydration, true afterwards. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
