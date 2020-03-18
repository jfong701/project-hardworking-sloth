<template>
  <div>
    <h1>Map</h1>
    <l-map :zoom="zoom" :center="center" style="height: 850px; width: 1000px">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <l-marker :lat-lng="marker"></l-marker>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker } from 'vue2-leaflet';
import L from 'leaflet';




export default {
  name: 'Map',
  data() {
    return {
      zoom:100,
      center: L.latLng(43.7839, -79.1874),
      url:'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      marker: L.latLng(43.7839, -79.1874),
    }
  },
  components: {
    LMap,
    LTileLayer,
    LMarker,
  },
  methods: {
    removeMarker(index) {
      this.markers.splice(index, 1);
    },
    addMarker(event) {
      this.markers.push(event.latlng);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>


</style>

<!---Reference:
http://jsfiddle.net/Boumi/k04zpLx9 --->