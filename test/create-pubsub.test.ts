import { test } from "uvu";
import * as assert from "uvu/assert";
import { createPubSub } from "../src/create-pubsub";

test("random number should be transmitted accordingly", () => {
  const randomNumber = Math.random();

  const [pub, sub] = createPubSub<number>();

  sub((data) => assert.is(data, randomNumber));

  pub(randomNumber);
});

test("destructuring the array created by createPubSub() show allow any function name to be used", () => {
  const randomNumber = Math.random();

  const [publishRandomNumber, subscribeToRandomNumber] = createPubSub<number>();

  subscribeToRandomNumber((data) => assert.is(data, randomNumber));

  publishRandomNumber(randomNumber);
});

test("synchronous subscriptions should be dispatched in sequence", () => {
  const subscriptionHandlersIds = [] as number[];

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

  const [publish, subscribe] = createPubSub<number>();

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

  const [publish, subscribe] = createPubSub<number>();

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

test("subscribing the same function twice and unsubscribing it once should keep one subscription active", () => {
  let totalTimesInvoked = 0;
  let lastNumberReceived = 0;

  const functionToTest = (receivedNumber: number) => {
    totalTimesInvoked++;
    lastNumberReceived = receivedNumber;
  };

  const [publish, subscribe] = createPubSub<number>();

  const unsubscribeFirstSubscriptionHandler = subscribe(functionToTest);

  subscribe(functionToTest);

  publish(1);
  publish(2);

  unsubscribeFirstSubscriptionHandler();

  publish(3);
  publish(4);

  assert.equal(totalTimesInvoked, 6);
  assert.equal(lastNumberReceived, 4);
});

test("should stop publishing the old value if a reaction during the publish process ends up publishing a new value", () => {
  const numbersReceivedOnFirstSubscription: number[] = [];
  const numbersReceivedOnSecondSubscription: number[] = [];
  const numbersReceivedOnThirdSubscription: number[] = [];

  const [publish, subscribe] = createPubSub<number>();

  subscribe((numberReceived) => {
    numbersReceivedOnFirstSubscription.push(numberReceived);
  });

  subscribe((numberReceived) => {
    numbersReceivedOnSecondSubscription.push(numberReceived);
    if (numberReceived === 2) {
      publish(5);
    }
  });

  subscribe((numberReceived) => {
    numbersReceivedOnThirdSubscription.push(numberReceived);
  });

  publish(1);
  publish(2);
  publish(3);
  publish(4);

  assert.equal(numbersReceivedOnFirstSubscription, [1, 2, 5, 3, 4]);
  assert.equal(numbersReceivedOnSecondSubscription, [1, 2, 5, 3, 4]);
  assert.equal(numbersReceivedOnThirdSubscription, [1, 5, 3, 4]);
});

test.run();
