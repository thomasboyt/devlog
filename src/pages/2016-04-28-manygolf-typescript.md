---
layout:     post
title:      "Manygolf and TypeScript"
categories: manygolf
summary:    "A summary of the long and arduous road to setting up a TypeScript + Babel + Webpack build system."
---

As I detailed in [my last post](/2016/04/18/manygolf), I chose to build my newest project, [Manygolf](http://manygolf.disco.zone), using [TypeScript](http://www.typescriptlang.org/). TypeScript, if you're not familiar, is a superset of JavaScript that includes static typing, developed at Microsoft.

Typed JavaScript has always been interesting to me, especially for games. While I don't always find myself wanting types while doing "normal" web development projects, there are lots of reasons why I think games lend themselves to static typing:

- Developing games usually involves working with browser APIs such as [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) or the APIs of third-party libraries like [p2](https://github.com/schteppe/p2.js) that I don't have as well-memorized as libraries I use for every day development. Having type checking on function params and return values is very useful here. I don't have to worry about looking up whether, say, p2 stores positions as a two-point array or an object with `x` and `y` fields - my editor well yell at me if I get mixed up.
- Games are often hard to test due to the complexity of interacting systems. Obviously, type guarantees aren't a replacement for tests, but can at least help somewhat in making certain guarantees in untested logic.
- Games often contain a lot of state in a lot of places that is hard to keep track of, and having type guarantees means I won't forget where and how I've stored state.

In the past, I've used Facebook's TypeScript alternative, [Flow](http://flowtype.org/), to help me build games with [Coquette](http://coquette.maryrosecook.com/). Both [Monotron](https://discozone.itch.io/monotron) and my platformer prototype [Blorp](http://disco.zone/blorp/) were built with Flow. I found Flow easy to integrate into an existing build pipeline - the "compiler" is simply a Babel transform - and it was very useful in a "closed system" where I wasn't worrying too much about external libraries. I didn't have to worry about the lack of useful third-party Flow type definitions, since I wasn't using any libraries beyond Coquette, which was rather easy to write my own definitions for (or simply not annotate).

However, for Manygolf, I wanted to use many libraries that had TypeScript definitions but not Flow definitions, including p2 and [Immutable.js](https://facebook.github.io/immutable-js/) (which, to be fair, has recently added Flow support). TypeScript has a huge community repository of Immutable type definitions, and some libraries, including Immutable and p2, even maintain type definitions officially.

Thus, it seemed like TypeScript would be a solid option. I was rather disappointed, however, to find that TypeScript was pretty difficult to set up in an existing build pipeline. I thought I'd document how I added TypeScript to Manygolf, a universal JS app with both a server and client.

## Adding TypeScript to a Babel+Webpack Setup

Before I introduced TypeScript to Manygolf, I was already using Webpack and Babel to build. On the server, I was being lazy and just using the babel-runtime transform to compile the server code when I ran, which ended up being an issue later. On the client, a Webpack watcher compiled the app using a pretty standard config:

```js
var createVendorChunk = require('webpack-create-vendor-chunk');

module.exports = {
  entry: {
    app: './src/client/main.js',
  },

  output: {
    path: './build/',
    filename: '[name].bundle.js'
  },

  plugins: [
    createVendorChunk()
  ],

  resolve: {
    alias: {
      '__root': process.cwd(),
    },
  },

  devtool: 'source-map',

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules\/)/,
        loader: 'babel-loader',
      },
    ]
  },

  // (snip dev server config and more asset loaders...)
};
```

When I started trying to add TypeScript to the project, I was taken aback about how opinionated its default configuration is. TypeScript seems to expect that you want to build code through your *editor*. I guess this makes sense if you're used to big ol' IDEs like Visual Studio that control every step of your workflow, but as someone who was used to building projects with terminal commands open in tmux splits, this didn't set well with me. I didn't want to be locked into some specific editor to build my application (whether VS, or Atom, or Vim and a whole bunch of plugins).

Not only that, but TypeScript seems to think that it should be your *only* compiler. It can compile ES6 to ES5 on its own, which is rather pointless in 2016 now that Babel exists. I suppose I could see this being useful if I had a fully-TypeScript project and didn't want to introduce Babel, but given that I was adopting TypeScript in an existing project, I didn't want to break my existing Babel compilation step. Plus, [Babel sticks much closer to the ES6 spec than TypeScript](https://news.ycombinator.com/item?id=11581954), making it a safer option.

## Step One: Installing Things

First up, I had to grab the ts-loader plugin for Webpack and the TypeScript compiler:

```
npm install --save-dev typescript ts-loader
```

Then I had to install the [typings](https://github.com/typings/typings) tool. Typings is basically a package manager for TypeScript type definitions. Theoretically, packages can ship with typings defined in by a field in `package.json`, but very few packages do this. Instead, you have to search for definitions:

```
$ typings search redux

NAME                            SOURCE HOMEPAGE                                                   DESCRIPTION UPDATED                  VERSIONS
redux                           npm    https://www.npmjs.com/package/redux                                    2016-02-14T19:48:20.000Z 1
redux                           dt     https://github.com/rackt/redux                                         2016-03-26T11:26:56.000Z 1
...
```

Now, if you're looking at this and thinking "gee, sure is weird that there are two different definitions:" apparently, definitions can either be specified by (a) an NPM package's package.json field having a "typings" field that defines a file of definitions, or (b) a third-party type definition on DefinitelyTyped. Either way, you have to run either:

```
# get the npm definition
$ typings install --save redux
# or for the dt definition
$ typings install --save --ambient redux
```

Passing `--save` will save the type definition to `typings.json`, kinda like `npm install --save`. Theoretically this would save you from vendoring your third-party definitions inside your repo, but I'm still doing that because I don't trust this typings thing and because everyone else seems to do that anyways.

I used the DefinitelyTyped definition since the official Redux one was missing a bunch of things. It's probably better on master now, I dunno.

As an aside,  while I get why you'd use this for DefinitelyTyped definitions, I'm not really sure *why* you'd have to use `typings install` for packages on NPM, considering that TypeScript is *supposed* to be able to just look at the package.json itself and get the type definitions, instead of this Typings thing having to install it. But if I try to just use Redux without installing the definition through typings, it says it can't find the Redux module. Maybe this is a ts-loader bug? It also has issues with other packages that Atom's TypeScript plugin can find just fine, so I'm going with that.

## Step Two: tsconfig.json

With TypeScript and type definitions installed, we add a `tsconfig.json` file to our project root:

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "es2015",
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "noEmit": true,
    "outDir": "tmp-see-ts-loader-issue-171"
  },
  "compileOnSave": false,
  "exclude": [
    "node_modules",
    "typings/main.d.ts",
    "typings/main"
  ]
}
```

This thing took forever for me to figure out, so I'll break it down a line at a time.

* `target`: This specifies the language version you want to output. We want to compile our JavaScript from ES6 to ES5 with *Babel*, not Webpack, so we use `"es6"` instead of the `"es5"` default.

* `module`: This is the module format that Webpack compiles to. Again, since we're using Babel for compilation, we just compile to `"es2015"` modules, as Babel will take care of compiling that to CommonJS that Webpack can understand.

* `allowJs`: This is a weird one. This new option allows the compiler to, well, "compile" JavaScript. Without this, JavaScript files can't be imported from TypeScript files without creating a type definition for each file. This is basically required to be able to incrementally port a JavaScript application. It's a new option, though, and breaks a few things, which we'll see below.

* `allowSyntheticDefaultImports`: This is the first "optional" setting in this config, but one I think you'll probably want.

  Without this setting, when you import a CommonJS package, TypeScript's module system will treat that module's export object as a list of bindings instead of a single default export, so you have to do:

  ```js
  import * as React from 'react';
  ```

  If you enable this option, you'll be able to import things as you'd be used to in e.g. Babel:

  ```js
  import React from 'react';
  ```

* `sourceMap`: Fairly self-explanatory, this will output source maps for each file. Babel seems to correctly consume these and update them so the final source maps are fine.

* `noEmit`: This prevents any *editor* integration using this file from emitting (writing out) files, since obviously Webpack handles that. We'll override this in the Webpack config below.

* `outDir`: Remember how I said `allowJs` breaks some things? `outDir` is usually supposed to specify a folder you build your files to, but we're actually using it here to work around this [annoying ts-loader bug](https://github.com/TypeStrong/ts-loader/issues/171).

* `compileOnSave`: This option signals editors that they shouldn't, uh, compile on save. Pretty simple. I think if you have `noEmit` set, you may not need this, but I have it defined just in case.

* `exclude`: We exclude `node_modules` from being compiled here. We also exclude one set of `typed` definitions from being included: typed has both a "main" and "browser" set of typings. Currently we're using the "browser" set in both because I'm lazy and haven't found any downside yet, but I suppose this could be overridden in `webpack/server.js` (below) if I wanted to use the `main` set in the server-side build.

Phew, and people say that *Webpack* is hard to configure. Speaking of which...

## Step Three: Building the Client with Webpack

Thankfully, adding TypeScript to our client build code isn't too hard. Here's the major additions, working from the file above:

```js
module.exports = {
  // ...

  resolve: {
    extensions: ['', '.jsx', '.js', '.tsx', '.ts'],
  },

  ts: {
    compilerOptions: {
      noEmit: false,
    },
  },

  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loaders: ['babel', 'ts']
      },

      {
        test: /\.js$/,
        exclude: /(node_modules\/)/,
        loader: 'babel-loader',
      },
    ]
  },

  // ...
};
```

We tell Webpack's bundle to allow `import foo from './foo` to look for `foo.ts` as well as `foo.js`, and override that `noEmit` option so that we actually emit JavaScript from Webpack. We then add a loader config that builds `.ts` files through TypeScript, then Babel. Easy!

At this point, we can run `webpack-dev-server`, and client code basically works. However, remember how I said this was a universal app? We have another part to worry about...

## Step Four: Building the Server (!) with Webpack

So, manygolf isn't the first universal app I've built, but thus far, I've managed to avoid building server-side code through Webpack by using that babel runtime transform that I mentioned before. However, there is no simple TypeScript runtime transformer for Node, or if there is, I can't find it. Besides, runtime transformers are kind of a hack, and it's nice to be able to deploy "built" code and not have to install TypeScript/Babel on your server.

So, I added a special `server.js` Webpack config, using [@jlongster](https://twitter.com/jlongster)'s [excellent guide](http://jlongster.com/Backend-Apps-with-Webpack--Part-I). This was *shockingly* easy. Basically, you can use a code snippet to tell Webpack "don't actually bundle any of my node_modules imports", tell it you're targeting Node, add a little line of code to the top of the file to integrate source maps, and you're set.

The server-side webpack config is [here](https://github.com/thomasboyt/manygolf/blob/master/webpack/server.js). Now, to run the server, I can just run:

```
webpack --config webpack/server.js && node bin/server
```

In practice, I've written a couple of scripts to make running the server in development easier: [server-watch](https://github.com/thomasboyt/manygolf/blob/master/scripts/server-watch), which rebuilds and restarts the server when I save files, and [test-watch](https://github.com/thomasboyt/manygolf/blob/master/scripts/test-watch), which automatically builds and runs the tests through Mocha when I save files. These both use the Webpack watcher, instead of any other pipeline, so they can build incrementally and only if files actually in the bundle are changed.

## Step Five: Editor Config with Atom

So now Webpack is building the server and client code through TypeScript, awesome! There is one last step: editor configuration!

I chose to give Atom a shot, since it seemed to have a pretty mature TypeScript plugin. I've been a Vim user for the past few years, but I've never really learned to properly use a lot of its more "IDE-like" features, and I wanted something with a graphical interface that'd be a bit easier to learn. I'm sure Vim's TypeScript plugins are just as powerful, but I really didn't want to have to learn 8000 new key bindings and commands.

There's not a lot to say about setting up Atom - install `atom-typescript`, and things should pretty much Just Work.

## Conclusion

Babel and TypeScript are not an easy combination to get up and running with, and I wish there was better documentation on TypeScript site about using them together. Given TypeScript's roots were long before Babel's, I understand why TypeScript is such a heavyweight compiler, but I hope some day it can be as easy to use with Babel as Flow is. Hopefully, this post helps someone out who's curious about giving TypeScript a shot but doesn't know how to get it set up.
