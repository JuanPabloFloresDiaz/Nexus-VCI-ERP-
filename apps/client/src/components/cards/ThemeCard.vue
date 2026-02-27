<script setup>
defineProps({
  themeValue: { type: String, required: true },
  title: { type: String, required: true },
  colors: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})
defineEmits(['select'])
</script>

<template>
  <v-card
    :class="['theme-card', { 'selected-theme': selected }]"
    :elevation="selected ? 3 : 0"
    class="rounded-xl overflow-hidden cursor-pointer bg-surface"
    border
    @click="$emit('select', themeValue)"
  >
    <!-- Card Preview Area -->
    <div 
      class="preview-container pa-3 d-flex flex-column" 
      :style="{ backgroundColor: colors.background }"
    >
      <v-card 
        class="flex-grow-1 rounded-lg elevation-2 overflow-hidden d-flex flex-column border"
        :style="{ backgroundColor: colors.surface }"
      >
        <!-- Title bar -->
        <div :style="{ backgroundColor: colors.primary }" class="px-2 py-1 d-flex align-center">
          <div class="window-dot ml-1"></div>
          <div class="window-dot ml-1"></div>
          <div class="window-dot ml-1"></div>
        </div>
        <!-- Content Area -->
        <div class="d-flex flex-grow-1 pa-2 gap-2">
           <!-- Sidebar -->
           <div :style="{ backgroundColor: colors.secondary }" class="h-100 rounded-sm" style="width: 25%; opacity: 0.9;"></div>
           <!-- Content Lines -->
           <div class="flex-grow-1 pt-1">
             <div :style="{ backgroundColor: colors.primary }" class="content-line w-75 mb-1"></div>
             <div :style="{ backgroundColor: colors.primary }" class="content-line w-50 mb-1"></div>
             <div :style="{ backgroundColor: colors.primary }" class="content-line w-100"></div>
           </div>
        </div>
      </v-card>
    </div>
    
    <!-- Title Area -->
    <div class="d-flex align-center justify-center py-3 px-2 border-t bg-surface">
      <v-icon v-if="selected" color="primary" class="mr-2" size="small">mdi-check-circle</v-icon>
      <span :class="{'font-weight-bold text-primary': selected}" class="text-body-2 text-medium-emphasis">
        {{ title }}
      </span>
    </div>
  </v-card>
</template>

<style scoped>
.theme-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent !important;
}
.theme-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}
.selected-theme {
  border-color: rgb(var(--v-theme-primary)) !important;
}
.preview-container {
  height: 120px;
}
.window-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
  opacity: 0.6;
}
.content-line {
  height: 4px;
  border-radius: 2px;
  opacity: 0.2;
}
.gap-2 { gap: 8px; }
</style>
