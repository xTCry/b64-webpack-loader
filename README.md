[![npm][npm]][npm-url]
[![used by][used-by]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]

<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="120" height="120"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1><s>Native</s> Resource base64 loader</h1>
</div>


## Install

```bash
npm install --save-dev b64-loader
```

## Usage

> Loader for embedding native add-ons in projects of nodes or electrons by unpacking native add-ons and their dependencies from base64 in a temporary folder.

> :information_source: WebPack Target: Node



### Example

**index.js**
```js
import pty from "./blessed/pty.js";
export default pty;
```

**webpack.config.js**
```js
module.exports = {
  target: 'node',
  module: {
    rules: [{
      test: /\.node$/,
      loader: "b64-loader",
    }]
  }
};
```


## Options

|               Name                          |     Type                |     Default       | Description                                       |
| ------------------------------------------- | ----------------------- | ---------------- | -------------------------------------------------- |
|   **`tempDir`**                             |   `{String}`            |   `'myAddons'`    | The name of the folder in the temporary folder
|   **[`resourceDir`](#resourceDir)**         |   `{Boolean\|String}`   |   `false`         | One folder name for all addons
|   **[`grouping`](#grouping)**               |   `{Array}`             |   `[]`            | Grouping files into one folder
|   **[`dependencies`](#dependencies)**       |   `{Object}`            |   `{}`            | Save dependencies


### `resourceDir`

Type: `Boolean|String`
Default: `false`

If `true` then the resource folder will have a name by `hashName` from its path, and not by name.<br>
Otherwise, your value.

**webpack.config.js**
```js
module.exports = {
  target: 'node',
  module: {
    rules: [{
      test: /\.(node|exe|dll)$/,
      loader: "b64-loader",
      options: {
        resourceDir: true || "nameYourFolder"
      }
    }]
  }
};
```


### `grouping`

Type: `Array`
Default: `[]`

Resource folder will have a name by `hashName` from resource path...

**webpack.config.js**
```js
module.exports = {
  target: 'node',
  module: {
    rules: [{
      test: /\.(node|exe|dll)$/,
      loader: "b64-loader",
      options: {
        grouping: [
          'pty.node',
          'winpty.dll',
          'winpty-agent.exe',
        ]
      }
    }]
  }
};
```


### `dependencies`

Type: `Object`
Default: `{}`

Resource folder will have a name by `hashName` from resource path...

**webpack.config.js**
```js
module.exports = {
  target: 'node',
  module: {
    rules: [{
      test: /\.node$/,
      loader: "b64-loader",
      options: {
        tempDir: "blessedApp",
        dependencies: {
          'pty.node': [
            'winpty.dll',
            'winpty-agent.exe',
            'obj/pty/pty.obj',
          ]
        }
      }
    }]
  }
};
```



[npm]: https://img.shields.io/npm/v/b64-loader.svg?style=flat-square
[used-by]: https://img.shields.io/npm/dt/b64-loader?label=used%20by&style=flat-square
[npm-url]: https://npmjs.com/package/b64-loader

[node]: https://img.shields.io/node/v/b64-loader.svg?style=flat-square
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/xTCry/b64-webpack-laoder.svg?style=flat-square
[deps-url]: https://david-dm.org/xTCry/b64-webpack-laoder