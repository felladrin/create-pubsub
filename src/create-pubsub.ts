export function createPubSub<T = void>(): [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>
] {
  const head = [] as unknown as SubscriptionListNode<T>;
  return [
    (data: T) => {
      let node = head;
      while (node[2]) {
        node = node[2];
        node[0](data);
      }
    },
    (handler) => {
      let node: 0 | SubscriptionListNode<T> = head;
      while (node[2]) node = node[2];
      node = node[2] = [handler, node];
      return () => {
        if (!node) return;
        node[1][2] = node[2];
        node = 0;
      };
    },
  ];
}

// #region Types
export type SubscriptionHandler<T = void> = T extends void
  ? () => void
  : (data: T) => void;

export type PublishFunction<T> = (data: T) => void;

export type UnsubscribeFunction = () => void;

export type SubscribeFunction<T> = (
  handler: SubscriptionHandler<T>
) => UnsubscribeFunction;

type SubscriptionListNode<T> = [
  handler: SubscriptionHandler<T>,
  previousItem: SubscriptionListNode<T>,
  nextItem?: SubscriptionListNode<T>
];
// #endregion
