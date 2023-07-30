<template>
  <div class="greetings">
    <h1 class="green">Video Transcript POC</h1>
    <h3>
      Demo
    </h3>
    <FileSelector/>
  </div>
</template>

<script lang="ts">
import FileSelector from '@/components/FileSelector.vue'

export default {
    components: {
        FileSelector,
    },
}
</script>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
