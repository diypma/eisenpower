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

/**
 * Generate a traffic-light style color based on priority score
 * 
 * Creates a smooth gradient from red (low priority) through amber (medium)
 * to green (high priority). Uses HSL for smooth transitions.
 * 
 * Score ranges:
 * - 0-30:  Red/Coral (less engaging, less urgent)
 * - 30-60: Amber/Yellow (moderate attention)
 * - 60-100: Green/Emerald (inviting, high priority)
 * 
 * @param {number} score - Priority score (0-100)
 * @returns {Object} Color palette for the score
 */
export function getScoreColor(score) {
    // Clamp score to 0-100
    const s = Math.max(0, Math.min(100, score))

    // Map score to hue: 0 (red) -> 60 (yellow) -> 120 (green)
    // We use a slightly modified range for more pleasing colors
    // Low score (0) = hue 0 (red)
    // High score (100) = hue 145 (emerald green)
    const hue = (s / 100) * 145

    // Saturation: higher scores are more vibrant
    const saturation = 60 + (s / 100) * 20  // 60-80%

    // Lightness: keep consistent for readability
    const lightness = 45

    return {
        text: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        textLight: `hsl(${hue}, ${saturation}%, 55%)`,
        bg: `hsl(${hue}, ${saturation}%, 95%)`,
        bgDark: `hsl(${hue}, ${saturation - 10}%, 20%)`
    }
}
