<template>
  <div>
    <h1>Map</h1>
    <l-map :zoom="zoom" :center="center" style="height: 850px; width: 1000px">
    <l-tile-layer :options="{ maxZoom: 22 }" :url="url" :attribution="attribution"></l-tile-layer>
      <l-marker :lat-lng="marker"></l-marker>
      <l-circle
        :lat-lng="circle.center"
        :radius="circle.radius"
      >
        <l-popup content="Circle" />
      </l-circle>
      <l-rectangle
        :bounds="rectangle.bounds"
        :color="rectangle.color"
      >
        <l-popup content="Rectangle" />
      </l-rectangle>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LCircle, LRectangle } from 'vue2-leaflet';
import L from 'leaflet';




export default {
  name: 'Map',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LCircle,
    LRectangle
  },
  data() {
    return {
      zoom:19,
      center: L.latLng(43.7839, -79.1874),
      circle: {
        center: L.latLng(43.7845, -79.1874),
        radius: 30
      },
      rectangle: {
        bounds: [[43.7839, -79.1872], [43.7843, -79.1860]],
        color: "red"
      },
      url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=sk.eyJ1IjoiamZvbmc3MDEiLCJhIjoiY2s3cDExa3lxMDIzNDNrcnNwdjJlbndkZCJ9.n2BIBzqJ9gyJyHjlxnNENw',
      attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      marker: L.latLng(43.7839, -79.1874),
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>


</style>

<!---Reference:
http://jsfiddle.net/Boumi/k04zpLx9 --->