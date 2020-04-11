<template>
    <div>
  <v-card
    class="mx-auto overflow-hidden"
    height="70"
  >
    <v-app-bar
      color="deep-purple"
      dark
    >
      <v-toolbar-title>Study Room Finder</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      absolute
      temporary
    >
      <v-list
        nav
        dense
      >
        <v-list-item-group
          v-model="group"
          active-class="deep-purple--text text--accent-4"
        >
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
                <router-link to="/Login" replace><v-list-item-title>Sign Out</v-list-item-title></router-link>
            </v-list-item-icon>
          </v-list-item>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-account</v-icon>
              <router-link  to="/SignUp" replace></router-link>
            </v-list-item-icon>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>

        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
  </v-card>
    <!-- -->
        <!-- TODO: Create map -->
        <div class="map">
        <Map/>
        </div>
        <footer>
              <a href="./credits.html">credits</a>
        </footer>
    </div>
</template>

<script>
import Map from "./Map.vue";
    export default {
        name: 'Homepage',
        data() {
            return {
                input: {
                    username: "",
                    password: ""
                },
                drawer: false
            }
        },
        components: {
            Map
        }
    }
</script>

<style scoped>
#map {
        width: 500px;
        border: 1px solid #CCCCCC;
        background-color: #FFFFFF;
        margin: auto;
        margin-top: 200px;
        padding: 20px;
    }

</style>
