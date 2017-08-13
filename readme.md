# ol-hashed

A simple utility for synchronizing your OpenLayers map state with the URL hash.

## Installation

    npm install ol ol-hashed

The `ol-hashed` module is meant to be used together with (and depends on) the [`ol` package](https://www.npmjs.com/package/ol).

## Example

```js
import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import XYZSource from 'ol/source/xyz';
import sync from 'ol-hashed';

// create a map as you would normally
const map = new Map({
  target: 'map-container',
  layers: [
    new TileLayer({
      source: new XYZSource({
        url: 'http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg'
      })
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

// synchronize the map view with the URL hash
sync(map);
```

## API

The default export from the `ol-hashed` module is a function that accepts a map.  Calling the function with a map sets up listeners so that the URL hash is updated when the map view changes and the map view is updated when the URL hash changes (for example, when the user navigates back through history).  The function returns a function that can be called to unregister all listeners.

```js
import sync from 'ol-hashed';
// ... create a map

// synchronize the map view with the URL hash
const unregister = sync(map);

// later, if you want the map to no longer by synchronized
unregister();
```
