import { test } from "uvu";
import assert from "uvu/assert";
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

  assert.is(getCount(), 0);

  render(<ReactButton />);

  const button = screen.getByText(/count/i);

  assert.is.not(button, null);

  fireEvent.click(button);

  assert.is(getCount(), 1);

  fireEvent.click(button);

  assert.is(getCount(), 2);
});

test.run();
