import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { createPubSub } from "../../src/main/index.js";

/** Every possible ordering of the given values. */
const permutations = (values: number[]): number[][] =>
  values.length <= 1
    ? [values]
    : values.flatMap((value, index) =>
        permutations([
          ...values.slice(0, index),
          ...values.slice(index + 1),
        ]).map((rest) => [value, ...rest]),
      );

describe("main", () => {
  it("random number should be transmitted accordingly", () => {
    const randomNumber = Math.random();

    const [pub, sub] = createPubSub<number>();

    sub((data) => assert.equal(data, randomNumber));

    pub(randomNumber);
  });

  it("destructuring the array created by createPubSub() should allow any function name to be used", () => {
    const randomNumber = Math.random();

    const [publishRandomNumber, subscribeToRandomNumber] =
      createPubSub<number>();

    subscribeToRandomNumber((data) => assert.equal(data, randomNumber));

    publishRandomNumber(randomNumber);
  });

  it("synchronous subscriptions should be dispatched in sequence", () => {
    const subscriptionHandlersIds = [] as number[];

    const firstSubscriptionHandler = () => subscriptionHandlersIds.push(1);
    const secondSubscriptionHandler = () => subscriptionHandlersIds.push(2);
    const thirdSubscriptionHandler = () => subscriptionHandlersIds.push(3);

    const [pub, sub] = createPubSub();

    sub(firstSubscriptionHandler);
    sub(secondSubscriptionHandler);
    sub(thirdSubscriptionHandler);

    pub();

    assert.deepEqual(subscriptionHandlersIds, [1, 2, 3]);
  });

  it("subscribing only once should work properly", () => {
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

  it("subscribing only once should work properly even when other subscription handlers remain active", () => {
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

  it("subscribing the same function twice and unsubscribing it once should keep one subscription active", () => {
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

  it("it should stop publishing the old value if a reaction during the publish process ends up publishing a new value", () => {
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

    assert.deepEqual(numbersReceivedOnFirstSubscription, [1, 2, 5, 3, 4]);
    assert.deepEqual(numbersReceivedOnSecondSubscription, [1, 2, 5, 3, 4]);
    assert.deepEqual(numbersReceivedOnThirdSubscription, [1, 5, 3, 4]);
  });

  it("it should also work as a store", () => {
    const [dispatchNumberAdded, listenToNumberAdded] = createPubSub<number>();

    const [setCurrentNumber, onCurrentNumberChanged, getCurrentNumber] =
      createPubSub(1);

    const [setDoubledNumber, , getDoubledNumber] = createPubSub(
      getCurrentNumber()
    );

    onCurrentNumberChanged((number) => {
      setDoubledNumber(number * 2);
    });

    listenToNumberAdded((numberAdded) =>
      setCurrentNumber(getCurrentNumber() + numberAdded)
    );

    dispatchNumberAdded(5);

    assert.equal(getCurrentNumber(), 6);
    assert.equal(getDoubledNumber(), 12);
  });

  it("the previous stored data is also dispatched, to allow comparison with current one", () => {
    const numbersReceived: number[] = [];
    const nonSequentiallyEqualNumbersReceived: number[] = [];

    const [publishNumber, onNumberReceived] = createPubSub(0);

    onNumberReceived((numberReceived, previousNumberReceived) => {
      numbersReceived.push(numberReceived);

      if (numberReceived !== previousNumberReceived) {
        nonSequentiallyEqualNumbersReceived.push(numberReceived);
      }
    });

    publishNumber(1);
    publishNumber(2);
    publishNumber(2);
    publishNumber(3);
    publishNumber(3);
    publishNumber(3);
    publishNumber(4);
    publishNumber(3);
    publishNumber(4);
    publishNumber(4);
    publishNumber(5);

    assert.deepEqual(numbersReceived, [1, 2, 2, 3, 3, 3, 4, 3, 4, 4, 5]);
    assert.deepEqual(
      nonSequentiallyEqualNumbersReceived,
      [1, 2, 3, 4, 3, 4, 5]
    );
  });

  it("previous stored data also works fine for non-primitive objects", () => {
    const propertiesChanged: string[] = [];
    const propertiesUnchanged: string[] = [];

    const [updatePlayer, onPlayerChanged, getPlayer] = createPubSub({
      name: "Player1",
      level: 5,
      hp: 33,
      mana: 92,
    });

    onPlayerChanged((playerState, previousPlayerState) => {
      (Object.keys(playerState) as (keyof typeof playerState)[]).forEach(
        (property) => {
          (playerState[property] === previousPlayerState[property]
            ? propertiesUnchanged
            : propertiesChanged
          ).push(property);
        }
      );
    });

    updatePlayer({ ...getPlayer(), level: 6, hp: 40 });

    assert.deepEqual(propertiesChanged, ["level", "hp"]);
    assert.deepEqual(propertiesUnchanged, ["name", "mana"]);
  });

  it("for changing properties of an object from an array, it's recommended to slice the array and replace the object via index", () => {
    const [updatePlayersList, onPlayersListUpdated, getPlayersList] =
      createPubSub([
        { name: "Player0", alive: true, color: { r: 0, g: 0, b: 0 } },
        { name: "Player1", alive: false, color: { r: 255, g: 255, b: 255 } },
      ]);

    const updatedPlayersList = getPlayersList().slice();

    updatedPlayersList[0] = {
      name: "Player3",
      alive: false,
      color: { ...updatedPlayersList[0].color, r: 128, g: 64 },
    };

    updatedPlayersList[1] = {
      ...updatedPlayersList[1],
      alive: true,
    };

    onPlayersListUpdated((currentPlayersList, previousPlayersList) => {
      assert.deepEqual(currentPlayersList, [
        { name: "Player3", alive: false, color: { r: 128, g: 64, b: 0 } },
        { name: "Player1", alive: true, color: { r: 255, g: 255, b: 255 } },
      ]);
      assert.deepEqual(previousPlayersList, [
        { name: "Player0", alive: true, color: { r: 0, g: 0, b: 0 } },
        { name: "Player1", alive: false, color: { r: 255, g: 255, b: 255 } },
      ]);
    });

    updatePlayersList(updatedPlayersList);

    assert.deepEqual(getPlayersList(), [
      { name: "Player3", alive: false, color: { r: 128, g: 64, b: 0 } },
      { name: "Player1", alive: true, color: { r: 255, g: 255, b: 255 } },
    ]);
  });

  it("unsubscribing twice should not drop subscriptions added in between", () => {
    const calls: string[] = [];

    const [publish, subscribe] = createPubSub<number>();

    subscribe(() => calls.push("first"));
    const unsubscribeSecond = subscribe(() => calls.push("second"));

    unsubscribeSecond();
    subscribe(() => calls.push("third"));
    unsubscribeSecond();

    publish(1);

    assert.deepEqual(calls, ["first", "third"]);
  });

  it("unsubscribing handlers in subscription order should remove all of them", () => {
    const calls: string[] = [];

    const [publish, subscribe] = createPubSub<number>();

    const unsubscribeFirst = subscribe(() => calls.push("first"));
    const unsubscribeSecond = subscribe(() => calls.push("second"));

    unsubscribeFirst();
    unsubscribeSecond();

    publish(1);

    assert.deepEqual(calls, []);
  });

  it("unsubscribing another handler mid-publish should not crash", () => {
    const order: string[] = [];

    const [publish, subscribe] = createPubSub<number>();

    const unsubscribeSecond = subscribe(() => {
      order.push("second");
    });

    subscribe(() => {
      order.push("third");
      unsubscribeSecond();
    });

    subscribe(() => {
      order.push("fourth");
    });

    publish(1);

    assert.deepEqual(order, ["second", "third", "fourth"]);

    publish(2);

    // After first publish, "second" is unsubscribed; only "third" and "fourth" remain
    assert.deepEqual(order, ["second", "third", "fourth", "third", "fourth"]);
  });

  it("a handler unsubscribed mid-publish should not be called later in that same publish", () => {
    const calls: string[] = [];

    const [publish, subscribe] = createPubSub<number>(0);

    // The first handler removes itself and the one after it. The dispatch
    // cursor is left on a node that has left the list, so the walk has to
    // notice that the node it reaches next was unsubscribed in the meantime.
    const unsubscribeFirst = subscribe(() => {
      calls.push("first");
      unsubscribeFirst();
      unsubscribeSecond();
    });

    const unsubscribeSecond = subscribe(() => {
      calls.push("second");
    });

    subscribe(() => {
      calls.push("third");
    });

    publish(1);

    assert.deepEqual(calls, ["first", "third"]);
  });

  it("subscribing mid-publish should reach the new subscriber in the current publish loop", () => {
    const order: number[] = [];

    const [publish, subscribe] = createPubSub<number>();

    subscribe(() => {
      order.push(1);
    });

    subscribe(() => {
      order.push(2);
      subscribe(() => {
        order.push(3);
      });
    });

    subscribe(() => {
      order.push(4);
    });

    publish(1);

    // New subscriber is appended to tail; traversal reaches it after existing nodes
    assert.deepEqual(order, [1, 2, 4, 3]);
  });

  it("get() before anything is published returns undefined when no initial value is set", () => {
    const [, , get] = createPubSub();

    assert.equal(get(), undefined);
  });

  it("unsubscribing every listener in any order should leave nothing dispatching", () => {
    for (let listenerCount = 1; listenerCount <= 6; listenerCount++) {
      const indices = Array.from({ length: listenerCount }, (_, index) => index);

      for (const order of permutations(indices)) {
        const dispatched: string[] = [];

        const [publish, subscribe] = createPubSub<number>();

        const unsubscribes = indices.map((index) => {
          const name = `listener${index}`;

          return subscribe(() => dispatched.push(name));
        });

        for (const index of order) unsubscribes[index]();

        publish(1);

        assert.deepEqual(dispatched, [], `unsubscribing in order [${order}] left listeners dispatching`);

        // The list is empty now, so the tail must have rolled all the way back
        // to the head. A listener subscribed here has to be reached by the next
        // publish; if the tail were left on an unlinked node, it never would be.
        // The second array is not a style choice: `assert.deepEqual` asserts the
        // type of its first argument, so the assertion above narrows
        // `dispatched` to `never[]` and pushing into it no longer compiles.
        const afterDraining: string[] = [];

        subscribe(() => afterDraining.push("fresh"));

        publish(2);

        assert.deepEqual(afterDraining, ["fresh"], `a listener subscribed after unsubscribing every listener in order [${order}] was not reached`);
      }
    }
  });

  it("unsubscribing listeners in any order should keep the survivors dispatching in subscription order", () => {
    for (let listenerCount = 2; listenerCount <= 6; listenerCount++) {
      const indices = Array.from({ length: listenerCount }, (_, index) => index);

      for (const order of permutations(indices)) {
        const dispatched: string[] = [];

        const [publish, subscribe] = createPubSub<number>();

        const unsubscribes = indices.map((index) => {
          const name = `listener${index}`;

          return subscribe(() => dispatched.push(name));
        });

        const removed = order.slice(0, Math.floor(listenerCount / 2));

        for (const index of removed) unsubscribes[index]();

        publish(1);

        assert.deepEqual(
          dispatched,
          indices.filter((index) => !removed.includes(index)).map((index) => `listener${index}`),
          `unsubscribing in order [${order}] dispatched the wrong listeners`,
        );

        // A listener subscribed after all that churn must land at the tail of the
        // remaining list and be reached by the next publish. This is what catches
        // a tail reference left pointing at a node that has been unlinked.
        dispatched.length = 0;

        subscribe(() => dispatched.push("fresh"));

        publish(2);

        assert.deepEqual(
          dispatched,
          [...indices.filter((index) => !removed.includes(index)).map((index) => `listener${index}`), "fresh"],
          `a listener subscribed after unsubscribing in order [${order}] was not reached`,
        );
      }
    }
  });

  it("subscribing should stay within a constant-time ceiling as the list grows", () => {
    const millisecondsToSubscribe = (listenerCount: number) => {
      const [, subscribe] = createPubSub<number>();

      const startedAt = process.hrtime.bigint();

      for (let index = 0; index < listenerCount; index++) subscribe(() => {});

      return Number(process.hrtime.bigint() - startedAt) / 1e6;
    };

    // Warm up the JIT before measuring.
    millisecondsToSubscribe(500);

    // Best of three: a one-off GC pause or scheduler hiccup must not fail a
    // guard that sits on the release path. Under O(n) behaviour every run is
    // slow, so the minimum still catches the regression.
    const elapsed = Math.min(
      millisecondsToSubscribe(20_000),
      millisecondsToSubscribe(20_000),
      millisecondsToSubscribe(20_000),
    );

    // Subscribing used to walk to the tail on every call, so building 20k
    // listeners took over a second. Appending at a tracked tail takes about a
    // millisecond. Both figures move with the machine, so the bound is not
    // derived from either one: it sits two orders of magnitude above the
    // constant-time path and several times below the walk. That is wide enough
    // to survive a loaded CI runner and still far too tight for a regression
    // back to walking to pass.
    assert.ok(
      elapsed < 250,
      `subscribing 20k listeners took ${elapsed.toFixed(0)}ms, which means subscribe walks the list instead of appending at the tail`,
    );
  });

  it("unsubscribing in reverse subscription order should stay within a constant-time ceiling on a large list", () => {
    const millisecondsToUnsubscribe = (listenerCount: number) => {
      const [, subscribe] = createPubSub<number>();

      const unsubscribe = Array.from({ length: listenerCount }, () =>
        subscribe(() => {}),
      );

      const startedAt = process.hrtime.bigint();

      for (let index = unsubscribe.length - 1; index >= 0; index--)
        unsubscribe[index]();

      return Number(process.hrtime.bigint() - startedAt) / 1e6;
    };

    // Warm up the JIT before measuring.
    millisecondsToUnsubscribe(500);

    // Best of three, for the same reason as the subscribe guard above.
    const elapsed = Math.min(
      millisecondsToUnsubscribe(20_000),
      millisecondsToUnsubscribe(20_000),
      millisecondsToUnsubscribe(20_000),
    );

    // Unsubscribing used to walk from the head to find each predecessor, so
    // tearing down 20k listeners took over a second. Splicing through a
    // repaired back pointer takes well under a millisecond. The bound is chosen
    // the same way as the subscribe guard above.
    assert.ok(
      elapsed < 250,
      `unsubscribing 20k listeners took ${elapsed.toFixed(0)}ms, which means unsubscribe walks the list instead of splicing in constant time`,
    );
  });
});
