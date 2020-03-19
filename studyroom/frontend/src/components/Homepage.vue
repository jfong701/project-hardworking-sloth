<template>
    <div>
        <h1>Study Room Finder</h1>
            <!-- TODO: Add any missing header elements -->
            <input type="search" name="search bar" id="search_bar">
            <router-link to="/login" replace>Login</router-link>
            <router-link  to="/SignUp" replace>Sign up</router-link>
            <router-link v-if="authenticated" to="/Homepage" replace>Sign out</router-link>
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
                }
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