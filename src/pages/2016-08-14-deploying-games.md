---
layout:     post
title:      "Adventures in deploying web games"
summary:    "In which I get sick of Nginx"
---

This weekend, I finally deployed a new project I've been working on! It was a surprisingly difficult journey.

The new project is a game that's architected much like Manygolf. It has a Node WebSocket server, that I use to store game state in memory and send messages between clients. It also has a client-side application that isn't rendered or delivered by this WebSocket server - it's just some static files.

## VPS Deployment

My first thought was to just deploy this game like I'd deployed Manygolf. I have a DigitalOcean box I pay $10/month for. It's a pretty bare-bones box, just running Nginx. I have Nginx set up to serve a static `/www` folder, which is great for all my client-side-only experiments - I just SFTP some files up and I'm golden.

Unfortunately, adding a server isn't quite so easy. I need a separate Nginx configuration that will proxy requests to the actual Node server. I need to add a new subdomain for each game, and set up HTTPS for each subdomain. While HTTPS isn't technically necessary for all games, it actually is required for many uses - for example, iOS web views won't allow non-HTTPS resources to communicate with the native process - so it's something I consider non-optional these days. Let's Encrypt makes getting certificates free, which is awesome, but there's still some management overhead in ensuring that each subdomain has a certificate and the certificate is able to auto-renew.

