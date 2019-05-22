---
title: Running Jam Buds on the cheap
---

- DigitalOcean as docker host: $5/mo
  - nginx outside of container
- CloudFront CDN (AWS): rounds down?
  - I don't think there's any other competitor in the space?
- Database hosting: free for now...
  - Heroku because free, but also maybe not a good idea
  - GCloud: $9/mo, RDS: $15/mo, does anyone offer this for less??
- SendGrid emails: free for now, $15/mo tho :grimacing:
  - Will move to Mailgun if I hit that limit

Testing and deploying
- Travis CI - Open source!!
  - Free testing
  - Could theoretically do Docker builds, except environment variable hell
  - For private - would probably use hosted Circle CI
- Google Cloud
  - Cloud Registry
  - Cloud Build?

## Jam Buds overview

Jam Buds is a (self-described-) "little" (-but-slowly-growing-larger) app for sharing music with your friends. It's basically just yet another social network, plus a little integrated cross-service music player. This is more or less all you need to know about the actual product, but you should [sign up if you're curious to see more](http://jambuds.club/).

### Backend

I've been working on and off on Jam Buds for a few years now, and it's gone through some major changes in that time. One thing that has stayed relatively consistent is the _API server_, which is kept separate from the frontend (except for sharing a monorepo).

The API server is written in TypeScript & Express. I'll write more about this at some point, but the main advantages here are that Node is relatively portable and easy to deploy, and having an async-by-default web framework rules when you are making lots of API calls to external services like I am. No need for a job system or a lot of workers here - it's okay for, say, the Spotify-proxying search endpoint to take a few seconds to respond as long as the app can handle other requests inthat time.

### Frontend

The frontend is where things get a lot weirder. The "frontend" of Jam Buds is not just a static bundle, thrown up on S3 or Firebase Hosting (though it used to be!). It's a [server-rendered Vue app](https://ssr.vuejs.org/), powered by a server I rolled myself (with guidance, libraries, and boilerplate from the SSR docs).

Terminology being hard, I call the SSR server the "app server," though I should probably replace that with something less generic.

One important detail to keep in mind with this structure: given that the app server runs initial page rendering, it also handles initial data loading. This means both app server makes requests to the API server, as well as the client-rendered frontend.

## What Jam Buds needs

So, with the structure of the application in mind, a quick overview of what Jam Buds _needs_ to be able to run:

* Hosting for the app and API servers. Bonus points for static hosting for the client-side app bundle and other static assets.

* A Postgres database for storing data. This includes user authentication information, the songs that users post, and the graph of "following" relationships between users.

* A deploy process for getting code onto the server in an automated form (re: more than just manually `ssh`ing in and running `git pull && npm install` every time).

* An email service, since Jam Buds uses "magic link"-based authentication, where a login link is sent to a user's email.

* An error tracking service, since between the API server, the server-rendered app, and the client-rendered app, there are lots of moving pieces that could go wrong.

* Some form of basic administration & monitoring in place to keep an eye on usage.

## Existing under the good graces of giant corporations

In general, I find Amazon and Google to be gross companies, for reasons I don't really need to get into in this blog post. I'd like to give them as little money as possible, but I also want to _spend_ as little money as possible, which ends up being a bit of a catch-22, since they're the cheapest game in town for several services.

In terms of _using_ their products, I've found AWS customer service to be
surprisingly good (I had a whole panic-inducing incident with someone trying to
gain access to my Amazon/AWS accounts, and even though I have spent a grand
total of 20 cents on their platform, a support agent got in touch with me by
phone within 30 minutes of my report). Obviously, the AWS UI is an absolute
garbage pit, but there is now such a huge cottage industry of tooling
specifically built for AWS that it seems like I could get away with avoiding it.

I use Google services for a lot, but I've been pretty bothered about how locked into their systems my digital life is. Their customer support stories are nothing but complete nightmares, whether you're a regular user, a Google Apps customer, a Google Cloud customer, or basically anyone who doesn't have millions of dollars or thousands of technically-inclined Twitter followers and Hacker News upvotes to use as leverage.

If I want to leverage services that are priced by usage, AWS and Google Cloud are kind of the only game in town at small scales (with Azure as a _distant_ third, I guess).

## App hosting on DigitalOcean

Jam Buds originally ran as two separate Heroku apps. I could have probably run them as a single app - a web dyno (the app server) and a worker dyno (the API server, proxied by the app server) - but the cost would have  been the same: $7/mo/dyno.

$14/mo isn't a huge bill the grand scheme of things, but I kinda found it hard to swallow. If I was building a "traditional" web app - big ol' Rails app, or whatever - I wouldn't have this two-process architecture, and would have paid half the cost. Just because I wanted to run a whole _two processes_, though, I had to double the bill. I suspect maybe there are custom buildpack options or something that would have let me run these two processes side by side in a single dyno, but half the custom buildpacks for Heroku are like gross unmaintained hacks-on-hacks.

I have a $5/mo DigitalOcean VPS, which has hosted everything from [Manygolf](https://manygolf.club), to my [gig blog](https://loudplaces.disco.zone/), to this very devlog, and I started thinking about running Jam Buds on it.

My DO box has a pretty simple, but common, setup - I provisioned it [per their setup guide](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-18-04), then set up Nginx on the host, with different configs for the various websites hosted on it. Most of my sites are purely static, with only a couple persistent backend services (actually defined as systemd services!).

I never liked the idea of running more-complex services on the DO box. I sure as _hell_ didn't want to maintain my own databases for anything that matters, and the idea of having to wrangle different versions of system dependencies sounded like a hassle, not to mention writing reusable provisioning and deployment scripts.

But when I decided to move my services off Heroku, DO seemed like the easiest cheap option, and I figured I could use my paltry Docker knowledge to try running something on my box.

### Database hosting

### CDN

### Email service

## Building & deploying

Currently, builds and deploys are a relatively manual process, involving some shell scripts I wrote to run Docker builds locally and run some remote tasks over SSH. I'd like to eventually get this integrated more into CI/CD (as described in the next section), but I'm actually pretty happy with my current setup.

### Google Cloud Registry

## Tests & CI

I run my tests on Travis CI. I like Travis well enough, especially for open source; it feels like a scrappier-yet-friendlier alternative to Circle CI, which I reckon most startups are using these days.

A quick overview of my options doesn't really provide any reasons to immswitch:
There are a few big competitors to Travis:

- I use Circle CI at work, and it actually gives you private builds for free if you stick to a single container (that is, zero parallelism in your builds). However, the only part of Circle I find really attractive - its support for running Docker builds - costs *lots* of money if you want [image layer caching](https://circleci.com/docs/2.0/docker-layer-caching/#enabling-dlc), which seems kinda necessary for building
- GitLab CI is probably good, but I have no interest in self-hosting that infrastructure right now, I don't want to move my source code to GitLab.com, and GitLab CI-for-GitHub requires their $20/mo plan
- Jenkins/other self-hosted solutions are also out, since there's just too much management overhead for a personal project

### Semaphore CI

My main problem with Travis is that it can't really handle deploys. Like, it _can_ on a theoretical level; there's an `after_success` task you can hook into a specific branch to run deploy tasks. But things like deploy-specific environment variables, or running Docker builds, aren't really documented or clear, especially for open source projects that would like to hide a lot of these details.

Becuase of this, there is one lesser-known option I've begun looking into: [Semaphore CI](https://semaphoreci.com/). They have a pretty ridiculous free plan. Their pricing is all just usage-per-second, with no minimums or other fees that I've seen.

On the cheapest, $0.0025/sec box, that means you're paying for like a dollar an hour, and with _20 dollars of free credit a month_, I think that's _more_ than enough runway for Jam Buds, which certainly isn't going to hit nearly a combined day's worth of testing in a month, even if I ran all my tests using like 4 parallel instances.

Semaphore's new 2.0 platform is really powerful, and gives you CircleCI-style workflows that I could use to integrate Docker builds and even running the remote deploy tasks over SSH that I mentioned in the previous section. The main problems I have are that it is some _work_ to set up - it's not as well-documented as other services, and it clearly has a much smaller community. However, I found writing build tasks in it was actually a lot more pleasant than my experiences doing the same on Circle - they provide a useful "toolbelt" for common tasks like caching data, and a decent number of recipes for everything from dependency caching to Docker pushing.

I've paused my investigation into Semaphore since I have a few big tasks left to figure out (such as getting an SSH key set up as a secret on Semaphore for deploys), but I'm happy with how it's gone so far. I'll probably write a follow-up post about it if I do end up making the switch.