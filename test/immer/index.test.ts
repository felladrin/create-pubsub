import { test } from "uvu";
import assert from "uvu/assert";
import { createImmerPubSub } from "../../src/immer";

test("the example from readme.md", () => {
  const [updateColorsList, onColorsListUpdated, getColorsList] =
    createImmerPubSub([
      { name: "White", code: { r: 255, g: 255, b: 255 } },
      { name: "Gray", code: { r: 128, g: 128, b: 128 } },
    ]);

  onColorsListUpdated((currentColorsList, previousColorsList) => {
    assert.equal(currentColorsList, [
      { name: "White", code: { r: 255, g: 255, b: 255 } },
      { name: "Green", code: { r: 0, g: 128, b: 0 } },
    ]);

    assert.equal(previousColorsList, [
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

  assert.equal(getColorsList(), [
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
    assert.equal(currentPlayersList, [
      { name: "Player3", alive: false, color: { r: 128, g: 64, b: 0 } },
      { name: "Player1", alive: true, color: { r: 255, g: 255, b: 255 } },
    ]);
    assert.equal(previousPlayersList, [
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

  assert.equal(getPlayersList(), [
    { name: "Player3", alive: false, color: { r: 128, g: 64, b: 0 } },
    { name: "Player1", alive: true, color: { r: 255, g: 255, b: 255 } },
  ]);
});

test.run();