In addition to just configuring the server, I also need to set up supervision for running server processes (so the server can be started/stopped/restarted cleanly) and a script to manage deploys. With Manygolf, I used a [messy, buggy Flightplan script](https://github.com/thomasboyt/manygolf/blob/master/flightplan.js) that required a ton of trial and error to get right. Manygolf's server process is managed by a tool called Forever, which is intended as a JavaScript alternative to something like supervisord, but in practice I found it extremely error-prone, and its CLI needlessly confusing.

I was also really worried about long-term configuration management of this server. I've got it backed up, and the Nginx files are committed in a private repo, but if this server ever explodes, I'm not actually sure I'm going to be able to restore it without a ton of manual work, especially considering the number of individual processes running on it that would have to be redeployed. And if I ever have a game that needs extra services, like a database, to run, I'd have to figure out how to configure it, store that configuration, and plan for it to be restored in case the server goes down - just a total mess.

If I was more skilled in ops, or had set up a better-managed stack on my VPS - maybe using Dokku, or something like that - I could at least make things more resilient, but I'm not sure I could cut down on the amount of overhead required just to get a new game running. Thus, I started looking into managed services.

## Requirements & Limitations

So, let's review what the requirements for this new game are:

1. Deploy static site frontend to somewhere that can serve static files without needing to configure a server, with HTTPS and proper cache busting built in
2. Deploy Node.js WebSockets backend with to somewhere that will, long-term, give me the option to easily add further services (Redis, Postgres, etc.)
3. Connect frontend in (1) to (2)

And a very important limitation: *I want to spend less than $10 a month running this thing.* My games don't make money, I have no plans for them to make money, and I don't want to have to spend a lot on keeping small side projects running.

## Investigating Options

So, for the first time since I started using my DO VPS to host things two years ago, I started looking into other services for backend hosting. And, dang, the web changed a lot in the interim!

### Zeit's Now

So, my first thought was, "this is a pretty small game, I should look into some of these new quirky services that have popped up for managing microservices."

[`now`](https://zeit.co/now#) (as it's stylized on the site) is one such service. I was really excited about it, because it seemed perfect for my use case - just a simple Node app.

Unfortunately, Now has a bunch of issues. First off, the pricing is, well, hilarious. They have two plans, "open source" (free) and "premium."

The open source plan always exposes your application's source at a special `/_src` URL. This is super weird, but, sure, my game is going to be open source anyways. It also doesn't allow custom domains, and Now generates a new domain *every time you deploy*. So now I can deploy my game to an ever-shifting-URL; god only knows what kind of weird process I'd have to put into place to properly route to it. Oh, and you only get twenty free deploys a month. It usually takes me about that many deploys just to get something running remotely without errors, so, uh, this plan is  no-go.

The premium plan is solid, but also costs $15/month, which is over my budget. In addition, Now doesn't handle static file hosting or have any kind of database hosting, so I'd have to find other services for that, with their own costs.

So, unfortunately, Now was a big pass across the board. I'm still not really sure what you'd use it for, especially at that price.

### Amazon Web Services

A few people recommended I take a look at AWS. In the past couple years, they've been adding to their already-baffling array of product offerings with a bunch of more-managed services. Here's a few I was looking into:

- S3 + CloudFront for static file hosting
- Elastic Beanstalk for Heroku-like managed backend hosting
- EC2 for VPS-like unmanaged backend hosting
- RDS for relational database hosting
- ElastiCache for Redis, I think?

There's like 8000 other products that might be useful, I don't know. Anyways, the draw of all this is that AWS is basically commodity pricing, in that you only pay for what you use. Turns out that while potentially having a $1/month bill is an exciting thought, what's not so exciting is spending a million years learning how the fuck to use any of these services. I've tried using S3 in the past and it was an absolutely awful time; I certainly am not excited to become a one-man DevOps band learning how to connect a billion different things.

### Heroku

My next thought was to look at Heroku. I'd used Heroku back in early 2013 for some side projects and liked it a lot - at that time, it was by far the easiest way to throw a Python or Node app online.

They've changed their pricing since then, but I was happy to see their pricing seems *relatively* in-budget for a side project. Heroku has this neat concept of "dynos," which are basically just processes. Every Heroku account gets a shared pool of 1000 free dyno-hours a month, and each free app is allowed 1 "web" dyno and 1 "worker" dyno.

The math works out reasonably well if you, like me, are running a single process: a single app running for 30 days uses 720 of these dyno-hours. However, here's what's really nice - Heroku actually puts free web dynos to "sleep" after a half hour of inactivity. The Heroku docs are super unclear on what the hell "sleep" actually means (I *think* it basically means "terminated?"). Anyways, I was fine with my app losing its in-memory state while inactive, and fine with the initial connection to it taking 5-10 seconds as it comes out of sleep.

Pricing becomes potentially rough once you get out of this free tier, though. Heroku plans are priced in terms of "number of dynos per month." The "hobby" plan is $7 per dyno/month, which at first seemed way too expensive to me. Turns out, though, that these dynos are prorated to long they actually run during a month. So if you have, say, a single web dyno, and then a worker dyno that runs once a day for one minute, you'd only get billed for 30 minutes out of that month's pricing.

If you want, you can also pay $stupid amounts of money for simple horizontal scaling and more RAM. I think these plans only exist for people who have far more money than time (so, basically, startups who locked themselves into using Heroku for the time being). If my game ever got successful enough to need these plans, I would *probably* be figuring out how to monetize it, so I might actually be able to stomach the pricing.

Anyways, beyond just hosting processes, Heroku also has a ton of extra services you can add on. The two I care about are Postgres, which you can host for free for up to 10k rows, or for $9/month for up to 10 million rows. "Per-row" pricing is conceptually really stupid, and I wish there was like a $3/month tier where you get a million rows or something, but these both seem fine to me for getting started.

They also have free Redis hosting, which is potentially interesting. Thing is, the main use case I have for Redis is for helping scale my games. For example, if I'm finding I have too many players on my server and can't handle the messaging throughput, I could horizontally scale the game by adding more server instances and moving game state into a Redis database shared between them. If this happened, though, because of the per-dyno pricing I mentioned earlier, I probably would have to move the game off Heroku - I wouldn't be able to afford to scale horizontally.

Lastly, I've got one beef with Heroku that goes beyond pricing: somehow, after nearly a decade of existence, they still don't have a static hosting platform. If you want to host a static site, you have to either set up a Node/Python/whatever server to serve it, or you have to go through another service, like S3. Never understood why a service that tries to manage so much of your hosting in one place doesn't incorporate this obvious feature.

### surge.sh

Finally, I took a look at one service I actually *had* used before, Surge.

Surge is awesome. It's a static site host that has the interface I wish my DigitalOcean box had. You tell it a folder and a desired subdomain, and it'll deploy it there, for free, with HTTPS. It's amazing. Surge is the only service on this list I love enough that I'd throw a swag sticker on my laptop to give it free marketing.

Of course, Surge is a *static* site host, so it doesn't really solve my backend problem. But it did give me a thought - could I just put my static frontend on Surge, and then host my backend on some other service?

## My New Setup

It turns out, yes, I could. My new game is hosted on Surge and Heroku, and it took about 30 minutes to deploy.

The one quirk, of course, of having your frontend and backend hosted by totally separate services is that you *usually* need a bit of CORS configuration. I say usually because, hey, guess what web protocol doesn't use the same-origin policy for some reason? WebSockets! Yes, what's usually an obnoxious security flaw actually became an advantage for once.

I'm hosting my app for free across Surge and Heroku, and the deploy process is just:

```
# deploy the backend
git push heroku master
# build the frontend
npm run build
# deploy the frontend
surge --domain mygame.surge.sh --project build/
```

It's pretty awesome. And Surge actually supports custom domains for free, so if I decide I don't like that unsightly `surge.sh` domain, I can grab whatever the cheapest Namecheap TLD is at the moment and use that instead.

If Surge ever folds because they offer a ludicrous amount of features for free (or, more likely, they get acquired by a less-charitable company), then moving shouldn't be too hard - short-term, I could SFTP my static frontend onto my DigitalOcean box and just host the frontend on that. There's a bit more lock-in on the Heroku side, especially if I start using them for Postgres/Redis, but the backend code itself didn't change at all for Heroku, so it's theoretically still pretty portable.

The other exciting part of this is that it should scale for as many new games as I want to make. Surge gives you infinite projects for free, and with Heroku's free dyno hours system, as long as none of my games suddenly become consistently popular, I can put as many backends as I want on there for free.

I've had fun running my little DigitalOcean box, but I feel happy about using this stack for the foreseeable future. With deployment solved for now, it's going to be much easier for me to get ideas up and running as fast as I can come up with them, instead of spending time bogged down in server configuration and management.