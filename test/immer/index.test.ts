import test from "node:test";
import assert from "node:assert/strict";
import { createImmerPubSub } from "../../src/immer";

test("the example from readme.md", () => {
  const [updateColorsList, onColorsListUpdated, getColorsList] =
    createImmerPubSub([
      { name: "White", code: { r: 255, g: 255, b: 255 } },
      { name: "Gray", code: { r: 128, g: 128, b: 128 } },
    ]);

  onColorsListUpdated((currentColorsList, previousColorsList) => {
    assert.deepEqual(currentColorsList, [
      { name: "White", code: { r: 255, g: 255, b: 255 } },
      { name: "Green", code: { r: 0, g: 128, b: 0 } },
    ]);

    assert.deepEqual(previousColorsList, [
      { name: "White", code: { r: 255, g: 255, b: 255 } },
      { name: "Gray", code: { r: 128, g: 128, b: 128 } },
    ]);
  });

  updateColorsList((colorsList) => {
    const color = colorsList.find((color) => color.name === "Gray");
    if (color) {
      color.name = "Green";
      color.code.r = 0;
      color.code.b = 0;
    }
  });

  assert.deepEqual(getColorsList(), [
    { name: "White", code: { r: 255, g: 255, b: 255 } },
    { name: "Green", code: { r: 0, g: 128, b: 0 } },
  ]);
});

test("changing properties of an object from an array", () => {
  const [updatePlayersList, onPlayersListUpdated, getPlayersList] =
    createImmerPubSub([
      { name: "Player0", alive: true, color: { r: 0, g: 0, b: 0 } },
      { name: "Player1", alive: false, color: { r: 255, g: 255, b: 255 } },
    ]);

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

  updatePlayersList((updatedPlayersList) => {
    updatedPlayersList[0].name = "Player3";
    updatedPlayersList[0].alive = false;
    updatedPlayersList[0].color.r = 128;
    updatedPlayersList[0].color.g = 64;

    updatedPlayersList[1].alive = true;
  });

  assert.deepEqual(getPlayersList(), [
    { name: "Player3", alive: false, color: { r: 128, g: 64, b: 0 } },
    { name: "Player1", alive: true, color: { r: 255, g: 255, b: 255 } },
  ]);
});
