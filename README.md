# Owlbear Codeo

_The root of all `eval`™_

This extension allows you to manage custom user scripts for the Owlbear Rodeo VTT.

## Features

-   Create and edit custom scripts directly from the extension
-   Import scripts from external sources and update them if those sources change
-   Download and upload scripts
-   Track actively running scripts

## How to use

TODO

### Installing scripts

TODO

Some scripts to get you started:

-   [Inversionify](https://gist.github.com/desain/38977393433dfc6242eab280abe416fa) - turns a shape into an X-ray viewer
-   [Live Line](https://gist.github.com/desain/cbfdce2b7329fcae2919a479ff1d3e44) - select two tokens and a line, and the line will move to connect the tokens even if you move them.

### Writing scripts

TODO

Script parameters are all optional - be sure to handle `undefined` valuees.

Scripts have access to the `OBR` object from the Owlbear Rodeo SDK, as well as the type-check functions (e.g `isImage`), and the builders (e.g `buildImage`).

Scripts also have access to this object:

```typescript
interface Codeo {
    /**
     * If the script has an active execution, calls the execution's stop() function and removes
     * the execution.
     */
    stopSelf(): void;
}
```

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
type StopExecutionMessage = ScriptSelector & {
    type: "STOP_EXECUTION";
    executionId: string;
};

interface RunScriptMessageResponse {
    executionId: string;
}

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

-   Figure out a better way to pass the OBR APIs than as AsyncFunction args
-   Figure out a way to share scripts with others in the room, or with yourself on different devices

    -   Player metadata: goes away when you leave
    -   Local storage: Doesn't sync between devices
    -   Room metadata: 16KB limit shared between extensions, not good for large text like scripts
        -   Store urls in metadata and load all on extension load?

-   Ability to duplicate scripts with arguments to allow for multiple arguments lists
-   Letter tool, with mode actions for each allowed letter, and the ability to map them to scripts?
-   Favorites system
-   Script icons
-   Gist API to get latest version
-   Add simple bar for scrolls
-   More parameter types
    -   Item
    -   Location

## License

GNU GPLv3
