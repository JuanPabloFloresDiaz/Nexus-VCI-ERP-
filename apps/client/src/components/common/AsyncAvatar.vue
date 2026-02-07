<template>
  <v-avatar :size="size" :color="color">
    <v-skeleton-loader v-if="isLoading" type="avatar" :width="size" :height="size" class="w-100 h-100"></v-skeleton-loader>
    <v-img v-else-if="blobUrl" :src="blobUrl" :alt="alt" cover>
      <template v-slot:placeholder>
           <v-row class="fill-height ma-0" align="center" justify="center">
             <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
           </v-row>
      </template>
    </v-img>
    <span v-else class="text-caption font-weight-bold">{{ fallbackText }}</span>
  </v-avatar>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
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

const load = async () => {
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
    } catch (e) {
        console.error('Failed to load avatar', e);
    } finally {
        isLoading.value = false;
    }
};

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
