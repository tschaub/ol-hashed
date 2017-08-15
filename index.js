import hashed from 'hashed';
import proj from 'ol/proj';

function toPrecision(value, precision) {
  var factor = Math.pow(10, precision);
  return (Math.round(value * factor) / factor).toString();
}

function synchronize(map, options) {
  options = options || {};
  var animate;
  if ('animate' in options) {
    animate = options.animate;
  } else {
    animate = {duration: 250};
  }

  var view = map.getView();
  var projection = view.getProjection().getCode();

  var zoom, center, rotation;
  if (view.isDef()) {
    zoom = view.getZoom();
    center = view.getCenter();
    rotation = view.getRotation();
  } else {
    var viewport = map.getViewport();
    if (viewport) {
      zoom = Math.LOG2E * Math.log(viewport.clientWidth / 256);
    } else {
      zoom = 0;
    }
    center = [0, 0];
    rotation = 0;
  }

  var config = {
    center: {
      default: center,
      serialize: function(coord, state) {
        var precision;
        if (state && 'zoom' in state) {
          precision = Math.max(0, Math.ceil(Math.log(state.zoom) / Math.LN2));
        } else {
          precision = 3;
        }
        coord = proj.transform(coord, projection, 'EPSG:4326');
        return (
          toPrecision(coord[0], precision) +
          ',' +
          toPrecision(coord[1], precision)
        );
      },
      deserialize: function(str) {
        var parts = str.split(',');
        if (parts.length !== 2) {
          throw new Error('Expected lon,lat but got ' + str);
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
    if (view.isDef() && animate) {
      view.animate(Object.assign({}, state, animate));
      return;
    }
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
