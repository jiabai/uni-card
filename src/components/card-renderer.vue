<template>
  <uni-ticket-card
    v-if="templateId === 'ticket'"
    :date="fields.date"
    :author="fields.author"
    :content="fields.content"
  />
  <uni-glow-card
    v-else-if="templateId === 'glow'"
    :title="fields.title"
    :date="fields.date"
    :content="fields.content"
    :sign="fields.sign"
    :qr-text="fields.qrText"
  />
</template>

<script setup>
defineProps({
  templateId: {
    type: String,
    required: true,
  },
  fields: {
    type: Object,
    default: () => ({}),
  },
})
</script>
