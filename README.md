# Ferment

[Ferment](http://ferment.audio) is a peer-to-peer audio sharing and streaming application. It's a lot like SoundCloud but instead of one corporation holding all the power, it is decentralized.

It is made possible by combining these **amazing** projects: [ssb](https://scuttlebot.io/), [webtorrent](https://webtorrent.io/) and [electron](http://electron.atom.io/).

## Experimental // EVERYTHING IS SUBJECT TO CHANGE AND BREAKING!

I'm just fiddling with ideas right now. My goal is to replace my need for SoundCloud as a [backyard musician that uploads WAY to much stuff](https://soundcloud.com/destroy-with-science). I no longer want to pay them $200 a year to host it all. Webtorrent to the rescue!

### The long-term vision ✨

I want to see a thriving audio sharing community (actually would be COMMUNITIES! it's decentralized), a lot like soundcloud used to be before they went all MONETIZE (AND OH NOEZ, WE'RE GOING BANKRUPT 😞). No lock-in, no spam (it's based on ssb which makes spam very hard to exist), all open source! And all the community features that made old soundcloud great!

It should also be possible to host your own server that allows people without the app to stream music from your profile (or others that you want to seed). This will still be peer-to-peer but your server will act as a mirror and tracker.

## TODO

- [x] Scuttlebot database
- [x] Webtorrent streaming
- [x] Layout main application interface, base styles
- [x] Audio player interface
- [x] Sequencial feed playback
- [x] API for adding file (transcode, analyse waveform)
- [x] Upload interface [still needs more fields, and artwork]
- [ ] Store artwork in blobstore, and retrieve again
- [ ] Proper play/pause/loading buttons (nice try emoji)
- [ ] Make Save / Download button work
- [ ] User setup (choose username, title, location, bio, picture, banner)
- [ ] Specific Artist Feed
- [ ] Allow "delete" of audio posts (some kind of tombstoning)
- [ ] Local Discovery
- [ ] Likes
- [ ] Reposting
- [ ] Invite to pub
- [ ] Follow other users ("friends")
- [ ] Display following stats
- [ ] Playlists
- [ ] Show seed stats
- [ ] Backgrounding (keep seeding / syncing when main window is closed)
- [ ] Allow revisions (some kind of special reply that replaces the content with new content)
- [ ] Figure out a way to track listens? [Would be difficult given the decentralized nature of this. Might be better to show swarm strength or some other clever metric]
- [ ] Commenting? This is a pretty major part of soundcloud, but I'm personally not really a fan

### Server

- [ ] Pub server (invites, etc)
- [ ] Seed torrents from specified feeds
- [ ] Web interface for viewing specified feeds
