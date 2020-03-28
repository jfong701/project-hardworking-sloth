import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import Router from './router';
import 'leaflet/dist/leaflet.css';

Vue.config.productionTip = false;

new Vue({
vuetify,
router: Router,
render: h => h(App),
}).$mount('#app');
