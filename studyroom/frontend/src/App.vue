<template>
    <div id="app">
        <div id="nav">
        </div>
        <router-view />
    </div>
</template>

<script>
    export default {
        name: 'App',
        data() {
            return {
            }
        },
        mounted() {
            this.$router.replace({ name: "Login" });
        }
    }
</script>

<style>
    body {
        background-color: rgba(16, 85, 141, 0.986);
    }
    h1 {
        padding: 0;
        margin-top: 0;
    }
    #app {
        width: 1024px;
        margin: auto;
    }
</style>