---
layout:     post
title:      Starfields and spaghetti state
categories: blorp
summary:    In which sick-nasty level transitions are added, but at what cost to our intrepid coder's sanity?
---

In terms of sheer lines of code and features added, this was an incredibly productive day for Blorp. A few major things happened:

* I finally figured out what the "core gameplay loop" of Blorp will be. Rather than use the time mechanic I was planning on as of my last post, I've decided to instead focus on a "collection" mechanic, replacing the clock pickups with fuel. When enough fuel pickups are collected, the player character's spaceship will become fueled, and they'll be able to leave the level.
* I made some more sprites! The aforementioned spaceship, for one, though it's going to have a lot more tweaking (like, currently it doesn't shoot sick flames out the back when flying). Also, fuel cans to replace the clocks.
* I ADDED THIS DOPE STARFIELD LEVEL TRANSITION HOLY CRAP:

<iframe name='quickcast' src='http://quick.as/embed/8mpsyk8' scrolling='no' frameborder='0' width='300' allowfullscreen></iframe>

I am, of course, particularly proud of that last one, because just look at it! It almost looks like a competent game developer made it, and here at disco.zone, we strive to bring you almost-passable video games.

There were many other great strides made today, such as finally fixing the bustness of platform collision, and refactoring some ugly platforming physics code. However, not everything was so awesome.

In my haste to add these new additions, I decided to add a new class, `Session`, which holds a bunch of the current game's state. The `Game` object already does this, but the idea is that `Session` should basically be transitive and only specific to the current game, and be totally blown away when the game is restarted.

This was done previously for Monotron, where it was a ten-line class that mainly just held the current score. However, in Blorp, I decided that it should also be in charge of more complex state - mainly, the state of the current level. For example, the `Session` object holds state like "has the player collected enough fuel to activate their spaceship?" and "has the player entered their spaceship?" This still wouldn't be all that bad, except it also continues some quite-complex methods to mutate this state (for example, a method to enter the next level and a method to go into the "transition" state), which further complicates it. There's now very blurred lines between what goes in the `Session` and what goes in the `Game`, and it seems like it will only get blurrier as more polish is added to the game.

Of course, this isn't an insurmountable issue, and it pales in comparison to many of the horror stories of mutable state I've heard before. Still, I'm somewhat annoyed at myself for not thinking harder about the architecture of the game as I rolled ahead on new features. I'm sure I'll find myself paying down this technical debt soon enough.

<script src='http://quick.as/embed/script/1.04'></script>
