# LiveAtlas 
A [Dynmap](https://github.com/webbukkit/dynmap) frontend for the modern web, built with [Vue.js](https://github.com/vuejs/vue) and typescript.

![A LiveAtlas screenshot](https://minecraft.rtgame.co.uk/liveatlas/liveatlas.jpg)

LiveAtlas is a drop-in replacement for the original Dynmap frontend, which aims to provide a more modern interface and improved performance for busy maps.

Development is ongoing, and there are some rough edges, but most of the Dynmap features used by a typical Minecraft server have been implemented.

You can see it in action [here](https://minecraft.rtgame.co.uk/map/build) and [here](https://minecraft.rtgame.co.uk/map/stresstest)

## Supported Dynmap features
- Viewing maps
- Layers
- Player markers
- Custom markers, areas, circles and lines
- Popups
- Tile/marker updates
- Following players
- Location control
- Link control
- Digital/time of day clock control
- Logo controls
- New urls (`#world;map;1,1,1,1`)

## Not supported right now
- Chat
- Chat balloons
- Login/register
- Legacy urls (`?worldname=world&mapname=map&z=1&y=1&z=1`)
- Inactivity timeout

## Installation
Using an [external webserver](https://github.com/webbukkit/dynmap/wiki/External-Webserver-Basics) is recommended.

### External webserver
1. Download the latest release.
2. Extract into your webserver root. Any existing index.html should be overwritten.
3. Clear any CDN caches you may have
4. Done.

### Default internal webserver
1. Download the latest release.
2. Extract into `plugins/dynmap/web`. The existing index.html should be overwritten.
3. (Optional) Set index.html as readonly. This will prevent Dynmap overwriting it after every update.
4. Clear any CDN caches you may have.
5. Done.

## Customisation
The index.html file can be edited to add custom favicons, styles or analytics, just like the original Dynmap.
You are also free to build LiveAtlas yourself to make further changes.

## Building
First run `npm install` to install LiveAtlas dependencies. You can then either run `npm run serve` to start a local dev server, or `npm run build` to build.

## Support
If you find a bug, please create an issue with as must detail as possible. I'm working on this in my spare time, so fixes are on a best effort basis, but I'll eventually find time for them.

Please do not contact the Dynmap team regarding any issue with LiveAtlas. They will be very upset.

## Donate
If you appreciate my work, feel free to:

<a href='https://ko-fi.com/jlyne' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />
