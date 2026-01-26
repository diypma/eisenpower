import { supabase } from '../lib/supabase'

/**
 * Migrates local tasks to the Supabase 'tasks' table.
 * 
 * @param {Array} tasks - The array of local task objects
 * @param {Object} session - The current Supabase session
 * @returns {Promise<{success: boolean, count: number, error: any}>}
 */
export const migrateTasksToRelational = async (tasks, session) => {
    if (!session?.user?.id) return { success: false, error: 'No authenticated user' }
    if (!tasks || tasks.length === 0) return { success: true, count: 0 }

    const formattedTasks = tasks.map(t => ({
        user_id: session.user.id,
        text: t.text,
        x_position: t.x,
        y_position: t.y,
        is_completed: t.completed || false,
        completed_at: t.completedAt || null,
        due_date: t.dueDate || null,
        duration_days: t.durationDays || null,
        auto_urgency: t.autoUrgency !== false, // Default to true if undefined
        subtasks: t.subtasks || [],
        created_at: new Date(t.id).toISOString(), // Assuming ID is timestamp
        updated_at: new Date(t.updatedAt || t.id).toISOString()
    }))

    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert(formattedTasks)
            .select()

        if (error) {
            console.error('Migration failed:', error)
            return { success: false, error }
        }

        return { success: true, count: data.length }
    } catch (err) {
        console.error('Migration exception:', err)
        return { success: false, error: err }
    }
}
