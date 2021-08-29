# Create PubSub

[![NPM Version](https://img.shields.io/npm/v/create-pubsub.svg?style=flat)](https://www.npmjs.org/package/create-pubsub)
[![Size](https://img.badgesize.io/https:/unpkg.com/create-pubsub@latest/dist/create-pubsub.js?compression=gzip)](https://unpkg.com/create-pubsub/dist/create-pubsub.js)
[![Types](https://img.shields.io/npm/types/create-pubsub)](https://www.npmjs.org/package/create-pubsub)
[![License](https://img.shields.io/github/license/felladrin/create-pubsub)](http://victor.mit-license.org/)

A tiny and strongly-typed Emitter/Listener which is also a Store.

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

```ts
const [pub, sub] = createPubSub<string>();

sub((data) => console.log(`Hello ${data}!`));

pub("World"); // Prints "Hello World!".
```

Name the 'pub' and 'sub' functions as you wish. The idea is to avoid relying on strings representing the events names. The following snippet shows different ways to name an event which represents the game ready:

```ts
const [publishGameStarted, subscribeToGameStarted] = createPubSub();

const [gameStarted, onGameStarted] = createPubSub();

const [dispatchGameStarted, listenGameStartedEvent] = createPubSub();
```

You can also publish events with no data, just for signalling:

```ts
const [emitPageIsReady, whenPageIsReady] = createPubSub();

whenPageIsReady(() => {
  // Do something with the page, which is now ready.
});

emitPageIsReady();
```

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

And here's an example of chained events:

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

To use it as a store, it's also easy:

```ts
const [set, sub, get] = createPubSub("red");

console.log(get()); // Prints "red".

set("blue"); // Sets the store to "blue", but nothing is printed.

sub((state) => console.log(state)); // Subscribe to the next store updates.

set("green"); // Sets the store to "green" and prints it.
```

Using it as a store and reacting to other events:

```ts
const [set, sub, get] = createPubSub(0);

const [dispatchIncremented, onIncremented] = createPubSub();

const [dispatchDecremented, onDecremented] = createPubSub();

onIncremented(() => set(get() + 1));

onDecremented(() => set(get() - 1));

sub((state) => console.log(state));

dispatchIncremented(); // Prints 1.
dispatchIncremented(); // Prints 2.
dispatchDecremented(); // Prints 1.
```

You also receive the value to the previous value stored there, so you can
check if the value has changed or not since last time it was set, for example:

```ts
const [updatePlayer, onPlayerChanged, getPlayer] = createPubSub({
  name: "Player1",
  level: 5,
  life: 33,
  mana: 92,
});

onPlayerChanged((playerState, previousPlayerState) => {
  if (playerState.level > previousPlayerState.level) {
    // Player leveled up! Let's display the level-up dialog.
  }
});

updatePlayer({ ...getPlayer(), level: 6, life: 40 });
```
