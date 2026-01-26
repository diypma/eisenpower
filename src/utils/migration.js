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

    const safeDate = (val) => {
        try {
            // fast-fail for small integers (demo IDs like 1, 2)
            if (typeof val === 'number' && val < 100000) return new Date().toISOString()

            // Handle strings that should be numbers
            const numVal = Number(val)
            if (!isNaN(numVal) && numVal > 100000) {
                return new Date(numVal).toISOString()
            }

            const d = new Date(val)
            if (isNaN(d.getTime())) return new Date().toISOString()
            return d.toISOString()
        } catch (e) {
            return new Date().toISOString()
        }
    }

    const formattedTasks = tasks.map(t => ({
        user_id: session.user.id,
        text: t.text,
        x_position: t.x,
        y_position: t.y,
        is_completed: t.completed || false,
        completed_at: t.completedAt ? safeDate(t.completedAt) : null,
        due_date: t.dueDate || null,
        duration_days: t.durationDays || null,
        auto_urgency: t.autoUrgency !== false,
        subtasks: t.subtasks || [],
        created_at: safeDate(t.id),
        updated_at: safeDate(t.updatedAt || t.id)
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
