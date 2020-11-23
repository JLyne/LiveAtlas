<template>
  <div class="sidebar pinned">
    <div class="panel">
      <div class="pin"></div>
      <WorldList></WorldList>
      <PlayerList></PlayerList>
      <div class="hitbar"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import PlayerList from './PlayerList.vue';
import WorldList from './WorldList.vue';

@Options({
  components: {
    PlayerList,
    WorldList,
  },
})
export default class Sidebar extends Vue {

}
</script>

<style scoped>

</style>