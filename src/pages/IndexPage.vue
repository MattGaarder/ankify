<template>
  <q-page class="">
    <div class="q-pa-md q-gutter-sm">
      <q-btn color="black" :label="counter" size="xl" class="full-width q-mb-md"/>
      <div class="row">
        <div class="col">
          <q-btn flat round color="black" icon="remove" size="lg" @click="decreaseCounter"/>
        </div>
        <div class="col text-center">
          <q-btn flat round color="black" icon="restart_alt" size="lg" @click="resetCounter"/>
        </div>
        <div class="col text-right">
          <q-btn flat round color="black" icon="add" size="lg" @click="increaseCounter"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { ref } from 'vue';

  let counter = ref(2);

  const increaseCounter = () => {
    counter.value++;
  }

  const decreaseCounter = () => {
    counter.value--;
  }

  const resetCounter = () => {
    counter.value = 0;
  }

</script>
