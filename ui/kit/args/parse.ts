import { ZodType } from "zod";

const ARGUMENT_SEPARATION_REGEX = /([^=\s]+)=?\s*(.*)/;

const kebabToCamelCase = (input: string): string => {
  return input.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const parseCommandLineArgs = (argv: any[]) => {
  // Removing node/bin and called script name
  const args = argv.slice(2);

  const parsedArgs: Record<string, string | number | boolean> = {};
  let argName = "";
  let argValue: string | number | boolean = "";

  args.forEach((arg) => {
    arg = arg.match(ARGUMENT_SEPARATION_REGEX);
    arg.splice(0, 1);

    argName = arg[0];

    if (argName.indexOf("-") === 0) {
      argName = argName.slice(argName.slice(0, 2).lastIndexOf("-") + 1);
    }

    // Parse argument value or set it to `true` if empty
    if (arg[1] !== "") {
      if (parseFloat(arg[1]).toString() === arg[1]) {
        argValue = +arg[1];
      } else {
        argValue = arg[1];
      }
    } else {
      argValue = true;
    }

    const camelCaseArgName = kebabToCamelCase(argName);
    parsedArgs[camelCaseArgName] = argValue;
  });

  return parsedArgs;
};

export type Result<T> = {
  value?: T;
  error?: Error;
};

export function safeCommandLineArgsParse<T>(argv: any[], schema: ZodType<T>) {
  const parsedArgs = parseCommandLineArgs(argv);

  const parsed = schema.safeParse(parsedArgs);
  if (parsed.success) {
    return {
      value: parsed.data,
    };
  }

  // error: schema contract is invalid.
  return {
    error: {
      code: 2,
      message: "invalid_schema_contract",
    },
  };
}

export function parsePairKeyValue(entry: string, keyPairSeparator?: string) {
  const propertiesSeparator = ";";
  const keyPairSep = keyPairSeparator || "=";
  const valueProps = entry.split(propertiesSeparator);
  if (valueProps.length <= 0) return;
  const keyPairPart = valueProps.shift();
  if (!keyPairPart) return;
  const separatorIndex = keyPairPart.indexOf(keyPairSep);
  if (separatorIndex <= 0) return;
  const key = decodeURIComponent(
    keyPairPart.substring(0, separatorIndex).trim(),
  );
  const value = decodeURIComponent(
    keyPairPart.substring(separatorIndex + 1).trim(),
  );
  return { key, value };
}

export function parseKeyPairsIntoRecord(
  value?: string,
  pairsSeparator?: string,
  keyPairSeparator?: string,
): Record<string, string> {
  let pairsSep = pairsSeparator || ",";
  let keyPairSep = keyPairSeparator || "=";
  if (typeof value !== "string" || value.length === 0) return {};
  return value
    .split(pairsSep)
    .map((entry) => {
      return parsePairKeyValue(entry, keyPairSep);
    })
    .filter((keyPair) => keyPair !== undefined && keyPair.value.length > 0)
    .reduce<Record<string, string>>((headers, keyPair) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      headers[keyPair!.key] = keyPair!.value;
      return headers;
    }, {});
}
