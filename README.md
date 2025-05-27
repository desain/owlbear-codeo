# Owlbear Codeo

_The root of all `eval`™_

This extension allows you to manage custom user scripts for the Owlbear Rodeo VTT.

## Installing

The extension can be installed from https://owlbear-codeo.pages.dev/manifest.json.

(Eventually on a [store page](https://extensions.owlbear.rodeo/owlbear-codeo) maybe, though not yet)

## Features

-   Create and edit custom scripts directly from the extension
-   GMs can share scripts with the whole room
-   Import scripts from external sources and update them if those sources change
-   Download and upload scripts
-   Track actively running scripts

## How to use

### Installing scripts

You can add new scripts by writing them (via the + button), uploading script files previously downloaded from the extension, or via importing a script from a URL. Currently Github Gist is supported for URL imports.

Some scripts to get you started:

-   [Inversionify](https://gist.github.com/desain/38977393433dfc6242eab280abe416fa) - turns a shape into an X-ray viewer
-   [Live Line](https://gist.github.com/desain/cbfdce2b7329fcae2919a479ff1d3e44) - select two tokens and a line, and the line will move to connect the tokens even if you move them.
-   [Shake it Off](https://gist.github.com/desain/5315c2c18ba469cd85534e8c29f8abbc) - shake the screen when selected tokens move.
-   [Portal Display](https://gist.github.com/desain/e8f8f769cd32608c4d99415ad3ee9f25) - turns two shapes into portals to each other

### Writing scripts

Scripts are written in Javascript, and execute in an async function context, so you can use 'await' at the top level.

Scripts can have parameters of various types, which you can configure in the script editor. Script parameters are all optional - be sure to handle `undefined` valuees.

Scripts have access to the `OBR` object from the Owlbear Rodeo SDK, as well as the type-check functions (e.g `isImage`), and the builders (e.g `buildImage`).

If a script returns a function, the script will be marked as 'executing', and that execution will be given an ID. The script will display in the UI as running. When the user stops the script, the returned function will be called.

Scripts also have access to this object:

```typescript
interface Codeo {
    /**
     * If the script has an active execution, calls the execution's stop() function and removes
     * the execution.
     */
    stopSelf(): void;
    /**
     * If the script returns the result of this API, it will be marked as executing, just as if
     * you had returned a function.
     * @param stop Used as the function to call when the execution stops.
     * @param name Used to label the execution, to differentiate multiple copies of the script
     *             running at the same time.
     */
    continueExecution(name: string, stop: VoidFunction): NewExecution;
}
```

### Buttons

In Settings, you can enable the map context menu. This lets you create a button item that, when double-clicked, runs the selected script.

### Shortcut tool

This extension provides an optional tool that can help to run scripts more quickly with keyboard shortcuts. In Settings, enable the tool, and map some shortcuts to scripts. Then activate the tool by clicking or with the ';' shortcut, and use your script shortcuts along the top bar.

### Calling this extension from other extensions

Dump this into your extension:

```typescript
type ScriptSelector = { name: string } | { id: string };
type RunScriptMessage = ScriptSelector & {
    type: "RUN_SCRIPT";
    replyTo?: string;
    destination?: NonNullable<
        Parameters<typeof OBR.broadcast.sendMessage>[2]
    >["destination"];
};
type StopExecutionMessage = ScriptSelector &
    Readonly<{
        type: "STOP_EXECUTION";
        executionId: string;
    }>;

type RunScriptMessageResponse = Readonly<{
    executionId: string;
}>;

const codeo = (message: RunScriptMessage | StopExecutionMessage) =>
    OBR.broadcast.sendMessage("com.desain.codeo/message", message, {
        destination: "LOCAL",
    });
```

Then call the `codeo` function to send messages to your local copy of the extension.

The `replyTo` and `destination` parameters allow you to receive a reply of type `RunScriptMessage` in the `replyTo` channel. The execution ID can then be passed in a `StopExecutionMessage`.

## Support

If you need support for this extension you can message me in the [Owlbear Rodeo Discord](https://discord.com/invite/u5RYMkV98s) @Nick or open an issue on [GitHub](https://github.com/desain/owlbear-codeo/issues).

## Development

After checkout, run `pnpm install`.

## How it Works

This project is a Typescript React app using Vite.

The `action.html` page is rendered in the `renderAction.tsx` file, which calls OBR APIs to set up the context menu and installs handlers to manage auras.

UI is built using Material UI React components.

## Building

This project uses [pnpm](https://pnpm.io/) as a package manager.

To install all the dependencies run:

`pnpm install`

To run in a development mode run:

`pnpm dev`

To make a production build run:

`pnpm build`

## To do

-   Figure out a better way to pass the OBR APIs than as AsyncFunction args. https://www.totaltypescript.com/tips/turn-a-module-into-a-type?
-   https://github.com/NeilFraser/JS-Interpreter?tab=readme-ov-file?
-   Figure out a way to share scripts with yourself on different devices
    -   Firestore? (nosql)
    -   Suprabase? (postgres)
-   Favorites system
-   Script icons
-   Add simple bar for scrolls
-   More parameter types
    -   Location? Picker opens custom tool.
    -   Item list?
    -   Asset
-   Add API for setting parameters
-   Utility methods for codeo object
    -   Get item name / names
    -   Something to follow the common pattern of getting the selection, validating it, watching the targets, and when some validation passes on an update, executing some logic and updating some shared state
    -   Get item ids
    -   Vector compare
-   Move parameters to the card dropdown
-   reduce flicker when unsharing
-   figure out what to do with room metadata collisions when a player marks a room script as run
-   Use utils ObrAsyncFunction, withTimeout

## License

GNU GPLv3
