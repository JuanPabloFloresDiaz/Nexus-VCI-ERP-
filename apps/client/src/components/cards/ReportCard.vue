<script setup>
import { ref } from 'vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    params: {
        type: Array,
        default: () => [] // [{ name: 'startDate', label: 'Fecha Inicio', type: 'date' }, ...]
    },
    loading: {
        type: Boolean,
        default: false
    },
    iconType: {
        type: String,
        default: 'pdf', // 'pdf' or 'excel'
        validator: (value) => ['pdf', 'excel'].includes(value)
    }
});

const emit = defineEmits(['generate']);

const paramValues = ref({});

// Initialize param values
if (props.params) {
    props.params.forEach(p => {
        paramValues.value[p.name] = null;
    });
}

function onGenerate() {
    emit('generate', paramValues.value);
}
</script>

<template>
    <v-card class="d-flex flex-column h-100 rounded-lg elevation-2 hover-card" variant="elevated">
        <div class="d-flex flex-column align-center justify-center pt-6 pb-2 bg-grey-lighten-5">
            <!-- PDF SVG Icon -->
            <div style="width: 64px; height: 64px;">
                <svg v-if="iconType === 'pdf'" viewBox="0 0 75.32 92.604" class="w-100 h-100">
                    <path fill="#ff2116" d="M-29.633 123.947c-3.552 0-6.443 2.894-6.443 6.446v49.498c0 3.551 2.891 6.445 6.443 6.445h37.85c3.552 0 6.443-2.893 6.443-6.445v-40.702s.102-1.191-.416-2.351a6.516 6.516 0 0 0-1.275-1.844 1.058 1.058 0 0 0-.006-.008l-9.39-9.21a1.058 1.058 0 0 0-.016-.016s-.802-.764-1.99-1.274c-1.4-.6-2.842-.537-2.842-.537l.021-.002z" transform="translate(53.548 -183.975) scale(1.4843)"/>
                    <path fill="#f5f5f5" d="M-29.633 126.064h28.38a1.058 1.058 0 0 0 .02 0s1.135.011 1.965.368a5.385 5.385 0 0 1 1.373.869l9.368 9.19s.564.595.838 1.208c.22.495.234 1.4.234 1.4a1.058 1.058 0 0 0-.002.046v40.746a4.294 4.294 0 0 1-4.326 4.328h-37.85a4.294 4.294 0 0 1-4.326-4.328v-49.498a4.294 4.294 0 0 1 4.326-4.328z" transform="translate(53.548 -183.975) scale(1.4843)"/>
                    <path fill="#ff2116" d="M18.804 55.135c-2.162-2.162.177-5.133 6.526-8.288l3.994-1.985 1.557-3.405a134.054 134.054 0 0 0 2.838-6.79l1.283-3.386-.884-2.506c-1.087-3.08-1.474-7.71-.785-9.374.934-2.255 3.994-2.024 5.205.393.946 1.888.849 5.307-.272 9.618l-.92 3.534.81 1.375c.445.756 1.746 2.55 2.89 3.989l2.152 2.676 2.677-.35c8.503-1.11 11.416.777 11.416 3.48 0 3.413-6.677 3.695-12.284-.243-1.262-.886-2.128-1.767-2.128-1.767s-3.513.716-5.243 1.182c-1.785.48-2.675.782-5.29 1.665 0 0-.918 1.332-1.516 2.301-2.224 3.604-4.821 6.59-6.676 7.677-2.077 1.217-4.254 1.3-5.35.204zm3.393-1.212c1.216-.751 3.676-3.66 5.378-6.361l.69-1.093-3.14 1.578c-4.848 2.438-7.066 4.735-5.913 6.125.648.78 1.423.716 2.985-.25zm31.494-8.84c1.189-.833 1.016-2.51-.328-3.187-1.045-.527-1.888-.635-4.606-.595-1.67.114-4.354.45-4.81.553 0 0 1.476 1.02 2.13 1.394.872.498 2.99 1.422 4.537 1.895 1.526.467 2.409.418 3.077-.06zm-12.663-5.264c-.72-.756-1.943-2.334-2.719-3.507-1.014-1.33-1.523-2.27-1.523-2.27s-.741 2.386-1.35 3.82l-1.898 4.692-.55 1.065s2.925-.96 4.414-1.348c1.576-.412 4.776-1.041 4.776-1.041zm-4.081-16.365c.184-1.54.261-3.078-.233-3.853-1.373-1.5-3.03-.25-2.749 3.318.095 1.2.393 3.25.791 4.515l.725 2.299.51-1.732c.28-.952.71-2.998.956-4.547z"/><path fill="#2c2c2c" d="M-20.93 167.839h2.365q1.133 0 1.84.217.706.21 1.19.944.482.728.482 1.756 0 .945-.392 1.624-.392.678-1.056.98-.658.3-2.03.3h-.818v3.73h-1.581zm1.58 1.224v3.33h.785q1.05 0 1.448-.391.406-.392.406-1.274 0-.657-.266-1.063-.266-.413-.588-.504-.315-.098-1-.098zm5.508-1.224h2.148q1.56 0 2.49.552.938.553 1.414 1.645.483 1.091.483 2.42 0 1.4-.434 2.499-.427 1.091-1.316 1.763-.881.672-2.518.672h-2.267zm1.58 1.266v7.018h.659q1.378 0 2-.952.623-.958.623-2.553 0-3.513-2.623-3.513zm6.473-1.266h5.304v1.266h-3.723v2.855h2.981v1.266h-2.98v4.164H-5.79z" transform="translate(53.548 -183.975) scale(1.4843)"/>
                </svg>

                <svg v-else-if="iconType === 'excel'" viewBox="0 0 486 500"><defs><radialGradient id="microsoft_excel__a" cx="-746.66" cy="781.44" r="13.89" fx="-746.66" fy="781.44" gradientTransform="matrix(-28.32596 -29.80763 -23.11916 21.97986 -2596.39 -38900.31)" gradientUnits="userSpaceOnUse"><stop offset=".06" stop-color="#379539"/><stop offset=".42" stop-color="#297c2d"/><stop offset=".7" stop-color="#15561c"/></radialGradient><radialGradient id="microsoft_excel__b" cx="-773.19" cy="771.25" r="13.89" fx="-773.19" fy="771.25" gradientTransform="matrix(-11.97612 -11.58137 -8.95853 9.26806 -2155.12 -15858.88)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#073b10"/><stop offset=".99" stop-color="#084a13" stop-opacity="0"/></radialGradient><radialGradient id="microsoft_excel__f" cx="-824.11" cy="810.99" r="13.89" fx="-824.11" fy="810.99" gradientTransform="matrix(-9.02 0 0 19.09 -7120.4 -15378.69)" gradientUnits="userSpaceOnUse"><stop offset=".29" stop-color="#4eb43b"/><stop offset="1" stop-color="#72cc61" stop-opacity="0"/></radialGradient><radialGradient id="microsoft_excel__h" cx="-769.14" cy="808.9" r="13.89" fx="-769.14" fy="808.9" gradientTransform="matrix(-16.9077 -13.68182 13.64112 -16.86345 -23523.37 3309.71)" gradientUnits="userSpaceOnUse"><stop offset=".44" stop-color="#79e96d"/><stop offset="1" stop-color="#d0eb76"/></radialGradient><radialGradient id="microsoft_excel__i" cx="-675.64" cy="793.28" r="13.89" fx="-675.64" fy="793.28" gradientTransform="matrix(15.99196 15.99755 45.54153 -45.54797 -25315.85 47178.18)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#20a85e"/><stop offset=".94" stop-color="#09442a"/></radialGradient><radialGradient id="microsoft_excel__j" cx="-657.62" cy="853.99" r="13.89" fx="-657.62" fy="853.99" gradientTransform="matrix(0 11.2 12.9 0 -10902.85 7734.8)" gradientUnits="userSpaceOnUse"><stop offset=".58" stop-color="#33a662" stop-opacity="0"/><stop offset=".97" stop-color="#98f0b0"/></radialGradient><linearGradient id="microsoft_excel__c" x1="69.43" x2="260.84" y1="210.33" y2="210.33" gradientTransform="matrix(1 0 0 -1 0 502)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#52d17c"/><stop offset=".33" stop-color="#4aa647"/></linearGradient><linearGradient id="microsoft_excel__d" x1="194.4" x2="194.4" y1="335.33" y2="161.68" gradientTransform="matrix(1 0 0 -1 0 502)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#29852f"/><stop offset=".5" stop-color="#4aa647" stop-opacity="0"/></linearGradient><linearGradient id="microsoft_excel__e" x1="80.49" x2="311.45" y1="297.22" y2="497.54" gradientTransform="matrix(1 0 0 -1 0 502)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#66d052"/><stop offset="1" stop-color="#85e972"/></linearGradient><linearGradient id="microsoft_excel__g" x1="182.11" x2="69.43" y1="377" y2="377" gradientTransform="matrix(1 0 0 -1 0 502)" gradientUnits="userSpaceOnUse"><stop offset=".18" stop-color="#c0e075" stop-opacity="0"/><stop offset="1" stop-color="#d1eb95"/></linearGradient></defs><path d="M69.43 159.72c0-34.52 27.98-62.5 62.49-62.5h354.09v361.11c0 23.01-18.65 41.67-41.66 41.67H152.74c-46.01 0-83.31-37.31-83.31-83.33V159.72Z" style="fill:url(#microsoft_excel__a)"/><path d="M69.43 159.72c0-34.52 27.98-62.5 62.49-62.5h354.09v361.11c0 23.01-18.65 41.67-41.66 41.67H152.74c-46.01 0-83.31-37.31-83.31-83.33V159.72Z" style="fill:url(#microsoft_excel__b);fill-opacity:.7"/><path d="M69.43 229.17c0-34.52 27.98-62.5 62.49-62.5h187.46c-23.01 0-41.66 18.66-41.66 41.67v83.33c0 23.01-18.65 41.67-41.66 41.67h-83.31c-46.01 0-83.31 37.31-83.31 83.33v-187.5Z" style="fill:url(#microsoft_excel__c)"/><path d="M69.43 229.17c0-34.52 27.98-62.5 62.49-62.5h187.46c-23.01 0-41.66 18.66-41.66 41.67v83.33c0 23.01-18.65 41.67-41.66 41.67h-83.31c-46.01 0-83.31 37.31-83.31 83.33v-187.5Z" style="fill:url(#microsoft_excel__d);fill-opacity:.3"/><path d="M69.43 83.33C69.43 37.31 106.73 0 152.74 0h166.63v166.67H152.74c-46.01 0-83.31 37.31-83.31 83.33V83.33Z" style="fill:url(#microsoft_excel__e)"/><path d="M69.43 83.33C69.43 37.31 106.73 0 152.74 0h166.63v166.67H152.74c-46.01 0-83.31 37.31-83.31 83.33V83.33Z" style="fill:url(#microsoft_excel__f)"/><path d="M69.43 83.33C69.43 37.31 106.73 0 152.74 0h166.63v166.67H152.74c-46.01 0-83.31 37.31-83.31 83.33V83.33Z" style="fill:url(#microsoft_excel__g)"/><rect width="208.29" height="166.67" x="277.71" rx="41.66" ry="41.66" style="fill:url(#microsoft_excel__h)"/><rect width="222.17" height="222.22" y="236.11" rx="45.13" ry="45.13" style="fill:url(#microsoft_excel__i)"/><rect width="222.17" height="222.22" y="236.11" rx="45.13" ry="45.13" style="fill-opacity:.3;fill:url(#microsoft_excel__j)"/><path d="M169.48 410.71h-34.25l-21.5-40.47c-.77-1.42-1.36-2.54-1.77-3.37-.35-.88-.74-1.89-1.15-3.01h-.35c-.53 1.42-1.03 2.57-1.5 3.45-.47.89-1.03 1.98-1.68 3.28l-22.3 40.11h-32.3l38.76-63.58-36.1-63.4h33.8l19.11 36.13c.77 1.48 1.42 2.78 1.95 3.9.59 1.06 1.18 2.33 1.77 3.81h.35l1.95-4.07c.53-1 1.24-2.33 2.12-3.98l19.82-35.77h32.21l-36.63 62.43 37.7 64.55Z" style="fill:#fff"/></svg>
            </div>
        </div>

        <v-card-title class="text-h6 font-weight-bold pt-4 text-center">
            {{ title }}
        </v-card-title>
        
        <v-card-text class="text-center flex-grow-1">
            <p class="text-body-2 text-medium-emphasis mb-4">
                {{ description }}
            </p>

            <v-expand-transition>
                <div v-if="params && params.length > 0">
                    <v-divider class="mb-4"></v-divider>
                    <div v-for="param in params" :key="param.name" class="mb-2">
                        <v-text-field
                            v-if="param.type === 'date'"
                            v-model="paramValues[param.name]"
                            type="date"
                            :label="param.label"
                            variant="outlined"
                            density="compact"
                            hide-details
                        ></v-text-field>
                        
                        <v-select
                             v-else-if="param.type === 'select'"
                            v-model="paramValues[param.name]"
                            :items="param.items"
                            :label="param.label"
                             variant="outlined"
                            density="compact"
                            hide-details
                            item-title="title"
                            item-value="value"
                        ></v-select>
                    </div>
                </div>
            </v-expand-transition>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
            <v-btn
                block
                color="primary"
                variant="flat"
                prepend-icon="mdi-download"
                @click="onGenerate"
                :loading="loading"
            >
                Generar Reporte
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<style scoped>
.hover-card {
    transition: transform 0.2s, box-shadow 0.2s;
}
.hover-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}
</style>
