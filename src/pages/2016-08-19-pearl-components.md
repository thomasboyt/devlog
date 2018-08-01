---
layout:     post
title:      "Component-based game development in Pearl"
categories: pearl
summary:    "Some notes on how I implemented the Component pattern in my new game framework"
---

I've had the good fortune to be able to take a few months off between jobs, and I've been spending it working on a few different projects. One of them is [Pearl](https://github.com/thomasboyt/pearl), a game framework written in TypeScript.

Frameworks are always interesting side projects, because even though 95% of them end up useless to anyone other than their creator, they often result in new insights into how applications can be structured. In my case, Pearl was born from frustrations I had with [Coquette](https://github.com/maryrosecook/coquette), a microframework I'd been using for a couple years.

As the "micro" part of "microframework" implies, Coquette is really minimal, which was awesome as a new developer - it was very easy to understand, and very easy to make small games in. As I tried to make more complicated games, though, I started feeling limited by it. The biggest problem I had was that Coquette used a classical OOP model for entities in the world that wasn't very flexible. An entity was defined as a class that implemented a few hooks - a constructor, an `update()` function called every frame to update state, a `render()` function used to render the component to canvas, and a `collision()` function called whenever the entity collided with another entity.

However, problems arose when my entities started getting more complicated. I started creating base classes that entities would inherit from, sharing a bunch of stateful utility methods - for example, if I were making a Mario game, both Mario and a Goomba would inherit from some base `PlatformerPhysicsEntity`, ensuring the player stayed on platforms, had gravity applied to them, etc. And this led to some complicated code and nested inheritence chains, which is never a fun problem to deal with.

I started looking into how to solve this problem, and ran across the [Component pattern](http://gameprogrammingpatterns.com/component.html) in the excellent book *Game Programming Patterns*. The Component pattern is really simple: it simply defines an entity as a bucket of *components*, which are individual objects.

For example, in a Mario clone, you might define Mario as having the following components:

- Sprite renderer (draws the sprite)
- Platformer physics handler (applies gravity, platform collision, etc.)
- Rectangular collider (state/methods for collision detection)
- Player controller (applies player input)

And a Goomba as having the following:

- Sprite renderer
- Platformer physics handler
- Rectangular collider
- Goomba controller (enemy AI)

Components can implement hooks like entities do, so they can perform some logic on every frame, and provide some drawing code for rendering, code to run on object creation and destruction, etc.

This all sounds great in theory, but does lead to some complex problems in implementation. With a game object just being a bucket of components, you have to provide ways for components to both interact with each other - for example, the platformer physics handler needs to use the rectangular collider to detect if an entity has collided with a platform. You also have to add a way for components to interact with *other game objects*, so e.g. the player can test if it's collided with any of the goombas in the world.

Thankfully, there was lots of prior art to look at. Several popular game frameworks have implemented variants of this pattern, including XNA (now [MonoGame](http://www.monogame.net/)), [Superpowers](http://superpowers-html5.com/), and most famously, [Unity](http://unity3d.com/). What I ended up building in Pearl is very similar to Unity's implementation (though I have learned from some of Unity's mistakes - for example, I avoided implementing the [much-maligned sendMessage API](https://www.google.com/search?q=unity+sendmessage&oq=unity+sendmessage&aqs=chrome..69i57j69i58j69i60l4.1345j0j4&sourceid=chrome&ie=UTF-8)).

Here's some notes on how I've designed Pearl's component/object API, so far:

* **`getComponent()`** - This method allows components to refer to sibling components. For example, inside a `PolygonRenderer` instance, I can get the points of a sibling polygon collider with `this.getComponent(PolygonCollider).getPoints()`. The nice part about using this API in TypeScript is that it's defined as a generic that always returns an instance of the passed constructor, so it features proper type-checking like you'd expect.

  The weird part of this API is that it, of course, introduces dependencies on other components on the same object, and currently I don't have a way of specifying "hey, this object HAS to have this other component," other than just a runtime error when you go to access it. I'm thinking about adding some sort of system where you can specify what dependencies a component has, and then throwing a runtime error if a GameObject is created that uses a component and not its dependencies, but I don't know if that's worth the trouble.

* **Object tree** - I added a super-simple tree, so that each GameObject can hold child GameObjects and a reference to its parent. The biggest benefit of this is that it makes it easy to destroy an object and any related objects - for example, removing a player from a game will remove the sword they're holding.

  There's also public APIs to refer to the parent and get all children inside a component, which can be used for things like ensuring an object is rendered relative to some parent, or to move all child objects at once. I'm not super happy with these APIs in their current state, though, and have been looking into other options. I know Unity handles child a tree like this through the `Transform` component, which is interesting - it ensures entities are *always* positioned relative to their parent, among other things.

* **Tags** - An obvious question that arises when you have generic "GameObjects" is how to actually tell them apart. One way to do so would be to check to see whether they contained a given component - you could check to see where an object is an enemy by seeing if it had a `GoombaController` or a `KoopaController` or a `BowserController`, for example - but this is a relatively expensive check and could make components hard to change and refactor. Tags, which are defined on a GameObject when it's created, can be used instead for the same purpose.

  Unity has a pretty fancy interface for managing tags, but I just keep them as constants in a `Tags` file.

* **Singleton/manager objects** - This is something I'm still figuring out. In Unity, using singletons for "manager" objects is pretty common practice - you might have a top-level "GameManager" that can be reached by any part of the application. Obviously, a singleton like this is easy to misuse, but in moderation is very useful - it's nice being able to easily reference some top-level state or send a message from a component back through the rest of the application (as any React dev could tell you).

  My current thought is that, instead of using singletons, it would be better to use "root-level components" that can be easily accessed by components, like `this.pearl.rootComponents.get(GameManager)`. In practice, the "root-level components" may not actually be what your components need to reference (for example, a game might have a top-level GameManager and then a second-level LevelManager that has state about the current level). So far I've been able to just pass through manager objects as constructor arguments to components, but I'm not sure if this is the best long-term solution.

There's a lot of other architectural concerns I'm working through, but these are some of the biggest. In general, I've found this pattern to be really flexible - I've been able to write components as I write games, and then depending how generic they are, I can port them into the core Pearl repo's components. I don't know whether Pearl will end up being a successful framework, but I've learned a ton about game architecture by writing it. At the very least, I'll be very equipped for writing Unity code, considering how much I referenced its docs for help building this system.

#### Further reading

* [Pearl's codebase](https://github.com/thomasboyt/pearl)
* [*Game Programming Patterns*: Component](http://gameprogrammingpatterns.com/component.html)
* [Unity: GameObjects](https://docs.unity3d.com/Manual/GameObjects.html)