# Create PubSub

[![NPM Version](https://img.shields.io/npm/v/create-pubsub.svg?style=flat)](https://www.npmjs.org/package/create-pubsub)
[![License](https://img.shields.io/github/license/felladrin/create-pubsub)](http://victor.mit-license.org/)

A [tiny](https://bundlephobia.com/result?p=create-pubsub) (~200B) and strongly-typed function for creating a PubSub (Event Emitter/Listener).

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
const [pub, sub] = createPubSub<Type>();
```

## Examples

The classic:

```ts
const [pub, sub] = createPubSub<string>();

sub((data) => console.log(`Hello ${data}!`));

pub("World"); // Will print 'Hello World!'
```

Name the pub and sub functions the way you want, so you don't need to rely on strings representing the events names:

```ts
const [publishGameStarted, subscribeToGameStarted] = createPubSub();
// Could also be written as:
const [gameStarted, onGameStarted] = createPubSub();
// Or as:
const [dispatchGameStarted, listenGameStartedEvent] = createPubSub();
```
