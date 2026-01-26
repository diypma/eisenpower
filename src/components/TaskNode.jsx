/**
 * TaskNode.jsx - Draggable Task Card Component
 * 
 * Renders an individual task or subtask on the Eisenhower Matrix grid.
 * Supports both mouse and touch interactions for cross-platform compatibility.
 * 
 * Features:
 * - Drag-and-drop positioning on the grid
 * - Click to expand task details
 * - Visual priority coloring based on urgency/importance
 * - Color-coded accent for task family identification
 * - Subtask return-to-parent detection
 */

import { useRef, useState, useEffect, memo } from 'react'
import { getTaskAccentColor, getScoreColor } from '../utils/colorUtils'

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

/**
 * Get gradient color class based on priority score
 * Traffic light system: High = Green (inviting), Low = Red (less engaging)
 * @param {number} score - Priority score (0-100)
 * @returns {string} Tailwind gradient classes
 */
function getPriorityColor(score) {
    if (score >= 80) return 'from-emerald-400 to-green-400'     // High priority - inviting green
    if (score >= 60) return 'from-green-400 to-lime-400'        // Good priority - lime green
    if (score >= 40) return 'from-amber-400 to-yellow-400'      // Medium priority - amber
    if (score >= 20) return 'from-orange-400 to-amber-400'      // Lower priority - orange
    return 'from-red-400 to-orange-400'                          // Lowest priority - red
}

// ==========================================================================
// COMPONENT
// ==========================================================================

