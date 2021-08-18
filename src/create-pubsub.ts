export function createPubSub<T = void>(): [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>
] {
  /**
   * Node on the head of the list, which has no value,
   * and is used just for reference to other nodes.
   */
  const head = [] as unknown as SubscriptionListNode<T>;

  /**
   * Data being published, which is stored for later to compare
   * if it changed in the middle of a publishing process.
   */
  let dataBeingPublished: T;

  return [
    (data: T) => {
      // Store the data being published in this loop.
      dataBeingPublished = data;

      /**
       * Variable holding the reference of the current node.
       * Always initialized with the node from the head of the list.
       */
      let node = head;

      // While there is a next node...
      while (node[2]) {
        // Take control of the next node.
        node = node[2];

        // Publish the data received to the node.
        node[0](data);

        // If reaction from the node ended up publishing a new data,
        // which happened in a nested loop, we can break this one.
        if (data !== dataBeingPublished) break;
      }
    },
    (handler) => {
      /**
       * Variable holding the reference of the current node.
       * Always initialized with the node from the head of the list.
       * Will be set to 0 after subscription ends,
       * to prevent unsubscribing more then once.
       */
      let node: 0 | SubscriptionListNode<T> = head;

      // Find and take control of the last node on the list.
      while (node[2]) node = node[2];

      // On the last node, link a new a node and take control of it.
      node = node[2] = [handler, node];

      return () => {
        // If node has value 0, it means it was unsubscribed before, so we stop here.
        if (!node) return;

        // Otherwise, link the next node - even if it's undefined - to the previous node.
        node[1][2] = node[2];

        // So this node is not on the list anymore, and we can unreference of the handler
        // from it, and we also set its value to zero, to prevent unsubscribing more then once.
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
  previousNode: SubscriptionListNode<T>,
  nextNode?: SubscriptionListNode<T>
];
// #endregion
