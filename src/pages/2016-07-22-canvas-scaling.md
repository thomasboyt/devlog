---
layout:     post
title:      "How to scale a <canvas>"
categories: canvas
summary:    "A problem that's way harder than it should be!"
---

Scaling the HTML canvas element is a surprisingly tricky task. There's a few different ways to do it, and browser support of all the different methods is far from universal.

Here's a completely unscaled, tiny little 80x60 canvas. It has some text rendered with `fillText()`, a sprite rendered with `drawImage()`, and a circle rendered with `arc()` and `stroke()`:

<iframe scrolling="no" class="canvas-demo" src="/resources/canvas-scaling/unscaled.html" width="80" height="64"></iframe>

Our goal is to scale this canvas to be four times its current size (320x240), with crisp text, a crisp sprite, and a crisp circle. Oh, and it should look good on retina screens. Should be easy, right?

## Scaling with CSS

Scaling a canvas with CSS is a lot like scaling an image in an editor: it simply stretches the rendered canvas out. It uses something like bilinear filtering to scale, so the output tends to be kind of "blurry". Here's an example, with the following CSS:

```css
canvas {
  width: 320px;
  height: 240px;
}
```

<iframe scrolling="no" class="canvas-demo" src="/resources/canvas-scaling/css-scale.html" width="320" height="244"></iframe>

As you can see, this isn't ideal for any of our rendering use cases. Not only are the rendered text and circles blurry, but so is our rendered sprite.

### Scaling with CSS with nearest-neighbor image scaling

While we can't significantly improve the rendering of our text and shapes with just CSS, we actually *can* drastically improve the scaling of our image. Pixelated graphics, like our little player character, are usually scaled using a *nearest-neighbor* algorithm.

Thankfully, we can fix this by applying a few different CSS rules, for different browsers:

```css
canvas {
  image-rendering: -moz-crisp-edges;    /* Firefox */
  image-rendering: -webkit-crisp-edges; /* Webkit (Safari) */
  image-rendering: pixelated;           /* Chrome */
}
```

<iframe scrolling="no" class="canvas-demo" src="/resources/canvas-scaling/css-scale-pixelated.html" width="320" height="244"></iframe>

In addition to a crisp player sprite, the text and circle are significantly less blurry. This may be all you need for your game, depending on the kind of rendering you're doing. If you're using sprites for everything, or desire a "pixelated" look for your scaled primitives, this is a pretty good option.

Unfortunately, as you might have gathered from the CSS rules above, Internet Explorer/Edge do not support this property yet (nor is it [high on their priority list](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/imagerendering)). But if you want properly-scaled images across different browsers, read on!

## Scaling the canvas context

So, we've seen that CSS properties can be used to resize the canvas, and they can even be used in some browsers to ensure that the canvas is resized using a "pixelated" scaling algorithm. However, CSS cannot be used to change the *internal resolution* of the canvas, so any primitives we draw will appear blurry or pixelated when upscaled.

To change this, we need to use the canvas context's `scale()` method. When this method is called, it tells the context that any subsequent drawing should be scaled up by some size.

So, let's scale the context in our JavaScript:

```js
ctx.scale(4, 4);
```

This tells the context to scale by 4 on the x and y axis, so the output will be 4 times larger.

We also adjust the size of the `<canvas>` object directly, so that its width and height are 4 times the original size of `80x60`:

```html
<canvas width="320" width="240"></canvas>
```

<iframe scrolling="no" class="canvas-demo" src="/resources/canvas-scaling/context-scale.html" width="320" height="244"></iframe>

Now, we've got wonderfully crisp text and circles! Unfortunately, our image is still as blurry as ever.

### Scaling the canvas context with `imageSmoothingEnabled = false`

You might think that you could apply the `image-rendering` rules from above to resize the image. However, this actually has no effect on the rendered output, because now CSS isn't in charge of scaling the canvas - the context is. Thankfully, there's yet another API we can use, and this one's quite intuitive!

