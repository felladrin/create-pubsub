import { Draft, produce } from "immer";
import { createPubSub, GetFunction, SubscribeFunction } from "../main";

export type DraftFunction<T> = (draft: Draft<T>) => void;
export type PublishImmerFunction<T> = (draftFunction: DraftFunction<T>) => void;

export function createImmerPubSub<T>(
  storedData: T
): [
  publish: PublishImmerFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: GetFunction<T>
] {
  const [publish, subscribe, get] = createPubSub(storedData);

  return [
    (draftFunction) => publish(produce(get(), draftFunction)),
    subscribe,
    get,
  ];
}
