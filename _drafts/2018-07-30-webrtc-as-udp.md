---
layout:     post
title:      "Using WebRTC for UDP-like server-client connections"
---

A few days ago, someone in the BoroJS Slack asked a simple question: "are UDP WebSockets ever going to be a thing?" It was an interesting question, though its answer is a rather-resounding _no_. WebSockets are a TCP-based protocol, as an extension of the HTTP protocol.

There's no simple browser API for making an arbitrary UDP connection to a known server. Of course, Googling "websockets udp," or "browser udp," comes up with a lot of interesting potential use cases. The most common one, and the one I'm most interested in, comes from game developers.

The very short and simple answer of _why_ game developers are asking for UDP comes down to the primary reason to use UDP instead of TCP: speed. TCP makes guarantees to ensure that packets arrive in the _order_ that they are sent, which requires resending packets that failed to arrive at the other end, slowing down the stream of data.  A [post on gamedev.stackexchange.com here](https://gamedev.stackexchange.com/a/120057) goes into more particulars on the potential slowdown this can cause.

There have been several proposals for implementing UDP in browsers, some going as far as to create [reference implementations](https://gafferongames.com/post/why_cant_i_send_udp_packets_from_a_browser/) usable as browser plugins. But there's no real interest in this from any browser vendor, as far as I can tell.

It turns out, though, you _can_ get UDP connections, with UDP semantics, in modern browsers. It's just hidden away in one of the newest, least-supported, most-complex, and least-understood browser APIs: WebRTC! Yes, that API that you've probably only encountered as an implementation detail in videoconferencing software, or maybe in a blog post or two that demos a "simple" file transfer or a page that shows you your webcam, actually supports unreliable connections - not just for video and audio, but for _arbitrary data_.

### What you need to know about WebRTC

Now, to get to there, we've got to go on a little journey into the depths of some quirky protocols. WebRTC is the first time I ever had to open an IETF RFC to understand what the hell was going on in my browser, and the least I can do is try to help you avoid the same fate. Though, hey, those RFCs [look snazzier](https://tools.ietf.org/html/rfc4960) these days. The weird manually-added page breaks use an actual `<hr>` instead of a bunch of ASCII dashes!

WebRTC is _really dang complex_, because it has so many moving parts, and unlike most complex browser things, these moving parts are actually very visible to developers, for better or worse. I was originally going to write up a quick list of all the moving pieces in WebRTC, but gave up about halfway through, and decided to not even touch on the audiovisual aspect of it here.

Now, remember, WebRTC is normally used for _peer-to-peer_ communication. Because of this, opening a WebRTC connection to a server is not as simple as "make a request to this public IP," because most peers _don't have_ public IPs.

WebRTC instead has this very complex process called [Interactive Connectivity Establishment](https://tools.ietf.org/html/rfc5245) (or the unfortunately-acronymed ICE) for establishing peer-to-peer connections. There's a bunch of pieces of this, but the process boils down to:

- The [Session Description Protocol](https://tools.ietf.org/html/rfc4566) (SDP) basically generates tokens that either _offer_  a connection or _answer_ an offer. This thing is used in WebRTC to determine things like what media protocols are supported by different clients. You don't really need to know what these tokens contain (though [this is a good overview for the curious](https://webrtchacks.com/update-anatomy-webrtc-sdp-anton-roman/)), but know that for two peers to establish a connection, one has to send an offer and one has to receive an answer.
-

[TODO: can I just skip this part]

###