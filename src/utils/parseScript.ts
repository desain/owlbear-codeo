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
    const lines = code.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (
        lines.length > 0 &&
        lines[0].search(/^\s*\/\/\s*@CodeoScript\s*$/) >= 0
    ) {
        for (let i = 1; i < lines.length; i++) {
            const headerAttrMatch = lines[i].match(HEADER_ATTR_REGEX);
            if (headerAttrMatch && headerAttrMatch[1] && headerAttrMatch[2]) {
                // Key must be header attr since regex is defined as only matching header attrs
                const key = headerAttrMatch[1] as HeaderAttr;
                partial[key] = headerAttrMatch[2];
                continue;
            }

            const parameterMatch = lines[i].match(parameterRegex);
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

            // end of attr section
            break;
        }
    }
    return { ...partial, parameters, code };
}

/**
 * @param jsonOrCode The code to parse. Can be either a JSON representation of a script,
 * or the script source code.
 * @throws Error if the code is not valid as JSON or code with headers.
 */
export function parseJsonOrCode(jsonOrCode: string): Omit<CodeoScript, "name"> {
    try {
        const json: unknown = JSON.parse(jsonOrCode);
        if (isCodeoScript(json)) {
            return json;
        }
    } catch {
        console.log("Not json, trying to parse as code");
    }

    return parseCode(jsonOrCode);
}
if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    const SCRIPT_NAME = "Script name";
    const SCRIPT_AUTHOR = "Script author";
    const SCRIPT_DESCRIPTION = "Script description";
    const SCRIPT_VERSION = "1.0.0";

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
        function helloWorld() {
            console.log("Hello, world!");
        }`;
        const result = parseCode(code);
        expect(result.name).toBe(SCRIPT_NAME);
        expect(result.author).toBe(SCRIPT_AUTHOR);
        expect(result.description).toBe(SCRIPT_DESCRIPTION);
        expect(result.version).toBe(SCRIPT_VERSION);
        expect(result.code).toBe(code);
        expect(result.parameters).toEqual([]);
    });

    it("Should parse code with parameters", () => {
        const PARAM_1_NAME = "param1";
        const PARAM_1_TYPE = "string";
        const PARAM_1_DESCRIPTION = "Parameter 1";
        const PARAM_2_NAME = "param2";
        const PARAM_2_TYPE = "number";
        const PARAM_2_DESCRIPTION = "Parameter 2";
        const code = `// @CodeoScript
        // @param ${PARAM_1_NAME} ${PARAM_1_TYPE} ${PARAM_1_DESCRIPTION}
        // @param ${PARAM_2_NAME} ${PARAM_2_TYPE} ${PARAM_2_DESCRIPTION}
        function helloWorld(param1, param2) {
            console.log("Hello, world!");
        }`;
        const result = parseCode(code);
        expect(result.parameters.length).toBe(2);
        expect(result.parameters[0].name).toBe(PARAM_1_NAME);
        expect(result.parameters[0].type).toBe(PARAM_1_TYPE);
        expect(result.parameters[0].description).toBe(PARAM_1_DESCRIPTION);
        expect(result.parameters[1].name).toBe(PARAM_2_NAME);
        expect(result.parameters[1].type).toBe(PARAM_2_TYPE);
        expect(result.parameters[1].description).toBe(PARAM_2_DESCRIPTION);
    });
}
