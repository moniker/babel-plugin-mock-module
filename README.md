# babel-plugin-mock-module

A [babel](http://babeljs.io) plugin to rewrite modules as different modules during the Babel transpile process. It's intention is for use in test cases with difficult to mock external API calls (e.g. non-REST calls, websocket calls, etc.)

## TODO

Fix tests

## Description

## Usage

Install the plugin

```
$ npm install --save-dev babel-plugin-mock-module
```

Specify the plugin in your `.babelrc` with the custom mapping:
  - src: the partial path to which to apply the mock where the import is found
  - import: the actual import statement to mock
  - mock: the mock implementation to substitute
  
```json
{
  "plugins": [
    ["mock-module", [
      { "src": "actions/blueprints" ,"import" : "../../utils/vql", "mock": "./__tests__/mocks/vqlUtils" }
      ]]
  ]
}
```
