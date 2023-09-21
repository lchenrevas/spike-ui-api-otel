import { describe, it, expect } from "vitest";
import {
  parseCommandLineArgs,
  parseKeyPairsIntoRecord,
  safeCommandLineArgsParse,
} from "./parse";
import { z } from "zod";

describe("kit/args/parse", () => {
  it("should return args", () => {
    const parsedArgs = parseCommandLineArgs([
      "ts-node",
      "./script.ts",
      "--key1=onevalue",
      "--key2=ek==",
      "--numberFlag=3",
      "--booleanFlag",
    ]);

    expect(parsedArgs).toStrictEqual({
      key1: "onevalue",
      key2: "ek==",
      numberFlag: 3,
      booleanFlag: true,
    });
  });
  it("should return boolean args", () => {
    const parsedArgs = parseCommandLineArgs([
      "ts-node",
      "./script.ts",
      "--booleanFlag",
    ]);

    expect(parsedArgs).toStrictEqual({
      booleanFlag: true,
    });
  });
  it("should return int args", () => {
    const parsedArgs = parseCommandLineArgs([
      "ts-node",
      "./script.ts",
      "--numberFlag=3",
    ]);

    expect(parsedArgs).toStrictEqual({
      numberFlag: 3,
    });
  });
  it("should return camel case arg names", () => {
    const parsedArgs = parseCommandLineArgs([
      "ts-node",
      "./script.ts",
      "--number-flag=31",
    ]);

    expect(parsedArgs).toStrictEqual({
      numberFlag: 31,
    });
  });
});

describe("safeCommandLineArgsParse", () => {
  it("should return error when data do not correspond to provided schema", () => {
    const testSchema = z.object({
      test: z.string(),
    });

    const parsedArgs = safeCommandLineArgsParse(
      ["ts-node", "./script.ts", "--test1=valueoftest1"],
      testSchema,
    );

    expect(parsedArgs).toStrictEqual({
      error: { code: 2, message: "invalid_schema_contract" },
    });
  });
});

describe("parsePairKeyValue", () => {
  it("should return record when key value pairs", () => {
    const test = parseKeyPairsIntoRecord(
      "api-header=API_KEY, other-header=othervalue",
    );

    expect(test).toStrictEqual({
      "api-header": "API_KEY",
      "other-header": "othervalue",
    });
  });
  it("should return record withour pairs with empty values", () => {
    const test = parseKeyPairsIntoRecord(
      "api-header=, other-header=othervalue",
    );

    expect(test).toStrictEqual({
      "other-header": "othervalue",
    });
  });
});
