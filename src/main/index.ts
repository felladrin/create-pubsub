export function createPubSub<T = void>(): [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: GetFunctionPossiblyUndefined<T>
];
export function createPubSub<T>(
  storedData: T
): [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: GetFunction<T>
];
export function createPubSub<T = void>(
  storedData?: T
): [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>,
  getStoredData: GetFunction<T>
] {
  /**
   * Node on the head of the list, which has no value,
   * and is used just for reference to other nodes.
   */
  const head = [] as unknown as SubscriptionListNode<T>;

  /**
   * Reference to the last node on the list, so that subscribing appends in
   * constant time instead of walking from the head to find the end.
   */
  let tail = head;

  return [
    (data: T) => {
      /**
       * Constant holding the value of stored data before it's
       * updated, to publish it along with the new data.
       */
      const previousData = storedData as T;

      // Store the data being published in this loop, to compare
      // if it has changed during the publishing process.
      storedData = data;

      /**
       * Variable holding the reference of the current node.
       * Always initialized with the node from the head of the list.
       */
      let node = head;

      // While there is a next node...
      while (node[2]) {
        // Take control of the next node.
        node = node[2];

        // Publish the data received to the node, unless the node was
        // unsubscribed after the cursor passed its predecessor. Unsubscribing
        // clears the handler, and that is the only way to tell: the cursor can
        // be sitting on a node that has already left the list, and a detached
        // node still points at the successor it had when it left.
        if (node[0]) node[0](data, previousData);

        // If a reaction from that node ended up publishing a new data,
        // which happened in another loop, we can break this one.
        if (data !== storedData) break;
      }
    },
    (handler) => {
      /**
       * Variable holding the reference of the current node.
       * Will be set to 0 after subscription ends, to prevent unsubscribing more than once.
       */
      let node: 0 | SubscriptionListNode<T> = tail;

      // Append the new node after the current tail, then take control of it.
      tail = node[2] = [handler, node];
      node = tail;

      return () => {
        // If node has value 0, it means it was unsubscribed before, so we stop here.
        if (!node) return;

        // Link the predecessor's next pointer around this node. This is O(1)
        // because the back pointer below is repaired on every unlink, so it can
        // never point to a node that has already left the list.
        node[1][2] = node[2];

        if (node[2]) {
          // Point the successor's back pointer at this node's predecessor, so
          // every `previousNode` on the live list stays valid. Without this, a
          // later unsubscribe of that successor would splice against this
          // already-detached node instead of against the live list, and the
          // successor would never be removed from it.
          node[2][1] = node[1];
        } else {
          // This was the last node on the list, so the tail moves back one step.
          tail = node[1];
        }

        // Clear the handler, so a publish already walking the list does not
        // call it, and so a node detached in front of a long-lived subscriber
        // stops holding its handler alive.
        node[0] = 0;

        // So this node is not on the list anymore, and we also set its value to
        // zero, to prevent unsubscribing more than once.
        node = 0;
      };
    },
    (() => storedData) as GetFunction<T>,
  ];
}

//#region Public Types
export type SubscriptionHandler<T = void> = (data: T, previousData: T) => void;

export type PublishFunction<T = void> = (data: T) => void;

export type UnsubscribeFunction = () => void;

export type GetFunction<T> = () => T;

export type GetFunctionPossiblyUndefined<T = void> = () => T extends void
  ? undefined
  : T | undefined;

export type SubscribeFunction<T> = (
  handler: SubscriptionHandler<T>
) => UnsubscribeFunction;
//#endregion

//#region Private Types
type SubscriptionListNode<T> = [
  handler: SubscriptionHandler<T> | 0,
  previousNode: SubscriptionListNode<T>,
  nextNode?: SubscriptionListNode<T>
];
//#endregion
