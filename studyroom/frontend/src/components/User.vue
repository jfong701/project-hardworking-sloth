<template>
  <div class="user">
      <div class="users">
    <h1>Map</h1>
      </div>
    <div class="users">
        <Map />
    </div>
  </div>
</template>

<script>
import Map from './Map.vue'

export default {
  name: 'User',
  components: {
      Map
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

#user {
  display: flex;
  flex-direction: row;
}

#users {
  display: flex;
}

</style>