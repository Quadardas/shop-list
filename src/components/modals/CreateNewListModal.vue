<template>
  <VaButton @click="showModal = !showModal"
            class="ml-4 mb-4">
    Добавить список
  </VaButton>
  <VaModal
      v-model="showModal"
      ok-text="Добавить"
      cancel-text="Отмена"
      @ok="onConfirm"
      @cancel="onCancel"
  >
    <VaInput
        v-model="maskedValue"
        label="Название списка"
        maxlength="20"
        strict-bind-input-value
    />
  </VaModal>
</template>

<script lang="ts" setup>
import {computed, ref} from "vue";
import {VaButton, VaInput, VaModal} from "vuestic-ui";

const showModal = ref(false);
const listName = ref("");

const maskedValue = computed({
  get() {
    return listName.value
  },
  set(v) {
    listName.value = v.slice(0, 20)
  }
})

const emit = defineEmits<{
  (e: 'confirm', name: string): void;
  (e: 'cancel'): void;
}>();

const onConfirm = () => {
  emit('confirm', maskedValue.value);
  showModal.value = false
  listName.value = '';
}

const onCancel = () => {
  emit('cancel')
  showModal.value = false
}

defineExpose({
  show: () => showModal.value = true,
  hide: () => showModal.value = false
})
</script>