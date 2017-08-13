import hashed from 'hashed';
import proj from 'ol/proj';

function toPrecision(value, precision) {
  var factor = Math.pow(10, precision);
  return (Math.round(value * factor) / factor).toFixed(precision);
}

function synchronize(map) {
  var view = map.getView();
  var projection = view.getProjection().getCode();

  var zoom, center, rotation;
  if (view.isDef()) {
    zoom = view.getZoom();
    center = view.getCenter();
    rotation = view.getRotation();
  } else {
    var viewport = map.getViewport();
    zoom = Math.LOG2E * Math.log(viewport.clientWidth / 256);
    center = [0, 0];
    rotation = 0;
  }

  var config = {
    center: {
      default: center,
      serialize: function(coord, state) {
        coord = proj.transform(coord, projection, 'EPSG:4326');
        return toPrecision(coord[0], 3) + ',' + toPrecision(coord[1], 3);
      },
      deserialize: function(str) {
        var parts = str.split(',');
        if (parts.length !== 2) {
          throw new Error('Expected x,y, got ' + str);
        }
        var coord = [parseFloat(parts[0]), parseFloat(parts[1])];
        return proj.transform(coord, 'EPSG:4326', projection);
      }
    },
    zoom: {
      default: zoom,
      serialize: function(value) {
        return toPrecision(value, 1);
      },
      deserialize: Number
    },
    rotation: {
      default: rotation,
      serialize: function(value) {
        return toPrecision(value, 2);
      },
      deserialize: Number
    }
  };

  function hashHandler(state) {
    if ('center' in state) {
      view.setCenter(state.center);
    }
    if ('zoom' in state) {
      view.setZoom(state.zoom);
    }
    if ('rotation' in state) {
      view.setRotation(state.rotation);
    }
  }

  var update = hashed.register(config, hashHandler);

  function onMoveEnd() {
    update({
      center: view.getCenter(),
      zoom: view.getZoom(),
      rotation: view.getRotation()
    });
  }

  map.on('moveend', onMoveEnd);

  return function unregister() {
    map.un('moveend', onMoveEnd);
    hashed.unregister(hashHandler);
  };
}

export default synchronize;
