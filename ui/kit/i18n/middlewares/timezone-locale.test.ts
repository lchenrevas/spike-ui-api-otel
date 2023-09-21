import { describe, expect, it } from "vitest";
import {
  newTimezoneLocaleDecodeMiddleware,
  newTimezoneLocaleServiceMiddleware,
  type TimezoneLocaleFunction,
  type TimezoneLocaleResult,
} from "./timezone-locale";
import type { Context } from "../../context";

describe("timezone-locale service middleware", () => {
  it("should add timezone and locale to service response", async () => {
    const mockContext = {} as Context;
    const mockRequest = {};
    const mockTimezoneLocaleFunc: TimezoneLocaleFunction = () => {
      return {
        asyncGetTimezoneLocale: async () =>
          ({
            timezone: "America/New_York",
            locale: "en-US",
          }) as TimezoneLocaleResult,
      };
    };
    const mockResponse = { value: {} };

    const middleware = newTimezoneLocaleServiceMiddleware(
      mockTimezoneLocaleFunc,
    );
    const updatedResponse = await middleware(() =>
      Promise.resolve(mockResponse),
    )(mockContext, mockRequest);

    expect(updatedResponse.value.timezone).toEqual("America/New_York");
    expect(updatedResponse.value.locale).toEqual("en-US");
  });
});

describe("timezone-locale decode request middleware", () => {
  it("should add timezone and locale to decode request response", async () => {
    const mockContext = {} as Context;
    const mockRequest = {} as Request;
    const mockParams = {} as URLSearchParams;
    const mockTimezoneLocaleFunc: TimezoneLocaleFunction = () => {
      return {
        asyncGetTimezoneLocale: async () =>
          ({
            timezone: "Europe/Rome",
            locale: "it-IT",
          }) as TimezoneLocaleResult,
      };
    };
    const mockResponse = { value: {} };

    const next = newTimezoneLocaleDecodeMiddleware(mockTimezoneLocaleFunc);
    const updatedResponse = await next(() => Promise.resolve(mockResponse))(
      mockContext,
      mockRequest,
      mockParams,
    );

    expect(updatedResponse.value.timezone).toEqual("Europe/Rome");
    expect(updatedResponse.value.locale).toEqual("it-IT");
  });
});
