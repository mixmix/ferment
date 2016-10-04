# Ferment

[Ferment](http://ferment.audio) is a peer-to-peer audio sharing and streaming application. It is an attempted re-creation of classic SoundCloud, but runs entirely decentralized instead of one corporation and its investors holding all the power.

It is made possible by combining these **amazing** projects: [ssb](https://scuttlebot.io/), [webtorrent](https://webtorrent.io/) and [electron](http://electron.atom.io/).

![](/assets/ferment-screenshot-0.0.0.png)

## Experimental // EVERYTHING IS SUBJECT TO CHANGE AND BREAKING!

I'm just fiddling with ideas right now. My goal is to replace my need for SoundCloud as a [backyard musician that uploads WAY to much stuff](https://soundcloud.com/destroy-with-science). I no longer want to pay them $200 a year to host it all (also sick of being told to pay more money to get SoundCloud Go and having my feed ransomed out from underneath me).

### The long-term vision ✨

I want to see a thriving audio sharing community (actually would be COMMUNITIES! it's decentralized), a lot like SoundCloud used to encourage before it had to MONETIZE and start trying to make a profit (AND OH NOEZ, WE'RE GOING BANKRUPT 😞). Pretty sure that SoundCloud was doomed from the start (so glad we had all these great years off the pocket of those investors), but a _peer-to-peer decentralized not-for-profit open source_ might just work!

**It will also soon be possible to host your own server that allows people without the app to stream music from your profile (or others that you want to seed).** This will still be peer-to-peer but your server will act as a mirror and tracker.

## Requirements

- You currently need to have `ffmpeg` on your system to add audio files.
- Until I get around to creating a packaged app installer, you'll need a modern version of [`node` and `npm`](https://nodejs.org) installed in order to build.

## Install

### from npm

```bash
$ npm install -g ferment
```

And then run using:

```bash
$ ferment
```

Install latest updates:

```bash
$ npm install -g ferment@latest
```

### from source

**Warning:** Development is done on the master branch, so this could be broken right now!

```bash
$ git clone https://github.com/mmckegg/ferment.git
$ cd ferment
$ npm install
```

And then run using:

```bash
$ npm start
```

Install latest updates:

```bash
$ npm update
$ npm run rebuild # make sure native add-ons are compatible with electron version
```

## Joining Pub Server

By default, **Ferment** will only see other users that are on the same local area network as you. In order to share with users on the internet, you need to be invited to a pub server.

Since I'm a nice person 💖 you can hang out in my pub, and you don't even have to by any drinks! 🍻

Click 'Join Pub' on the sidebar then paste the code below:

```
120.138.27.120:43761:@uIL3USK7QJg5AHohnZC329+RXS09nwjc24ulFBH2Ngg=.ed25519~G0c0KMPSsZynwgM4wBLoUpfIyAP5gX9At2Ngs56tfmM=
```

If all goes to well, you'll start to see audio appear before your eyes! Give that play button a spin.

## Hosting Your Own Pub Server

See [this guide](http://ssbc.github.io/docs/scuttlebot/howto-setup-a-pub.html) for full info.

## TODO

- [x] Scuttlebot database
- [x] Webtorrent streaming
- [x] Layout main application interface, base styles
- [x] Audio player interface
- [x] Sequencial feed playback
- [x] API for adding file (transcode, analyse waveform)
- [x] Upload interface [still needs more fields, and artwork]
- [x] Connect to local peers and merge streams
- [x] Store artwork in blobstore, and retrieve again
- [x] User setup (choose display name, bio, picture)
- [x] Specific Artist Feed
- [x] Proper play/pause/loading buttons (nice try emoji)
- [x] Follow other users ("friends")
- [x] Display following stats
- [x] Likes
- [x] Backgrounding (keep seeding / syncing when main window is closed)
- [x] Invite to pub
- [ ] Make torrents more reliable via pub server trackers
- [ ] Make Save / Download buttons work
- [ ] Allow "delete" of audio posts (some kind of tombstoning)
- [ ] Reposting
- [ ] Playlists
- [ ] Show seed stats
- [ ] Allow revisions (some kind of special reply that replaces the content with new content)
- [ ] Figure out a way to track listens? [Would be difficult given the decentralized nature of this. Might be better to show swarm strength or some other clever metric]
- [ ] Commenting? This is a pretty major part of soundcloud, but I'm personally not really a fan

### Server

- [ ] Pub server (invites, etc)
- [ ] Seed torrents from specified feeds
- [ ] Web interface for viewing specified feeds
