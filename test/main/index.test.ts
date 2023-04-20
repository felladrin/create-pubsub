import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { createPubSub } from "../../src/main";

describe("main", () => {
  it("random number should be transmitted accordingly", () => {
    const randomNumber = Math.random();

    const [pub, sub] = createPubSub<number>();

    sub((data) => assert.equal(data, randomNumber));

    pub(randomNumber);
  });

  it("destructuring the array created by createPubSub() show allow any function name to be used", () => {
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
});
