---
layout:     post
title:      "Cached canvas rendering"
categories: canvas
summary:    "One weird trick to improve your render() function's execution time!"
---

[Manygolf](https://manygolf.club)'s rendering code is very simple: on every tick of the game's run loop, the entire game is redrawn from square one. This leads to very simple code, but, as you can imagine, uses significantly more processing time than a more advanced rendering algorithm would.

I noticed that a significant portion of my processing time was spent drawing the terrain of each level. While the level's terrain was static, it was still re-rendered on every frame, with most of the processing time tied up in actual canvas drawing operations, meaning there wasn't a lot to actually optimize to reduce the level's rendering time. Instead, I wondered if there was a way to simply render the terrain once per level, without adding significant complexity to my code.

I initially started to look into [layered canvases](http://www.ibm.com/developerworks/library/wa-canvashtml5layering/), but this seemed to add a bit more complexity than I wanted. But it did lead me to this [short MDN article](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) on canvas optimization, which starts with a much simpler suggestion:

> If you find yourself with complex drawing operations on each frame, consider creating an offscreen canvas, draw to it once (or whenever it changes) on the offscreen canvas, then on each frame draw the offscreen canvas.

Perfect! This trick makes use of a surprising (to me, at least) aspect of the `drawImage` API: a canvas can render another canvas!

```js
const mainCanvas = document.getElementById('main-canvas');
const mainCtx = mainCanvas.getContext('2d');

const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// ...draw things onto offscreenCtx here...

mainCtx.drawImage(offscreenCanvas, 0, 0);
```

The above code will draw an offscreen canvas into a canvas in our DOM tree.

It turns out, by storing this offscreen canvas, you can use the same caching trick that UI libraries like React (and React-Redux) use to help cut down on unnecessary re-rendering. Basically, if you have a pure function that always returns the same value from its arguments, you can store the arguments and result of the last call you make to it. Then, when you go to run your function with the same arguments as you've previously used, you can look up the result from the store instead of actually re-running the function. It trades processing time for memory, since you have to store the result somewhere, but memory is a lot cheaper than processing time in the single-threaded world of browser rendering.

So, inside my level-rendering code, I simply added some manual caching:

```js
// the "real" terrain rendering function
function renderTerrain(levelData) {
  const offscreenCanvas = document.createElement('canvas');
  const offscreenCtx = offscreenCanvas.getContext('2d');

  // render terrain here...

  return offscreenCanvas;
}

// use the level data as the argument to cache on
let prevLevel = null;

// store the previously-rendered
let cachedTerrainCanvas = null;

// the cached function
function renderCachedTerrain(ctx, level) {
  if (level !== prevLevel) {
    prevLevel = level;
    cachedTerrainCanvas = renderTerrain(prevLevel);
  }

  ctx.drawImage(cachedTerrainCanvas, 0, 0);
}
```

Then, in my run loop, I can call `renderCachedTerrain` as many times as I want, and as long as the level hasn't changed, it will continue to simply render the cached canvas into the on-screen canvas, which is much, much faster than running canvas drawing operations. With this One Simple Trick(tm), terrain rendering went from taking 15% of my CPU time to practically zero.

By the way, if all of that sounds like [memoization](https://en.wikipedia.org/wiki/Memoization) to you, well, it sorta is! Memoization is a more advanced version of this kind of caching where, instead of just storing the *last* call's arguments and result, you store *every previous* call's arguments and result. I didn't need to implement proper memoization for this task because there's no reason to keep a previous level's terrain in memory - in Manygolf, a new level is generated every round, so you'd never render past terrain - but I may end up implementing it for something in the future.

I built a more advanced abstraction on this, somewhat specific to Manygolf, that [you can see on GitHub here](https://github.com/thomasboyt/manygolf/compare/ba677828fa777158c2f3977119b24e2c45a6e1d8...bd77dc9ebbcc34dfe4a8943113ef51a19ed5f87e). It does some magic related to how I scale Manygolf to various screen resolutions/pixel densities, but the most important bit is `createMemoizedReducer`, which allows me to very easily wrap my existing render functions so that they're memoized. And while, again, it's not really "memoized" since it only caches the last call's arguments and result, it could be easily extended to have a larger map of args to results for functions frequently called with the same parameters.