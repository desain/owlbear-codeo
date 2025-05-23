import { request } from "@octokit/request";
import OBR from "@owlbear-rodeo/sdk";
import type { CodeoScript } from "./CodeoScript";
import { parseJsonOrCode } from "./parseScript";

/**
 * @throws error if request fails
 */
export async function importScript(url: string): Promise<null | CodeoScript> {
    try {
        let name = "Imported Script";
        let author;
        let text;

        const gistMatch =
            /^https?:\/\/gist\.github\.com\/([^/]+)\/(\w+)\/?$/.exec(url);
        if (gistMatch) {
            const [, , gistId] = gistMatch;
            if (!gistId) {
                throw Error("Failed to parse gist URL");
            }
            const response = await request("GET /gists/{gist_id}", {
                gist_id: gistId,
            });
            const login = response.data.owner?.login;
            if (login) {
                author = login;
            }
            const files = Object.entries(response.data.files ?? {});
            if (files.length === 0) {
                throw new Error("Gist has no files");
            }
            for (const [filename, file] of files) {
                if (file?.content) {
                    text = file.content;
                    name = filename;
                    break;
                }
            }
            if (!text) {
                throw new Error("Could not find file in gist");
            }
        } else {
            const response = await fetch(url);
            if (!response.ok) {
                throw Error(response.statusText);
            }
            text = await response.text();
        }

        return {
            name,
            author,
            ...parseJsonOrCode(text),
            url,
        };
    } catch (error) {
        const message = `Failed to import script: ${String(error)}`;
        console.error(message);
        void OBR.notification.show(message, "ERROR");
        return null;
    }
}
