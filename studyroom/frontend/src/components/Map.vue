<template>
  <div>
    <h1>Map</h1>
    <p> Users </p>
    <ul v-for="user in userData" :key="user._id">
      <li>User ID: {{ user.userId }}</li>
      <li>location: {{ user.location.coordinates.reverse()}}</li>
    </ul>
    <p> Geofences </p>
    <ul v-for="geofence in geofences" :key="geofence._id">
      <li>Name: {{ geofence.description }}</li>
      <li>ID: {{ geofence.externalId}}</li>
    </ul>
    <p> Events </p>
    <ul v-for="event in radarEvents" :key="event._id">
      <li>{{ event.user.userId }} has entered {{ event.geofence.description}} at {{ event.createdAt }}</li>

    </ul>
    <l-map :zoom="zoom" :center="center" style="height: 850px; width: 1000px">
    <l-tile-layer :options="{ maxZoom: 22 }" :url="url" :attribution="attribution"></l-tile-layer>

      <l-circle
        :lat-lng="circle.center"
        :radius="circle.radius"
      >
        <l-popup content="Circle" />
      </l-circle>
      <l-marker :lat-lng="testVal">
      <l-icon
          :icon-size="dynamicSize"
          :icon-anchor="dynamicAnchor"
          icon-url="https://image.flaticon.com/icons/svg/1738/1738691.svg" >
      </l-icon>
      </l-marker>
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
import { LMap, LTileLayer, LMarker, LCircle, LRectangle, LIcon} from 'vue2-leaflet';
import L from 'leaflet';
import Radar from '../js/radar.js';



export default {
  name: 'Map',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LCircle,
    LRectangle,
    LIcon
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
      icon: L.icon({
        iconUrl: 'https://lh3.googleusercontent.com/proxy/ZcYtqlXeuGOHru0UFzvHemclleQK6NVJVYlkEZvTRXrptObMScvVrDwkWr44AeDTE1DdsgrxL8F3',
        iconAnchor: [16,16]
      }),
      url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=sk.eyJ1IjoiamZvbmc3MDEiLCJhIjoiY2s3cDExa3lxMDIzNDNrcnNwdjJlbndkZCJ9.n2BIBzqJ9gyJyHjlxnNENw',
      attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      marker: L.latLng(43.7839, -79.1874),
      coor: null,
      userData: null,
      geofences: null,
      radarEvents: null,
      testVal: (this.coor)? this.coor : [43.78, -79.1873],
      iconSize: 24,
    };
  },
  computed: {
    dynamicSize () {
      return [this.iconSize, this.iconSize * 1.15];
    },
    dynamicAnchor () {
      return [this.iconSize / 2, this.iconSize * 1.15];
    }
  },
  created () {
    this.userData = this.displayUsers();
    this.geofences =  this.displayGeofences();
    this.events = this.displayEvents();
  },
  methods:{
    displayUsers: function () {
      let self = this;
      Radar.getUsers(self).then(result => this.userData = result);
    },
    displayGeofences: function(){
      let self = this;
      Radar.getGeofences(self).then(result => this.geofences = result);
    },
    displayEvents: function(){
      let self = this;
      Radar.getRadarEvents(self).then(result => this.radarEvents = result);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>


</style>

<!---Reference:
http://jsfiddle.net/Boumi/k04zpLx9 --->
