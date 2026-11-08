import { describe, expect, it } from "vitest";
import { checkContentPack } from "../core";
import { audioUrl, korean } from "./packs";

describe("the content check on the real content packs", () => {
  it("finds no problems in the Korean pack", () => {
    const audioExists = (path: string) => audioUrl(korean, path) !== undefined;

    expect(checkContentPack(korean, audioExists)).toEqual([]);
  });
});
