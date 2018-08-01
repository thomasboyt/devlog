---
layout:     post
title:      "Small Data Analytics With Google Sheets"
categories: manygolf
summary:    "How I used Google Sheets to track Manygolf players over time"
---

A couple weeks ago, I added a little endpoint to the [Manygolf](https://manygolf.club) server that returned, in plain text, the current number of players:

```
$ curl https://manygolf.club/server/player-count
10
```

I hang out in a chat room that has a bot I can query to see the current number of players at any given time. It's a fun little setup, but I started thinking that it'd be nice to track active players over time. Since I had this endpoint already, the question then became: how do I automatically fetch, store, and display this data?

I asked this question in the [XOXO](https://xoxofest.com/) Slack's #coders room, and expected answers about stats services that are intended for Big Enterprises with Big Data, or maybe an answer describing how to set up a [Graphite](https://graphiteapp.org/) server, or some other compicated, long answer. So I was surprised when the first response came from Twitter bot wizard [Darius Kazemi](https://twitter.com/tinysubversions), who suggested I take a look at using Google Sheets.

My first thought was - *Google Sheets*? Like, I'd used it for some basic spreadsheets, and even looked into using its API for loading data from spreadsheets at one point, but I'd never thought of it as a *scripting platform* per se. But, apparently, it really is a full-fledged code hosting service: using [Google Apps Script](https://developers.google.com/apps-script/), you can write fairly-vanilla JavaScript that can read and write to spreadsheets (and various other data stored in Google services). There's even a web-based IDE you use to write, run, and debug your applications! The IDE has *autocomplete* for special Google APIs! It's *sort of incredible* that this entire scripting platform exists and I'd never heard of it, honestly.

Darius pointed me at several resources, and mentioned that you can used timed triggers to run a script on a timed interval with no human interaction (even if the spreadsheet is closed).

With this knowledge, I made a new spreadsheet, accessed the script editor, and, with some trial and error, wrote the following function:

```js
function getPlayers() {

  // synchronously fetch the player count and parse it
  // as text
  var response = UrlFetchApp.fetch('https://manygolf.club/server/player-count');
  var count = response.getContentText();

  // open the spreadsheet for writing
  // (the ID of the spreadsheet is just the unique bit
  // of its URL)
  var doc = SpreadsheetApp.openById('<players-spreadsheet-id>');

  // grab the new date and append a new spreadsheet row
  // with the cells [timestamp, playerCount]
  var date = new Date();
  doc.appendRow([date, count]);

}
```

The scripts editor lets you run functions in a one-off manner, so it was fairly easy to test. I then manually created a trigger with the following configuration:

![The configuration pane in the scripts editor, configured to run getPlayers every five minutes](/images/spreadsheet-triggers.png)

Rows quickly began filling in with the current player count:

![The Manygolf players spreadsheet, showing timestamp and player count rows](/images/spreadsheet-rows.png)

All I had to do finish up was use the standard Google Sheets charting tools to make a line graph of the dataset:

![A chart displaying Manygolf players over time](/images/spreadsheet-chart.png)

And, ta-da, I had a "live analytics dashboard" that would make any enterprise architect jealous!

I was so happy with how easy this was, and I really want to try using Google App Scripts for future projects. Setting up even the simplest of databases can be sort of a pain (where am I going to host this database? What does this Postgres schema look like?), and this seems like a powerful tool if you want some small-scale persistent data that you don't need to worry about too much.