const PLUGIN_ID = "com.desain.codeo";

// Metadata
export const METADATA_SCRIPT_ID_KEY = `${PLUGIN_ID}/scriptId`;
export const METADATA_EXECUTION_ID_KEY = `${PLUGIN_ID}/executionId`;
export const METADATA_KEY_ROOM_METADATA = `${PLUGIN_ID}/roomMetadata`;

// Modals and popovers
export const MODAL_EDIT_SCRIPT_ID = `${PLUGIN_ID}/modalEditScript`;
export const POPOVER_ADD_BUTTON_ID = `${PLUGIN_ID}/popoverAddButton`;
export const POPOVER_SETTINGS_ID = `${PLUGIN_ID}/popoverSettings`;
export const SCRIPT_ID_PARAM = "scriptId";
export const LOCATION_X_PARAM = "x";
export const LOCATION_Y_PARAM = "y";

// Messaging
export const MESSAGE_CHANNEL = `${PLUGIN_ID}/message`;

// Storage
export const LOCAL_STORAGE_STORE_NAME = `${PLUGIN_ID}/localStorage`;

// Context menu
export const CREATE_BUTTON_CONTEXTMENU_ID = `${PLUGIN_ID}/createButton`;

// Tool
export const SHORTCUT_TOOL_ID = `${PLUGIN_ID}/shortcutTool`;
export const SHORTCUT_TOOL_ACTION_ID_PREFIX = `${SHORTCUT_TOOL_ID}/action/`;
export const SHORTCUT_OPTIONS = [
    // "a", // may collide with other extensions
    "b",
    "c",
    // d used for drawing
    "e",
    // f used for fog
    "g",
    // h used for hide when item selected
    // l used for lock when item selected
    // m used for measure
    "n",
    "o",
    "p",
    // q used for pointer
    "r",
    // s used for select
    // t used for text
    // "u", // may collide with other extensions
    "v",
    // w used for hand
    "x",
    // "y", // may collide with other extensions
    // "z", // may collide with other extensions (segmentable ruler)
] as const;
export type Shortcut = (typeof SHORTCUT_OPTIONS)[number];
export function isShortcut(shortcut: string): shortcut is Shortcut {
    const shortcutOptions2: readonly string[] = SHORTCUT_OPTIONS;
    return shortcutOptions2.includes(shortcut);
}
