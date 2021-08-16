# Create PubSub

[![NPM Version](https://img.shields.io/npm/v/create-pubsub.svg?style=flat)](https://www.npmjs.org/package/create-pubsub)
[![Size](https://img.badgesize.io/https:/unpkg.com/create-pubsub/dist/create-pubsub.js?compression=gzip)](https:/unpkg.com/create-pubsub/dist/create-pubsub.js)
[![Types](https://img.shields.io/npm/types/create-pubsub)](https://www.npmjs.org/package/create-pubsub)
[![License](https://img.shields.io/github/license/felladrin/create-pubsub)](http://victor.mit-license.org/)

A tiny and strongly-typed function for creating a PubSub (Event Emitter/Listener).

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

```ts
const [pub, sub] = createPubSub<string>();

sub((data) => console.log(`Hello ${data}!`));

pub("World"); // Will print 'Hello World!'
```

Name the 'pub' and 'sub' functions as you wish. The idea is to avoid relying on strings representing the events names. The following snipped shows different ways to name an event which represents the game ready:

```ts
const [publishGameStarted, subscribeToGameStarted] = createPubSub();

const [gameStarted, onGameStarted] = createPubSub();

const [dispatchGameStarted, listenGameStartedEvent] = createPubSub();
```

You can also publish events with no data:

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

publish(1); // Will print 1.
publish(2); // Will print 2 and unsubscribe.
publish(3); // Nothing will be printed.
```
