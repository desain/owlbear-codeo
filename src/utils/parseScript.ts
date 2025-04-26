import { filterIterator, withIndices } from "owlbear-utils";
import {
    CodeoScript,
    isCodeoScript,
    isParameterType,
    PARAMETER_TYPES,
} from "../CodeoScript";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const HEADER_ATTRS = [
    "name",
    "author",
    "description",
    "version",
] as const satisfies (keyof CodeoScript)[];
type HeaderAttr = (typeof HEADER_ATTRS)[number];
const HEADER_ATTR_REGEX = new RegExp(
    `^\\s*//\\s*@(${HEADER_ATTRS.join("|")})\\s+(.+?)\\s*$`,
);

/**
 * Parse the code and extract parameters header attributes.
 * @param code The code to parse.
 * @throws Error if the code is not valid.
 */
function parseCode(
    code: string,
): Pick<CodeoScript, "code" | "parameters"> &
    Partial<Pick<CodeoScript, HeaderAttr>> {
    const partial: Writeable<Partial<Pick<CodeoScript, HeaderAttr>>> = {};
    const parameters: CodeoScript["parameters"] = [];
    const parameterRegex = /^\s*\/\/\s*@param\s+(\w+)\s+(\w+)\s+(.+?)\s*$/;
    // Remove empty lines for parsing
    const lines = code.split(/\r?\n/);

    let codeStartIdx: number = 0;
    const nonemptyLines = filterIterator(
        withIndices(lines),
        ([line]) => line.trim() !== "",
    );

    // Check @CodeoScript header
    const firstLine = nonemptyLines.next();
    if (firstLine.done) {
        codeStartIdx = firstLine.value;
    } else if (firstLine.value[0].search(/^\s*\/\/\s*@CodeoScript\s*$/) < 0) {
        codeStartIdx = firstLine.value[1];
    } else {
        let v;
        while (true) {
            v = nonemptyLines.next();
            if (v.done) {
                codeStartIdx = v.value;
                break;
            }
            const line = v.value[0];

            // Try matching simple header attr
            const headerAttrMatch = line.match(HEADER_ATTR_REGEX);
            if (headerAttrMatch && headerAttrMatch[1] && headerAttrMatch[2]) {
                // Key must be header attr since regex is defined as only matching header attrs
                const key = headerAttrMatch[1] as HeaderAttr;
                partial[key] = headerAttrMatch[2];
                continue;
            }

            // Try matching parameter
            const parameterMatch = line.match(parameterRegex);
            if (
                parameterMatch &&
                parameterMatch[1] &&
                parameterMatch[2] &&
                parameterMatch[3]
            ) {
                const name = parameterMatch[1];
                const type = parameterMatch[2];
                const description = parameterMatch[3];

                if (isParameterType(type)) {
                    parameters.push({
                        name,
                        type,
                        description,
                    });
                } else {
                    throw new Error(
                        `Invalid parameter type "${type}" for parameter "${name}". Must be one of ${PARAMETER_TYPES.map(
                            (type) => `"${type}"`,
                        ).join(", ")}.`,
                    );
                }

                continue;
            }

            // Couldn't match anything in the header, must be start of code
            codeStartIdx = v.value[1];
            break;
        }
    }

    return {
        ...partial,
        parameters,
        code: lines.slice(codeStartIdx).join("\n"),
    };
}

export function toJsScript(script: CodeoScript): string {
    let result: string = `// @CodeoScript\n// @name ${script.name}\n`;
    const removeLineBreaks = (s: string) => s.replace(/\r?\n/g, "");
    if (script.author) {
        result += `// @author ${removeLineBreaks(script.author)}\n`;
    }
    if (script.description) {
        result += `// @description ${removeLineBreaks(script.description)}\n`;
    }
    if (script.version) {
        result += `// @version ${removeLineBreaks(script.version)}\n`;
    }
    for (const parameter of script.parameters) {
        result += `// @param ${removeLineBreaks(
            parameter.name,
        )} ${removeLineBreaks(parameter.type)} ${removeLineBreaks(
            parameter.description,
        )}\n`;
    }
    result += script.code;
    return result;
}

/**
 * @param jsonOrCode The code to parse. Can be either a JSON representation of a script,
 * or the script source code.
 * @throws Error if the code is not valid as JSON or code with headers.
 */
