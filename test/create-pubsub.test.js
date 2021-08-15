import { test } from "uvu";
import * as assert from "uvu/assert";
import { createPubSub } from "../dist/create-pubsub.cjs";

test("random number should be transmitted accordingly", () => {
  const randomNumber = Math.random();
  const [pub, sub] = createPubSub();
  sub((data) => assert.is(data, randomNumber));
  pub(randomNumber);
});

test("destructuring the array created by createPubSub() show allow any function name to be used", () => {
  const randomNumber = Math.random();
  const [publishRandomNumber, subscribeToRandomNumber] = createPubSub();
  subscribeToRandomNumber((data) => assert.is(data, randomNumber));
  publishRandomNumber(randomNumber);
});

test("synchronous subscriptions should be dispatched in sequence", () => {
  const subscriptionHandlersIds = [];
  const firstSubscriptionHandler = () => subscriptionHandlersIds.push(1);
  const secondSubscriptionHandler = () => subscriptionHandlersIds.push(2);
  const thirdSubscriptionHandler = () => subscriptionHandlersIds.push(3);
  const [pub, sub] = createPubSub();
  sub(firstSubscriptionHandler);
  sub(secondSubscriptionHandler);
  sub(thirdSubscriptionHandler);
  pub();
  assert.equal(subscriptionHandlersIds, [1, 2, 3]);
});

test("subscribing only once should work properly", () => {
  let timesTheSubscriptionHandlerWasInvoked = 0;
  const [publish, subscribe] = createPubSub();
  const unsubscribe = subscribe(() => {
    timesTheSubscriptionHandlerWasInvoked++;
    unsubscribe();
  });
  publish(1);
  publish(2);
  publish(3);
  assert.equal(timesTheSubscriptionHandlerWasInvoked, 1);
});

test("subscribing only once should work properly even when other subscription handlers remain active", () => {
  let timesTheFirstSubscriptionHandlerWasInvoked = 0;
  let timesTheSecondSubscriptionHandlerWasInvoked = 0;
  let timesTheThirdSubscriptionHandlerWasInvoked = 0;
  const [publish, subscribe] = createPubSub();
  const unsubscribeFirstSubscriptionHandler = subscribe(() => {
    timesTheFirstSubscriptionHandlerWasInvoked++;
    unsubscribeFirstSubscriptionHandler();
  });
  subscribe(() => {
    timesTheSecondSubscriptionHandlerWasInvoked++;
  });
  const unsubscribeThirdSubscriptionHandler = subscribe(() => {
    timesTheThirdSubscriptionHandlerWasInvoked++;
    if (timesTheThirdSubscriptionHandlerWasInvoked > 1)
      unsubscribeThirdSubscriptionHandler();
  });
  publish(1);
  publish(2);
  publish(3);
  assert.equal(timesTheFirstSubscriptionHandlerWasInvoked, 1);
  assert.equal(timesTheSecondSubscriptionHandlerWasInvoked, 3);
  assert.equal(timesTheThirdSubscriptionHandlerWasInvoked, 2);
});

test.run();
