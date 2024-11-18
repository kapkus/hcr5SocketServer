## runtime environment
plugin runs on node 6.11.5

## enabling plugin
1. Install all required utilities mentioned in runtime environment
2. Run babel transpilation ``` npm run build ``` to generate ./dist directory
3. Place project in plugins directory inside RODI

## development
Place this repository in **plugins.dev** directory, then run ``` npm run watch ``` so each change causes transpilation of ./src code. To see any changes you have to restart RODI app.

