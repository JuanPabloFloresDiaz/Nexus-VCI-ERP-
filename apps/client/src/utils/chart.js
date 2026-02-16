import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- Color Palette (Slate & Tech Blue) ---
export const colors = {
    primary: '#1E293B',    // Slate 800
    secondary: '#3B82F6',  // Blue 500
    accent: '#F59E0B',     // Amber 500
    success: '#10B981',    // Emerald 500
    info: '#0EA5E9',       // Sky 500
    error: '#E11D48',      // Rose 600
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',    // White
    text: '#334155',       // Slate 700
    grid: '#E2E8F0'        // Slate 200
};

// --- Defaults ---
ChartJS.defaults.font.family = 'Roboto, sans-serif';
ChartJS.defaults.color = colors.text;
ChartJS.defaults.scale.grid.color = colors.grid;
ChartJS.defaults.scale.grid.borderDash = [5, 5];
ChartJS.defaults.plugins.tooltip.backgroundColor = colors.primary;
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;

// --- Helper to create gradients ---
export function createGradient (ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

// --- Common Options ---
export const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 20,
                font: { size: 12 }
            }
        }
    },
    scales: {
        x: {
            grid: { display: false }
        },
        y: {
            grid: { borderDash: [4, 4] },
            beginAtZero: true
        }
    }
};