const TaskNode = memo(function TaskNode({
    task,
    onMove,
    onDelete,
    onExpand,
    containerRef,
    isSubtaskNode = false,
    parentAccentColor = null,
    onMouseEnter,
    onMouseLeave,
    isHighlighted = false,
    onReturnSubtask,
    onUpdateTask,
    onMoveEnd
}) {
    // ==========================================================================
    // STATE & REFS
    // ==========================================================================

    const [isDragging, setIsDragging] = useState(false)
    const [dragPosition, setDragPosition] = useState(null)

    // Track drag state without causing re-renders
    const dragRef = useRef({
        startX: 0,
        startY: 0,
        initialTaskX: 0,
        initialTaskY: 0,
        startTime: 0,
        totalDist: 0,
        rect: null
    })

    const nodeRef = useRef(null)

    // Use refs for callbacks to avoid dependency churn in listeners
    const onMoveRef = useRef(onMove)
    const onMoveEndRef = useRef(onMoveEnd)
    const onExpandRef = useRef(onExpand)

    useEffect(() => {
        onMoveRef.current = onMove
        onMoveEndRef.current = onMoveEnd
        onExpandRef.current = onExpand
    }, [onMove, onMoveEnd, onExpand])

    // ==========================================================================
    // COMPUTED VALUES
    // ==========================================================================

    // Calculate priority score: 60% importance + 40% urgency
    const priority = (task.y * 0.6) + (task.x * 0.4)

    // Get accent color (inherit from parent if subtask)
    const accentColor = isSubtaskNode && parentAccentColor
        ? parentAccentColor
        : getTaskAccentColor(task.parentId || task.id)

    const subtaskCount = task.subtasks?.length || 0
    const completedCount = task.subtasks?.filter(s => s.completed)?.length || 0

    // ==========================================================================
    // DRAG HANDLERS
    // ==========================================================================

    useEffect(() => {
        if (!isDragging) return

        /**
         * Handle mouse movement during drag
         * Converts pixel movement to percentage coordinates
         */
        const handleMouseMove = (e) => {
            const rect = dragRef.current.rect
            if (!rect) return

            const deltaX = e.clientX - dragRef.current.startX
            const deltaY = e.clientY - dragRef.current.startY

            // Track total distance for click/drag differentiation
            dragRef.current.totalDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

            // Calculate new position as percentage
            const newX = dragRef.current.initialTaskX + (deltaX / rect.width) * 100
            const newY = dragRef.current.initialTaskY - (deltaY / rect.height) * 100

            // Clamp to grid bounds (0-100%)
            const clampedX = Math.max(0, Math.min(100, newX))
            const clampedY = Math.max(0, Math.min(100, newY))

            // Update LOCAL state only (fast re-render of just this node)
            setDragPosition({ x: clampedX, y: clampedY })
        }

        /**
         * Handle drag end (mouse up or touch end)
         * Determines if this was a click or a drag
         */
        const handleMouseUp = (e) => {
            const clientX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0)
            const clientY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0)

            setIsDragging(false)

            // Get final position from state and reset it
            setDragPosition(prev => {
                const finalX = prev?.x ?? task.x
                const finalY = prev?.y ?? task.y

                // Set global timestamp when drag ends - used by GraphPaper to ignore false clicks
                window.__eisenpowerLastDragEnd = Date.now()

                const duration = Date.now() - dragRef.current.startTime
                const distance = dragRef.current.totalDist

                // Short, small movement = Click (expand task details)
                if (duration < 250 && distance < 6) {
                    onExpandRef.current(task.id)
                    return null
                }

                // It was a drag! Commit the final position to parent and database
                if (onMoveRef.current) {
                    onMoveRef.current(task.id, finalX, finalY)
                }
                if (onMoveEndRef.current) {
                    onMoveEndRef.current(task.id, finalX, finalY)
                }

                // Check if subtask was dropped back onto its parent task
                if (isSubtaskNode && task.parentId && onReturnSubtask) {
                    const parentNode = document.querySelector(`.task-node[data-task-id="${task.parentId}"]`)

                    if (parentNode) {
                        const rect = parentNode.getBoundingClientRect()
                        const isOverParent = (
                            clientX >= rect.left &&
                            clientX <= rect.right &&
                            clientY >= rect.top &&
                            clientY <= rect.bottom
                        )

                        if (isOverParent) {
                            onReturnSubtask(task.parentId, task.id)
                        }
                    }
                }

                return null
            })
        }

        /**
         * Handle touch movement during drag
         * Similar to mouse but uses touch coordinates
         */
        const handleTouchMove = (e) => {
            e.preventDefault() // Prevent scrolling while dragging

            const touch = e.touches[0]
            const rect = dragRef.current.rect
            if (!rect) return

            const deltaX = touch.clientX - dragRef.current.startX
            const deltaY = touch.clientY - dragRef.current.startY

            dragRef.current.totalDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

            const newX = dragRef.current.initialTaskX + (deltaX / rect.width) * 100
            const newY = dragRef.current.initialTaskY - (deltaY / rect.height) * 100

            const clampedX = Math.max(0, Math.min(100, newX))
            const clampedY = Math.max(0, Math.min(100, newY))

            // Update LOCAL state
            setDragPosition({ x: clampedX, y: clampedY })
        }

        // Attach global listeners for drag tracking
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('touchmove', handleTouchMove, { passive: false })
        window.addEventListener('touchend', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleMouseUp)
        }
    }, [isDragging, task.id, containerRef, onExpand, isSubtaskNode, task.parentId, onReturnSubtask])

    /**
     * Handle drag start (mouse down or touch start)
     * Records initial position for delta calculations
     */
    const handleMouseDown = (e) => {
        // Only left-click, ignore clicks on buttons
        if ((e.type === 'mousedown' && e.button !== 0) || e.target.closest('button')) return
        if (!containerRef.current) return

        const clientX = e.clientX || e.touches[0].clientX
        const clientY = e.clientY || e.touches[0].clientY

        const rect = containerRef.current.getBoundingClientRect()

        setIsDragging(true)
        // Initialize drag pos to current pos
        setDragPosition({ x: task.x, y: task.y })

        dragRef.current = {
            startX: clientX,
            startY: clientY,
            initialTaskX: task.x,
            initialTaskY: task.y,
            startTime: Date.now(),
            totalDist: 0,
            rect
        }

        // Prevent default for proper drag behavior
        if (e.type === 'touchstart') {
            e.stopPropagation()
        } else {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    // ==========================================================================
    // RENDER
    // ==========================================================================

    // Use direct coordinates - allow tasks to position at true 0-100%
    // If dragging, use local high-frame-rate position. If idle, use props (source of truth).
    const visualX = dragPosition ? dragPosition.x : task.x
    const visualY = dragPosition ? dragPosition.y : task.y

    // Calculate priority from visual position for live updates during drag
    const currentPriority = (visualY * 0.6) + (visualX * 0.4)

    return (
        <div
            ref={nodeRef}
            className={`absolute task-node pointer-events-auto cursor-grab active:cursor-grabbing select-none ${isDragging
                ? 'z-50 scale-110 shadow-2xl'
                : 'z-10 hover:scale-105 transition-all duration-200'
                } ${isHighlighted ? 'ring-4 ring-offset-2 rounded-2xl' : ''
                } ${task.urgencyShifted ? 'animate-pulse-urgency' : ''}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseEnter={(e) => {
                onMouseEnter?.(e);
                if (task.urgencyShifted) onUpdateTask?.(task.id, { urgencyShifted: false });
            }}
            onMouseLeave={onMouseLeave}
            data-task-id={task.id}
            style={{
                left: `${visualX}%`,
                bottom: `${visualY}%`,
                transform: 'translate(-50%, 50%)',
                touchAction: 'none', // Prevent scroll while dragging
                ...(isHighlighted ? {
                    '--tw-ring-color': accentColor.glow,
                    '--tw-ring-offset-color': 'transparent'
                } : {})
            }}
        >
            {/* Task Card */}
            <div
                className={`
                    rounded-2xl shadow-lg relative
                    ${isSubtaskNode
                        ? 'p-2 min-w-[100px] max-w-[150px] bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2'
                        : `p-3 min-w-[140px] max-w-[200px] bg-gradient-to-br ${getPriorityColor(currentPriority)} text-white border-2 border-white/30`
                    }
                    font-semibold text-sm
                    ${isDragging ? 'ring-4 ring-indigo-200/50' : 'hover:shadow-xl'}
                `}
                style={isSubtaskNode ? {
                    borderLeftColor: accentColor.border,
                    borderLeftWidth: '4px'
                } : {}}
            >
                {/* Color Accent Pip (for parent tasks) */}
                {!isSubtaskNode && (
                    <div
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900"
                        style={{ backgroundColor: accentColor.light }}
                    />
                )}

                <div className="flex items-start justify-between gap-2 overflow-hidden">
                    <span className={`leading-tight break-words line-clamp-4 ${isSubtaskNode ? 'text-xs' : ''}`}>{task.text}</span>
                </div>

                {/* Due Date Info */}
                {task.dueDate && !isSubtaskNode && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-white/90">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {(() => {
                            const days = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                            if (days < 0) return 'Overdue';
                            if (days === 0) return 'Due Today';
                            return `${days}d left`;
                        })()}
                    </div>
                )}

                {/* Footer: Priority Score & Subtask Count */}
                {!isSubtaskNode && (
                    <div className="mt-1 flex justify-between items-center text-[10px] opacity-80 pt-1 border-t border-white/20">
                        <span>{currentPriority.toFixed(0)} pts</span>
                        {subtaskCount > 0 && (
                            <span>{completedCount}/{subtaskCount} subtasks</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
})

export default TaskNode
