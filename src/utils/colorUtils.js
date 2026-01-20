// Generate a consistent color for a task based on its ID
export function getTaskAccentColor(taskId) {
    // Use task ID to generate a consistent hue
    const hue = (taskId * 137.508) % 360 // Golden angle for good distribution

    return {
        light: `hsl(${hue}, 70%, 55%)`,
        dark: `hsl(${hue}, 60%, 45%)`,
        border: `hsl(${hue}, 80%, 60%)`,
        glow: `hsl(${hue}, 70%, 55%, 0.3)`
    }
}
