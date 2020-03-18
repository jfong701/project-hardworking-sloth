<template>
    <div>
        <h1>Study Room Finder</h1>
            <!-- TODO: Add any missing header elements -->
            <input type="search" name="search bar" id="search_bar">
            <router-link to="/login" replace>Login</router-link>
            <router-link  to="/secure" replace>Sign in</router-link>
            <router-link v-if="authenticated" to="/Homepage" replace>Sign out</router-link>
        <!-- TODO: Create map -->
        <footer>
              <a href="./credits.html">credits</a>
        </footer>
    </div>
</template>

<script>
    export default {
        name: 'Homepage',
        data() {
            return {
                input: {
                    username: "",
                    password: ""
                }
            }
        }
    }
</script>

<style scoped>

</style>