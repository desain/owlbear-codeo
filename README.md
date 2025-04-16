# Owlbear Codeo

_The root of all `eval`™_

This extension allows you to manage custom user scripts for the Owlbear Rodeo VTT.

## Features

TODO

## How to use

TODO

Some scripts to get you started:

-   [Inversionify](https://gist.github.com/desain/38977393433dfc6242eab280abe416fa) - turns a shape into an X-ray viewer
-   [Live Line](https://gist.github.com/desain/cbfdce2b7329fcae2919a479ff1d3e44) - select two tokens and a line, and the line will move to connect the tokens even if you move them.

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
-   Maybe? Live updating scripts (instead of storing code, they store a url, and fetch the latest code on run)
-   Script arguments that can be specified before running like in unity.
    -   Ability to duplicate scripts with arguments to allow for multiple arguments lists
-   Letter tool, with mode actions for each allowed letter, and the ability to map them to scripts?
-   Favorites system

## License

GNU GPLv3
