import { describe, expect, it } from "vitest";
import { newTranslate } from "./translate";

describe("translate", () => {
  it("should return key as translation when no messages", () => {
    const translate = newTranslate({});

    const result = translate({ key: "translation" });
    expect(result).toBe("translation");
  });
  it("should return key as translation when no translation found", () => {
    const translate = newTranslate({
      messages: {
        hello: "ciao",
        goodbye: "arrivederci",
      },
    });
    const result = translate({ key: "goodmorning" });
    expect(result).toBe("goodmorning");
  });
  it("should return translation result", async () => {
    const translate = newTranslate({
      messages: {
        sun: "sole",
        goodbye: "arrivederci",
      },
    });

    const result = translate({ key: "sun" });
    expect(result).toBe("sole");
  });
});
