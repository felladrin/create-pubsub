import { createPubSub, type SubscribeFunction } from "./main";

export function createDerivedPubSub<T>(
  subscribeFunctions: SubscribeFunction<any>[],
  getData: () => T
) {
  const derivedPubSub = createPubSub<T>(getData());
  subscribeFunctions.forEach((subscribe) =>
    subscribe(() => derivedPubSub[0](getData()))
  );
  return derivedPubSub;
}
