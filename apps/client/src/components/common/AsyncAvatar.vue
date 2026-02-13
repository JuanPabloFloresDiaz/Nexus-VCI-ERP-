<template>
  <v-avatar :color="color" :size="size">
    <v-skeleton-loader
      v-if="isLoading"
      class="w-100 h-100"
      :height="size"
      type="avatar"
      :width="size"
    />
    <v-img v-else-if="blobUrl" :alt="alt" cover :src="blobUrl">
      <template #placeholder>
        <v-row align="center" class="fill-height ma-0" justify="center">
          <v-progress-circular color="grey-lighten-5" indeterminate />
        </v-row>
      </template>
    </v-img>
    <span v-else class="text-caption font-weight-bold">{{ fallbackText }}</span>
  </v-avatar>
</template>

<script setup>
  import { onUnmounted, ref, watch } from 'vue';
  import { getImage } from '@/utils/getImage';

  const props = defineProps({
    src: {
      type: String,
      default: null
    },
    alt: {
      type: String,
      default: 'Avatar'
    },
    size: {
      type: [Number, String],
      default: 32
    },
    color: {
      type: String,
      default: 'surface-variant'
    },
    name: {
      type: String,
      default: ''
    }
  });

  const blobUrl = ref(null);
  const isLoading = ref(false);

  const fallbackText = ref('');

  async function load () {
    // Reset
    if (blobUrl.value && blobUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl.value);
    }
    blobUrl.value = null;

    // Set fallback
    if (props.name) {
      fallbackText.value = props.name.charAt(0).toUpperCase();
    }

    if (!props.src) {
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    try {
      const url = await getImage(props.src);
      if (url) {
        blobUrl.value = url;
      }
    } catch (error) {
      console.error('Failed to load avatar', error);
    } finally {
      isLoading.value = false;
    }
  }

  watch(() => props.src, load, { immediate: true });
  watch(() => props.name, () => {
    if (props.name) fallbackText.value = props.name.charAt(0).toUpperCase();
  });

  onUnmounted(() => {
    if (blobUrl.value && blobUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl.value);
    }
  });
</script>