export function parseJsonOrCode(jsonOrCode: string): Omit<CodeoScript, "name"> {
    let json: unknown = null;
    try {
        json = JSON.parse(jsonOrCode);
    } catch {
        console.log("Not json, trying to parse as code");
    }

    if (json) {
        if (isCodeoScript(json)) {
            return json;
        } else {
            throw new Error("Invalid JSON");
        }
    }

    return parseCode(jsonOrCode);
}
if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    const SCRIPT_NAME = "Script name";
    const SCRIPT_AUTHOR = "Script author";
    const SCRIPT_DESCRIPTION = "Script description";
    const SCRIPT_VERSION = "1.0.0";
    const PARAM_1_NAME = "param1";
    const PARAM_1_TYPE = "string";
    const PARAM_1_DESCRIPTION = "Parameter 1";
    const PARAM_2_NAME = "param2";
    const PARAM_2_TYPE = "number";
    const PARAM_2_DESCRIPTION = "Parameter 2";
    const SCRIPT_CODE = 'console.log("Hello world");';

    it("Should parse code with starting empty lines", () => {
        const code = `

        // @CodeoScript
        // @name ${SCRIPT_NAME}
        `;
        const result = parseCode(code);
        expect(result.name).toBe(SCRIPT_NAME);
    });

    it("Should parse code with headers", () => {
        const code = `// @CodeoScript
        // @name ${SCRIPT_NAME}
        // @author ${SCRIPT_AUTHOR}
        // @description ${SCRIPT_DESCRIPTION}
        // @version ${SCRIPT_VERSION}
        ${SCRIPT_CODE}`;
        const result = parseCode(code);
        expect(result.name).toEqual(SCRIPT_NAME);
        expect(result.author).toEqual(SCRIPT_AUTHOR);
        expect(result.description).toEqual(SCRIPT_DESCRIPTION);
        expect(result.version).toEqual(SCRIPT_VERSION);
        expect(result.code.trim()).toEqual(SCRIPT_CODE);
        expect(result.parameters).toEqual([]);
    });

    it("Should allow gaps between headers", () => {
        const code = `// @CodeoScript

        // @name ${SCRIPT_NAME}


        // @author ${SCRIPT_AUTHOR}

        ${SCRIPT_CODE}`;

        const result = parseCode(code);

        expect(result.name).toEqual(SCRIPT_NAME);
        expect(result.author).toEqual(SCRIPT_AUTHOR);
        expect(result.code.trim()).toEqual(SCRIPT_CODE);
    });

    it("Should parse code with parameters", () => {
        const code = `// @CodeoScript
        // @param ${PARAM_1_NAME} ${PARAM_1_TYPE} ${PARAM_1_DESCRIPTION}
        // @param ${PARAM_2_NAME} ${PARAM_2_TYPE} ${PARAM_2_DESCRIPTION}`;
        const result = parseCode(code);
        expect(result.parameters).toEqual([
            {
                name: PARAM_1_NAME,
                type: PARAM_1_TYPE,
                description: PARAM_1_DESCRIPTION,
            },
            {
                name: PARAM_2_NAME,
                type: PARAM_2_TYPE,
                description: PARAM_2_DESCRIPTION,
            },
        ]);
    });

    it("Should roundtrip through parsing", () => {
        const script: CodeoScript = {
            name: SCRIPT_NAME,
            description: SCRIPT_DESCRIPTION,
            author: SCRIPT_AUTHOR,
            version: SCRIPT_VERSION,
            parameters: [
                {
                    name: PARAM_1_NAME,
                    type: PARAM_1_TYPE,
                    description: PARAM_1_DESCRIPTION,
                },
                {
                    name: PARAM_2_NAME,
                    type: PARAM_2_TYPE,
                    description: PARAM_2_DESCRIPTION,
                },
            ],
            code: SCRIPT_CODE,
        };

        const asText = toJsScript(script);
        const reparsedScript = parseCode(asText);

        expect(reparsedScript).toEqual(script);
    });

    it("Removes line breaks in descriptions", () => {
        const script: CodeoScript = {
            name: SCRIPT_NAME,
            description: "A \nmulti-line \ndescription",
            parameters: [],
            code: SCRIPT_CODE,
        };
        const asText = toJsScript(script);

        expect(asText).toEqual(
            `// @CodeoScript\n// @name ${SCRIPT_NAME}\n// @description A multi-line description\n${SCRIPT_CODE}`,
        );
    });
}
