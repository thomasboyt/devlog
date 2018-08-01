---
layout:     post
title:      "Adding user persistence to Manygolf"
categories: manygolf
summary:    "Technical and design notes on how I'm adding player accounts to Manygolf"
---

As I noted in my previous post on [Steam Greenlight and mobile releases](http://devlog.disco.zone/2016/08/30/manygolf-steam-ios/), Manygolf's beginnings as a tech demo have led to me having to revaluate it as people actually *play* it. I never actually *designed* Manygolf, per se, instead ripping off its core gameplay from the addictive ghost-multiplayer loop of Trackmania and, of course, 2D golf from Desert Golfing.

So, with that in mind, I've been trying to figure out how to add something to Manygolf to reward long-term play. Of course, as the first step in this process, I need to add some kind of *user persistence* - in other words, accounts for each player that could be used to store statistics, unlocks, etc.

So, while I've still got a bunch of hypothetical features on the drawing board, I've begun concretely implementing user persistence in the most frictionless way first. This has been an interesting challenge, and I wanted to write up my thoughts on persistence from a UX and technical perspective.

## Databases!

My first thought when I started thinking about persistence was obvious - where, exactly, am I going to persist data? If Manygolf had been a serverless application, I would have looked into a service like Firebase or Parse, but with Manygolf having a Node server, I figured it'd be fine to stick to a classic - Postgres!

This was easier said than done. I thought about provisioning Postgres on the DigitalOcean box that ran Manygolf, but I was worried about making sure this was done in a way that was easy to replicate. Additionally, I wanted to ensure that, long-term, I could easily scale the Manygolf architecture. This led me to Heroku, [as I described in a previous post](http://devlog.disco.zone/2016/08/14/deploying-games/). The static frontend is still hosted on DO - it turns out, surge.sh's custom domain+SSL support is $13/mo, which is way over the budget I want for Manygolf. I'll probably move it to S3 eventually, or maybe Surge if they get their pricing down to something reasonable.

With Manygolf running on Heroku with a provisioned database, I then needed a way to run migrations. Traditionally, migrations might be handled by the ORM that you use to interact with the DB, but I've never been that impressed with the state of ORMs in Node, let alone the migration toolkits they come with. Instead, I'm using raw SQL queries in Node, and started looking for language-agnostic migration tooling.

I found [Sqitch](https://github.com/theory/sqitch/) after some digging, and was very impressed. It's a Perl tool that lets you write migrations as plain `sql` files, and run them on either local or remote databases - so I can run migrations on my Heroku DB without installing anything special! It did take a little configuration to get working, but I'm really impressed with it on a conceptual level, and hopeful that it'll work out as I make changes to Manygolf's schema.

## Authentication!

So I now had a place to store user data, and an initial set of data I wanted stored:

* A unique user ID
* A unique player name
* A random player color

Basically, I wanted to make sure that when you returned to Manygolf, it'd remember your name and color. Simple, right? But the catch was, of course, how do I authenticate a player's identity? And this is where things get a bit complicated, on both a UX and technical perspective.

The first step of authentication is to generate a random authentication token and store it in the database. This token is generated when you connect to Manygolf in your browser for the first time, and stored in localStorage for subsequent connections. This way, as long as you never clear your browser storage, you'll always be able to "log in" as yourself automatically.

Of course, "if you never clear your browser storage" is a big if. Heck, iOS just randomly deletes browser storage when your iPhone runs out of space. And people change devices, and they change browsers, and they want their progress to carry over between devices and browsers. So this is a nice starting point, but far from a real solution.

So, in addition to this randomly generated token, you'll be able to log into Manygolf using Twitter. Manygolf will attach your Twitter ID to your Manygolf ID, meaning that if you log in on any device, you'll be able to log into your single Manygolf account using Twitter.

To be clear, this will not be required, which is where the UX trickiness comes in. I want to find a way to suggest to the player that they log in with Twitter, while not requiring, but while making it clear that their progress is "volatile" until they log in and save it.

The Twitter login will also, hopefully, one day double as a way of connecting to your friends in Manygolf. My long-term dream is for you to be able to connect Twitter, Facebook, Steam, etc. and see your friends identified by their social networking handles in-game.

## Roadmap

This is all a little ways off from landing in Manygolf production, but I am starting to do some internal betas (re: I send the beta link to a few friends and go "please break this"). The Twitter auth part of this has yet to be designed or implemented, so I expect that to take up my next few days.

These persistence changes are tied into the new netcode used in the iOS beta for various reasons, so I'm planning to just push that up to production soon and start collecting more feedback on it. I know it doesn't work as well on connections with higher pings, which is a bummer, but I don't know how to fix that at the moment. I think it should be better than the current netcode for the majority of players, though.

There's some other cool features persistence enables, the biggest being that you'll be able to resume your progress in a round/match if you're disconnected! No more losing everything because your cell signal dropped out for a moment, or because you had to close your browser tab to hide the game from your boss.

And, of course, on the longest-term timeline - I plan to use user persistence to add features like long-term stats tracking, achievements, unlockable ball effects, and maybe even unlocks that affect gameplay! Sky's the limit, really.