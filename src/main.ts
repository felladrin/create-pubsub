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
  let head = [] as unknown as SubscriptionListNode<T>;

  return [
    (data: T) => {
      /**
       * Constant holding the value of stored data before it's
       * updated, to publish it along with the new data.
       */
      let previousData = storedData as T;

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

        // Publish the data received to the node.
        node[0](data, previousData);

        // If a reaction from that node ended up publishing a new data,
        // which happened in another loop, we can break this one.
        if (data !== storedData) break;
      }
    },
    (handler) => {
      /**
       * Variable holding the reference of the current node.
       * Always initialized with the node from the head of the list.
       * Will be set to 0 after subscription ends, to prevent unsubscribing more than once.
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

        // So this node is not on the list anymore, and we can remove the handler reference
        // from it, and we also set its value to zero, to prevent unsubscribing more than once.
        node = 0;
      };
    },
    (() => storedData) as GetFunction<T>,
  ];
}

//#region Public Types
export type SubscriptionHandler<T = void> = (
  data: Readonly<T>,
  previousData: Readonly<T>
) => void;

export type PublishFunction<T = void> = (data: T) => void;

export type UnsubscribeFunction = () => void;

export type GetFunction<T> = () => T extends Function ? T : Readonly<T>;

export type GetFunctionPossiblyUndefined<T = void> = () => T extends void
  ? undefined
  : T extends Function
  ? T | undefined
  : Readonly<T> | undefined;

export type SubscribeFunction<T> = (
  handler: SubscriptionHandler<T>
) => UnsubscribeFunction;
//#endregion

//#region Private Types
type SubscriptionListNode<T> = [
  handler: SubscriptionHandler<T>,
  previousNode: SubscriptionListNode<T>,
  nextNode?: SubscriptionListNode<T>
];
//#endregion
