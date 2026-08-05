import { describe, it, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import * as react from "react";
import { renderToString } from "react-dom/server";
import {
	render,
	fireEvent,
	screen,
	act,
	cleanup,
} from "@testing-library/react";
import { createPubSub } from "../../src/main";
import { usePubSub } from "../../src/react";

describe("react", () => {
	afterEach(cleanup);
	it("increments the counter when the button is clicked", () => {
		const counterPubSub = createPubSub(0);
		const [, , getCount] = counterPubSub;

		const ReactButton = () => {
			const [count, setCount] = usePubSub(counterPubSub);

			return (
				<button onClick={() => setCount(count + 1)}>Count: {count}</button>
			);
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

	it("publishing from outside React triggers a re-render", async () => {
		const counterPubSub = createPubSub(0);
		const [publish] = counterPubSub;

		const Display = () => {
			const [count] = usePubSub(counterPubSub);

			return <div data-testid="count">Count: {count}</div>;
		};

		render(<Display />);

		assert.equal(screen.getByTestId("count").textContent, "Count: 0");

		await act(async () => {
			publish(5);
		});

		assert.equal(screen.getByTestId("count").textContent, "Count: 5");
	});

	it("unmounting unsubscribes", async () => {
		const counterPubSub = createPubSub(0);
		const [publish, subscribe, get] = counterPubSub;

		let liveSubscriptions = 0;

		const tracked = [
			publish,
			(handler: Parameters<typeof subscribe>[0]) => {
				liveSubscriptions++;
				const unsubscribe = subscribe(handler);
				return () => {
					liveSubscriptions--;
					unsubscribe();
				};
			},
			get,
		] as typeof counterPubSub;

		const Subscriber = () => {
			const [count] = usePubSub(tracked);
			return <div data-testid="count">Count: {count}</div>;
		};

		const { unmount } = render(<Subscriber />);

		assert.equal(liveSubscriptions, 1);

		await act(async () => {
			publish(1);
		});

		assert.equal(liveSubscriptions, 1);

		unmount();

		assert.equal(liveSubscriptions, 0);
	});

	it("StrictMode double-mount does not leak subscriptions", () => {
		const counterPubSub = createPubSub(0);
		const [publish, subscribe, get] = counterPubSub;

		let liveSubscriptions = 0;
		let totalSubscriptions = 0;

		const tracked = [
			publish,
			(handler: Parameters<typeof subscribe>[0]) => {
				totalSubscriptions++;
				liveSubscriptions++;
				const unsubscribe = subscribe(handler);
				return () => {
					liveSubscriptions--;
					unsubscribe();
				};
			},
			get,
		] as typeof counterPubSub;

		const Display = () => {
			const [count] = usePubSub(tracked);
			return <div data-testid="count">Count: {count}</div>;
		};

		const { unmount } = render(
			<react.StrictMode>
				<Display />
			</react.StrictMode>,
		);

		// StrictMode mounts twice, so subscribe is called twice, but cleanup
		// runs between mounts, leaving one live subscription
		assert.equal(
			totalSubscriptions,
			2,
			"StrictMode should double-invoke subscribe",
		);
		assert.equal(liveSubscriptions, 1);

		unmount();

		assert.equal(liveSubscriptions, 0);
	});

	it("catches a publish that lands before the subscription effect runs", () => {
		const counterPubSub = createPubSub(0);
		const [publish] = counterPubSub;

		const Publisher = () => {
			react.useEffect(() => {
				publish(42);
			}, []);
			return null;
		};

		const Display = () => {
			const [count] = usePubSub(counterPubSub);
			return <div data-testid="count">Count: {count}</div>;
		};

		render(
			<div>
				<Publisher />
				<Display />
			</div>,
		);

		assert.equal(screen.getByTestId("count").textContent, "Count: 42");
	});

	it("stores function values instead of invoking them as updaters", async () => {
		const handlerPubSub = createPubSub<() => void>(() => {});
		const [publish, , get] = handlerPubSub;

		let observed: unknown;

		const Display = () => {
			const [handler] = usePubSub(handlerPubSub);
			observed = handler;
			return null;
		};

		render(<Display />);

		const next = () => {};

		await act(async () => {
			publish(next);
		});

		assert.equal(observed, next);
		assert.equal(get(), next);
	});

	it("renders on the server without throwing", () => {
		const counterPubSub = createPubSub(7);

		const Display = () => {
			const [count] = usePubSub(counterPubSub);
			return <div>Count: {count}</div>;
		};

		const html = renderToString(<Display />);
		assert.match(html, /Count:.*?7/);
	});
});
