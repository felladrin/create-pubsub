import { useState, useEffect } from "react";
import type { PublishFunction, SubscribeFunction } from "./main";

export function usePubSub<T>([publish, subscribe, get]: [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: () => T
]): [data: T, publish: PublishFunction<T>] {
  const [currentState, setState] = useState<T>(get());

  useEffect(() => {
    const unsubscribe = subscribe(setState);
    return () => unsubscribe();
  }, []);

  return [currentState, publish];
}
