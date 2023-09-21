import type {
  EndpointMiddleware,
  DecodeRequestFunctionMiddleware,
} from "../../http";

export type TimezoneLocaleResult = {
  timezone: string;
  locale: string;
};

interface TimezoneLocaleSource {
  asyncGetTimezoneLocale(): Promise<TimezoneLocaleResult>;
}

export type TimezoneLocaleFunction = () => TimezoneLocaleSource;

export const newTimezoneLocaleServiceMiddleware: (
  timezoneLocaleFunc: TimezoneLocaleFunction,
) => EndpointMiddleware = (timezoneLocaleFunc) => {
  return (next) => {
    return async (context, request) => {
      const timezoneLocaleSource = timezoneLocaleFunc();
      const { timezone, locale } =
        await timezoneLocaleSource.asyncGetTimezoneLocale();

      const res = await next(context, request);
      res.value.timezone = timezone;
      res.value.locale = locale;

      return res;
    };
  };
};

export const newTimezoneLocaleDecodeMiddleware: (
  timezoneLocaleFunc: TimezoneLocaleFunction,
) => DecodeRequestFunctionMiddleware = (timezoneLocaleFunc) => {
  return (next) => {
    return async (context, request, params) => {
      const timezoneLocaleSource = timezoneLocaleFunc();
      const { timezone, locale } =
        await timezoneLocaleSource.asyncGetTimezoneLocale();

      const res = await next(context, request, params);
      res.value.timezone = timezone;
      res.value.locale = locale;

      return res;
    };
  };
};
