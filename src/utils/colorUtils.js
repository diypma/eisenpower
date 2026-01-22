/**
 * colorUtils.js - Task Color Generation Utilities
 * 
 * Provides consistent, visually distinct colors for tasks based on their IDs.
 * Uses the golden angle (137.508°) for optimal hue distribution,
 * ensuring that even adjacent task IDs get visually distinct colors.
 */

/**
 * Generate a consistent color palette for a task based on its ID
 * 
 * Uses the golden angle technique to distribute hues evenly across the spectrum.
 * This ensures visually distinct colors even for sequentially created tasks.
 * 
 * @param {number} taskId - The unique task identifier
 * @returns {Object} Color palette with light, dark, border, and glow variants
 * @example
 * const colors = getTaskAccentColor(123);
 * // Returns: { light: 'hsl(...)', dark: 'hsl(...)', border: 'hsl(...)', glow: 'hsl(...)' }
 */
export function getTaskAccentColor(taskId) {
    // Golden angle ensures maximum visual separation between colors
    const hue = (taskId * 137.508) % 360

    return {
        light: `hsl(${hue}, 70%, 55%)`,      // Primary color for indicators
        dark: `hsl(${hue}, 60%, 45%)`,        // Darker variant for dark mode
        border: `hsl(${hue}, 80%, 60%)`,      // Border color for subtasks
        glow: `hsl(${hue}, 70%, 55%, 0.3)`    // Semi-transparent for ring effects
    }
}
