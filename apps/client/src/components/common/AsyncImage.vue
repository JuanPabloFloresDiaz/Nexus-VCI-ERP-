<template>
  <div class="position-relative fill-height w-100">
    <v-skeleton-loader 
        v-if="isLoading" 
        type="image" 
        class="w-100 h-100"
        :color="loaderColor"
    ></v-skeleton-loader>
    
    <v-img 
        v-else-if="blobUrl" 
        :src="blobUrl" 
        :alt="alt" 
        :cover="cover"
        :height="height"
        class="bg-grey-lighten-4"
    >
      <template v-slot:placeholder>
           <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
             <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
           </div>
      </template>
    </v-img>
    
    <div v-else class="d-flex align-center justify-center fill-height bg-grey-lighten-3 w-100 h-100 text-medium-emphasis">
        <v-icon :size="iconSize">{{ fallbackIcon }}</v-icon>
    </div>
  </div>
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
    default: 'Image'
  },
  height: {
    type: [Number, String],
    default: '100%'
  },
  cover: {
    type: Boolean,
    default: true
  },
  fallbackIcon: {
    type: String,
    default: 'mdi-image-off-outline'
  },
  iconSize: {
      type: [Number, String],
      default: 32
  },
  loaderColor: {
      type: String,
      default: 'surface'
  }
});

const blobUrl = ref(null);
const isLoading = ref(false);

const load = async () => {
    // Reset
    if (blobUrl.value && blobUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl.value);
    }
    blobUrl.value = null;

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
        console.error('Failed to load image', e);
    } finally {
        isLoading.value = false;
    }
};

watch(() => props.src, load, { immediate: true });

onUnmounted(() => {
    if (blobUrl.value && blobUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl.value);
    }
});
</script>
