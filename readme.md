# Create PubSub

[![NPM Version](https://img.shields.io/npm/v/create-pubsub.svg?style=flat)](https://www.npmjs.org/package/create-pubsub)
[![Size](https://img.shields.io/bundlephobia/minzip/create-pubsub?label=size&style=flat)](https://bundlephobia.com/package/create-pubsub)
[![Types](https://img.shields.io/npm/types/create-pubsub)](https://www.jsdocs.io/package/create-pubsub#package-index)
[![License](https://badgen.net/npm/license/create-pubsub)](http://victor.mit-license.org/)

A tiny Event Emitter and Observable Store for JavaScript apps.

Supported environments: [Browser](https://gs.statcounter.com/browser-market-share), [Node](https://nodejs.org/) and [Deno](https://deno.land/).

It's a Vanilla JavaScript library, so it's framework-agnostic. But if you're using [React](https://reactjs.org/), check out the built-in support for it in the examples. And if you're planning to store immutable data, check also the built-in support for [Immer](https://immerjs.github.io/immer/).

## Install

```sh
npm install create-pubsub
```

## Import

```ts
// Import as an ES Module.
import { createPubSub } from "create-pubsub";
```

```js
// Or require as a CommonJS Module.
const { createPubSub } = require("create-pubsub");
```

```ts
// Or import it from URL.
import { createPubSub } from "https://esm.sh/create-pubsub";
```

```html
<!-- Or use it directly in the browser. -->
<script src="https://unpkg.com/create-pubsub"></script>
<script>
  const { createPubSub } = window["create-pubsub"];
</script>
```

## Usage

### As Emitter/Listener

For each event you want to track, create a new PubSub.

```ts
const [pub, sub] = createPubSub<Type>();
```

### As Store

To store a value, pass an initial value and set a third element while destructuring it.

```ts
const [pub, sub, get] = createPubSub(initialValue);
```

## Examples

### Example: Getting Started

```ts
const [pub, sub] = createPubSub<string>();

sub((data) => console.log(`Hello ${data}!`));

pub("World"); // Prints "Hello World!".
```

### Example: Naming Functions

Name the 'pub' and 'sub' functions as you wish. The idea is to avoid relying
on strings representing the events names. The following snippet shows
different ways to name an event which indicates the game started:

```ts
const [publishGameStarted, subscribeToGameStarted] = createPubSub();

const [gameStarted, onGameStarted] = createPubSub();

const [dispatchGameStarted, listenGameStartedEvent] = createPubSub();
```

### Example: Signalling

You can also publish events with no data, just for signalling:

```ts
const [emitPageIsReady, whenPageIsReady] = createPubSub();

whenPageIsReady(() => {
  // Do something with the page, which is now ready.
});

emitPageIsReady();
```

### Example: Unsubscribing

And you can unsubscribe at any moment, by invoking the function returned when you subscribe:

```ts
const [publish, subscribe] = createPubSub();

const unsubscribe = subscribe((numberReceived) => {
  console.log(numberReceived);

  if (numberReceived === 2) unsubscribe();
});

publish(1); // Prints 1.
publish(2); // Prints 2 and unsubscribe.
publish(3); // Nothing is printed.
```

### Example: Chaining Events

```ts
const [emitAssetsLoaded, onAssetsLoaded] = createPubSub();
const [emitGameStarted, onGameStarted] = createPubSub();

onGameStarted(() => {
  // Setup world, characters, etc. And possibly chain more events.
});

onAssetsLoaded(() => {
  // Initializes the game, load last saved session, etc.
  emitGameStarted();
});

emitAssetsLoaded();
```

### Example: Storing Data

```ts
const [set, sub, get] = createPubSub("red");

console.log(get()); // Prints "red".

set("blue"); // Sets the store to "blue", but nothing is printed.

sub((state) => console.log(state)); // Subscribe to next store updates.

set("green"); // Sets the store to "green" and prints it.

console.log(get()); // Prints "green".
```

### Example: Action & Reaction

You also receive the value to the previous value stored there, so you can
check if the value has changed or not since last time it was set, for example:

```ts
const [updatePlayer, onPlayerChanged, getPlayer] = createPubSub({
  name: "Player1",
  level: 5,
  hp: 33,
  mana: 92,
});

onPlayerChanged((playerState, previousPlayerState) => {
  if (playerState.level > previousPlayerState.level) {
    // Player leveled up! Let's display the level-up dialog.
  }
});

updatePlayer({ ...getPlayer(), level: 6, hp: 40, mana: 100 });
```

### Example: State Management

Using it as a store and reacting to other events:

```ts
const [setValue, watchValue, getValue] = createPubSub(0);

const [dispatchIncremented, onIncremented] = createPubSub();

const [dispatchDecremented, onDecremented] = createPubSub();

onIncremented(() => setValue(getValue() + 1));

onDecremented(() => setValue(getValue() - 1));

watchValue((state) => console.log(state));

dispatchIncremented(); // Prints 1.
dispatchIncremented(); // Prints 2.
dispatchDecremented(); // Prints 1.
```

### Example: Working with Immutable Data

For creating a PubSub instance that makes use of Immer, import the `createImmerPubSub`
function from `create-pubsub/immer` and the Publish function will then provide the draft
which you can mutate to generate the new state.

```tsx
import { createImmerPubSub } from "create-pubsub/immer";

const [updateColorsList, onColorsListUpdated, getColorsList] =
  createImmerPubSub([
    { name: "White", code: { r: 255, g: 255, b: 255 } },
    { name: "Gray", code: { r: 128, g: 128, b: 128 } },
  ]);

onColorsListUpdated((currentColorsList, previousColorsList) => {
  console.log(currentColorsList);
  // Prints:
  // [
  //   { name: "White", code: { r: 255, g: 255, b: 255 } },
  //   { name: "Green", code: { r: 0, g: 128, b: 0 } },
  // ]

  console.log(previousColorsList);
  // Prints:
  // [
  //   { name: "White", code: { r: 255, g: 255, b: 255 } },
  //   { name: "Gray", code: { r: 128, g: 128, b: 128 } },
  // ]
});

updateColorsList((colorsList) => {
  const color = colorsList.find((color) => color.name === "Gray");
  if (color) {
    color.name = "Green";
    color.code.r = 0;
    color.code.b = 0;
  }
});

console.log(getColorsList());
// Prints:
// [
//   { name: "White", code: { r: 255, g: 255, b: 255 } },
//   { name: "Green", code: { r: 0, g: 128, b: 0 } },
// ]
```

### Example: React Hook

For linking a PubSub instance with a React element, import the `usePubSub` hook
from `create-pubsub/react` and use it inside the component, similar to _React's
useState_.

```tsx
import { createPubSub } from "create-pubsub";
import { usePubSub } from "create-pubsub/react";

const counterPubSub = createPubSub(0);

const ReactButton = () => {
  const [count, setCount] = usePubSub(counterPubSub);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
};
```
