export type SubscriptionHandler<T = void> = T extends void
  ? () => void
  : (data: T) => void;

export type PublishFunction<T> = (data: T) => void;

export type UnsubscribeFunction = () => void;

export type SubscribeFunction<T> = (
  handler: SubscriptionHandler<T>
) => UnsubscribeFunction;

function subscribe<T>(
  handlers: SubscriptionHandler<T>[],
  handler: SubscriptionHandler<T>
): UnsubscribeFunction {
  handlers.unshift(handler);
  return () => {
    for (let index = handlers.length - 1; index >= 0; index--)
      if (handlers[index] === handler) {
        handlers.splice(index, 1);
        break;
      }
  };
}

function publish<T>(handlers: SubscriptionHandler<T>[], data: T) {
  for (let index = handlers.length - 1; index >= 0; index--)
    handlers[index](data);
}

export function createPubSub<T = void>(): [
  publish: PublishFunction<T>,
  subscribe: SubscribeFunction<T>
] {
  const handlers: SubscriptionHandler<T>[] = [];
  return [
    (data) => publish(handlers, data),
    (handler) => subscribe(handlers, handler),
  ];
}
