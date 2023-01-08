import test from "node:test";
import assert from "node:assert/strict";
import { render, fireEvent, screen } from "@testing-library/react";
import { createPubSub } from "../../src/main";
import { usePubSub } from "../../src/react";

test("shows the children when the checkbox is checked", () => {
  const counterPubSub = createPubSub(0);
  const [, , getCount] = counterPubSub;

  const ReactButton = () => {
    const [count, setCount] = usePubSub(counterPubSub);

    return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
  };

  assert.equal(getCount(), 0);

  render(<ReactButton />);

  const button = screen.getByText(/count/i);

  assert.notEqual(button, null);

  fireEvent.click(button);

  assert.equal(getCount(), 1);

  fireEvent.click(button);

  assert.equal(getCount(), 2);
});
