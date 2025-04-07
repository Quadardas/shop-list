<template>
  <VaModal
      v-model="showConfirm"
      ok-text="Удалить"
      cancel-text="Отмена"
      @ok="onConfirm"
      @cancel="onCancel"
  >
    <h3 class="va-h3">Подтверждение удаления</h3>
    <p>Вы уверены, что хотите удалить?</p>
  </VaModal>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {VaModal} from "vuestic-ui";

const showConfirm = ref(false)
const emit = defineEmits(['confirm', 'cancel'])

const onConfirm = () => {
  emit('confirm')
  showConfirm.value = false
}

const onCancel = () => {
  emit('cancel')
  showConfirm.value = false
}

defineExpose({
  show: () => showConfirm.value = true,
  hide: () => showConfirm.value = false
})
</script>