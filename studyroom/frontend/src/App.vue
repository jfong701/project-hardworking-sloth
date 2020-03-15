<template>
  <div >
    <User />
  </div>
</template>

<script>
import User from './components/User.vue'

export default {
  name: 'app',
  components: {
    User
  }
}
</script>

<style>
#user {
  display: flex;
}

#users {
  display: flex;
}

</style>
