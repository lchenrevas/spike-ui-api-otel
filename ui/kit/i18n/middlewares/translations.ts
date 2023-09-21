import type {
  EndpointMiddleware,
  DecodeRequestFunctionMiddleware,
} from "../../http";

export type TranslationResult = Record<string, string>;

interface TranlationSource {
  asyncGetTranslation(): Promise<TranslationResult>;
}

export type TranslationFunction = () => TranlationSource;

export const newTranslationServiceMiddleware: (
  translationFunc: TranslationFunction,
) => EndpointMiddleware = (translationFunc) => {
  return (next) => {
    return async (context, request) => {
      const translationSource = translationFunc();
      const translations = await translationSource.asyncGetTranslation();

      const res = await next(context, request);
      res.value.translations = translations;

      return res;
    };
  };
};

export const newTranslationDecodeMiddleware: (
  translationFunc: TranslationFunction,
) => DecodeRequestFunctionMiddleware = (translationFunc) => {
  return (next) => {
    return async (context, request, params) => {
      const translationSource = translationFunc();
      const translations = await translationSource.asyncGetTranslation();

      const res = await next(context, request, params);
      res.value.translations = translations;

      return res;
    };
  };
};
