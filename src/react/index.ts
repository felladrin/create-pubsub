import { useState, useEffect } from "react";
import type { PublishImmerFunction } from "../immer";
import type { GetFunction, PublishFunction, SubscribeFunction } from "../main";

export function usePubSub<T>([publish, subscribe, get]: [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: GetFunction<T>
]): [data: T, publish: PublishFunction<T>];
export function usePubSub<T>([publish, subscribe, get]: [
  publish: PublishImmerFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: GetFunction<T>
]): [data: T, publish: PublishImmerFunction<T>];
export function usePubSub<T>([publish, subscribe, get]: [
  publish: PublishFunction<T> | PublishImmerFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: GetFunction<T>
]): [data: T, publish: PublishFunction<T> | PublishImmerFunction<T>] {
  const [currentState, setState] = useState<T>(get());

  useEffect(() => subscribe(setState), []);

  return [currentState, publish];
}
