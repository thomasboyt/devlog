---
layout:     post
title:      "Bringing Manygolf to iOS, Android & Steam(?)"
categories: manygolf
summary:    "Experiments in distribution"
---

## TL;DR

I want to bring Manygolf to new platforms! I've started an iOS beta you can [sign up for now](https://docs.google.com/forms/d/e/1FAIpQLScAJAsaPGTE_elKg5MbqXgsa-W1rbrWRdDQGi-gXLBgaTM34Q/viewform), and created a [Steam Greenlight entry you can vote for here](http://steamcommunity.com/sharedfiles/filedetails/?id=751794609)! I also plan to ship an Android version soon.

## Why?

I try to treat game development as an experiment. I've found that I'm at my best when I work on projects that push me to learn and explore new concepts, whether they're related to [geometry](http://disco.zone/mode7/), [software architecture](http://devlog.disco.zone/2016/08/19/pearl-components/), or [performance optimization](http://devlog.disco.zone/2016/01/03/bipp/).

With Manygolf, I was lucky enough to create a game that functioned as a huge experiment - the first project I'd ever built with TypeScript, and the first realtime multiplayer game I'd ever made - that also turned out *fun*. While the player base has remained somewhat steady since I first published the game months ago, recent appearances on [r/webgames](https://www.reddit.com/r/WebGames/comments/4yc2wf/many_golf_multiplayer_golfing/) and [Boing Boing](https://bbs.boingboing.net/t/manygolf-simple-addictive-online-golf-game/84208) caused a spike in players, and reminded me that there was still a lot I could do for it.

There are many changes I want to make to the core game to improve it. I want to improve the (rather underthought) leaderboard system to make the game more fun with many players. I also want to improve the netcode to scale better beyond 30 or so players, and to work better on mobile devices. I plan to put together a concrete "game improvements" roadmap this week, and hope to start shipping improvements based on recent feedback very soon.

But beyond that, I want to explore bringing my games to new platforms. I've never built native mobile apps for iOS or Android before, and I've certainly never shipped a desktop game on Steam before. I'd love to bring Manygolf to these platforms by wrapping the core game in native apps.

This is both an exercise in new distribution methods as well as learning new platforms. For iOS, I've already built a small Swift wrapper, and have added a native "share" interaction to the application. I plan to do the same with Java and Android. For Steam, I've begun exploring using the Steamworks API to allow you to see your Steam friends in-game, as well as using Electron as a native wrapper application.

You can help me on my journey into unknown lands by [signing up for the iOS beta](https://docs.google.com/forms/d/e/1FAIpQLScAJAsaPGTE_elKg5MbqXgsa-W1rbrWRdDQGi-gXLBgaTM34Q/viewform) and [voting for Manygolf on Steam Greenlight](http://steamcommunity.com/sharedfiles/filedetails/?id=751794609).