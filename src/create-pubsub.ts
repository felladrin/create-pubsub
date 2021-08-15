export type SubscriptionHandler<T = void> = T extends void
  ? () => void
  : (data: T) => void;

export type PublishFunction<T> = (data: T) => void;

export type UnsubscribeFunction = () => void;

export type SubscribeFunction<T> = (
  handler: SubscriptionHandler<T>
) => UnsubscribeFunction;

let index = 0;

function subscribe<T>(
  handlers: SubscriptionHandler<T>[],
  handler: SubscriptionHandler<T>
): UnsubscribeFunction {
  let isNewHandler = true;

  for (index = handlers.length - 1; index >= 0; index--)
    if (handlers[index] === handler) {
      isNewHandler = false;
      break;
    }

  if (isNewHandler) handlers.unshift(handler);

  return () => {
    for (index = handlers.length - 1; index >= 0; index--)
      if (handlers[index] === handler) handlers.splice(index, 1);
  };
}

function publish<T>(handlers: SubscriptionHandler<T>[], data: T) {
  for (index = handlers.length - 1; index >= 0; index--) handlers[index](data);
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