The canvas context object has a property on it, `imageSmoothingEnabled`, that is, by default, enabled. As the name implies. This property decides whether rendered images are "smoothed" (rendered with a bilinear filter) or not (rendered with a nearest-neighbor/"pixelated" filter). All we have to do is change this before we render:

```js
ctx.mozImageSmoothingEnabled = false;  // firefox
ctx.imageSmoothingEnabled = false;
```

And now, ta-da, everything is crisp!

<iframe scrolling="no" class="canvas-demo" src="/resources/canvas-scaling/context-scaling-image-smoothing-disabled.html" width="320" height="244"></iframe>

## Scaling the canvas for retina screens

So, if you're looking at these examples on a retina device, you've been suffering through a lot of blurry images. Canvas, by default, doesn't scale for retina devices. Instead, we have to manually scale it, which is a little involved.

The tricky bit here is something you may have encountered if you've made high-DPI web designs before. When retina screens first appeared on devices, the concept of a *logical* pixel versus a *physical* pixel was introduced.

To understand this concept, imagine two screens: a low-DPI 400x300 screen, and a high-DPI 800x600 screen. Both screens are the same physical size, one just has a higher pixel density. If you were to render a "12px" tall font to both screens using physical pixels, the text would be half the size on the high-DPI screen.

When high-DPI screens started becoming commonplace, to avoid turning the web into a web for ants, the web gained the concept of *logical pixels*, which are used in CSS. When you say a font is "12px," what you're really saying is "make this font 12 *logical pixels* in size." The idea is that a logical pixel should be the *same physical size as a single pixel on a low-DPI screen*. So, in our hypothetical high-DPI screen, one logical pixel would correspond to two physical pixels on each axis.

The problem with canvas is that the `width` and `height` attributes of a canvas are "logical" pixels, but the internal rendering still happens at the size of physical pixels, which are then scaled up to the logical width/height - thus the bluriness.

We can fix it, though, so that we render at the proper size, and avoid blurry scaling.

We start by defining the logical width and height of our canvas, or, the size it would be on a non-retina screen:

```js
const width = 80;
const height = 60;
```

Then, get the *devicePixelRatio*, which is how many pixels on the device screen correspond to one logical pixel:

```js
const pixelRatio = window.devicePixelRatio || 1;
```

We fall back to a pixel ratio of `1` for browsers that don't support `devicePixelRatio`, though I think all the major ones do now.

Then, we resize the canvas and scale the context by the pixel ratio:

```js
canvas.width = width * pixelRatio;
canvas.height = height * pixelRatio;

canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;

// for sprites scaled up to retina resolution
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

ctx.scale(pixelRatio, pixelRatio);
```

As you can see, there is a quirk to this. We need the canvas's width and height to be the scaled size, so that when we draw the scaled image to its context, it properly fits. However, the browser, by default, wants to draw elements with `width` and `height` using logical pixels, meaning that on retina screens, our canvas would be *larger* on the screen!

So, we have to override the width and height of the canvas in CSS to resize the canvas back to its proper logical size.

And that's it. If you're on a retina device, this should be the first canvas that actually looks not blurry:

<iframe scrolling="no" class="canvas-demo" src="/resources/canvas-scaling/retina.html" width="80" height="64"></iframe>

We're almost done! But we have one problem: we want this to be `320x240`, right? Well, if we go back and adjust our code, we can make this happen:

```js
const scale = 4;

canvas.width = scale * width * pixelRatio;
canvas.height = scale * height * pixelRatio;

canvas.style.width = `${scale * width}px`;
canvas.style.height = `${scale * height}px`;

ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

ctx.scale(scale * pixelRatio, scale * pixelRatio);
```

<iframe scrolling="no" class="canvas-demo" src="/resources/canvas-scaling/retina-scaled.html" width="320" height="244"></iframe>

## Conclusion

So that's canvas scaling. It's complicated! And hard! And unfortunately involves lots of JavaScript. And these are the simple cases - if you want to have a dynamically-sized canvas, things get a lot trickier (you're gonna need a resize handler on browser windows, for one thing). But, hopefully, this is enough to get you started.
