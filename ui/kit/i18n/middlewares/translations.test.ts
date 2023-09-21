import { describe, expect, it } from "vitest";
import {
  newTranslationDecodeMiddleware,
  newTranslationServiceMiddleware,
  type TranslationFunction,
  type TranslationResult,
} from "./translations";
import type { Context } from "../../context";

describe("i18n/middlewares/translations.ts", () => {
  it("should add timezone and locale to response", async () => {
    const mockContext = {} as Context;
    const mockRequest = {};
    const mockTranslationFunc: TranslationFunction = () => {
      return {
        asyncGetTranslation: async () =>
          ({
            example_test: "Test",
          }) as TranslationResult,
      };
    };
    const mockResponse = { value: {} };

    const middleware = newTranslationServiceMiddleware(mockTranslationFunc);
    const updatedResponse = await middleware(() =>
      Promise.resolve(mockResponse),
    )(mockContext, mockRequest);

    expect(updatedResponse.value.translations).toStrictEqual({
      example_test: "Test",
    });
  });
});

describe("timezone-locale decode request middleware", () => {
  it("should add timezone and locale to response", async () => {
    const mockContext = {} as Context;
    const mockRequest = {} as Request;
    const mockParams = {} as URLSearchParams;
    const mockTranslationFunc: TranslationFunction = () => {
      return {
        asyncGetTranslation: async () =>
          ({
            example_test: "Test example",
          }) as TranslationResult,
      };
    };
    const mockResponse = { value: {} };

    const next = newTranslationDecodeMiddleware(mockTranslationFunc);
    const updatedResponse = await next(() => Promise.resolve(mockResponse))(
      mockContext,
      mockRequest,
      mockParams,
    );

    expect(updatedResponse.value.translations).toStrictEqual({
      example_test: "Test example",
    });
  });
});
