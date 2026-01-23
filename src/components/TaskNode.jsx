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

import { useRef, useState, useEffect } from 'react'
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

export default function TaskNode({
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
    onReturnSubtask
}) {
    // ==========================================================================
    // STATE & REFS
    // ==========================================================================

    const [isDragging, setIsDragging] = useState(false)

    // Track drag state without causing re-renders
    const dragRef = useRef({
        startX: 0,
        startY: 0,
        initialTaskX: 0,
        initialTaskY: 0,
        startTime: 0,
        totalDist: 0
    })

    const nodeRef = useRef(null)

    // Use ref for onMove to avoid stale closures in event listeners
    const onMoveRef = useRef(onMove)
    onMoveRef.current = onMove

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
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
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

            onMoveRef.current(task.id, clampedX, clampedY)
        }

        /**
         * Handle drag end (mouse up or touch end)
         * Determines if this was a click or a drag
         */
        const handleMouseUp = (e) => {
            const clientX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0)
            const clientY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0)

            setIsDragging(false)

            // Set global timestamp when drag ends - used by GraphPaper to ignore false clicks
            window.__eisenpowerLastDragEnd = Date.now()

            const duration = Date.now() - dragRef.current.startTime
            const distance = dragRef.current.totalDist

            // Short, small movement = Click (expand task details)
            if (duration < 250 && distance < 6) {
                onExpand(task.id)
                return
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
        }

        /**
         * Handle touch movement during drag
         * Similar to mouse but uses touch coordinates
         */
        const handleTouchMove = (e) => {
            if (!containerRef.current) return
            e.preventDefault() // Prevent scrolling while dragging

            const touch = e.touches[0]
            const rect = containerRef.current.getBoundingClientRect()
            const deltaX = touch.clientX - dragRef.current.startX
            const deltaY = touch.clientY - dragRef.current.startY

            dragRef.current.totalDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

            const newX = dragRef.current.initialTaskX + (deltaX / rect.width) * 100
            const newY = dragRef.current.initialTaskY - (deltaY / rect.height) * 100

            const clampedX = Math.max(0, Math.min(100, newX))
            const clampedY = Math.max(0, Math.min(100, newY))

            onMoveRef.current(task.id, clampedX, clampedY)
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

        const clientX = e.clientX || e.touches[0].clientX
        const clientY = e.clientY || e.touches[0].clientY

        setIsDragging(true)
        dragRef.current = {
            startX: clientX,
            startY: clientY,
            initialTaskX: task.x,
            initialTaskY: task.y,
            startTime: Date.now(),
            totalDist: 0
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
    // Overflow handling is managed at container level
    const visualX = task.x
    const visualY = task.y

    return (
        <div
            ref={nodeRef}
            className={`absolute task-node pointer-events-auto cursor-grab active:cursor-grabbing select-none ${isDragging
                ? 'z-50 scale-110 shadow-2xl'
                : 'z-10 hover:scale-105 transition-all duration-200'
                } ${isHighlighted ? 'ring-4 ring-offset-2 rounded-2xl' : ''
                }`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseEnter={onMouseEnter}
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
                        : `p-3 min-w-[140px] max-w-[200px] bg-gradient-to-br ${getPriorityColor(priority)} text-white border-2 border-white/30`
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

                {/* Footer: Priority Score & Subtask Count */}
                {!isSubtaskNode && (
                    <div className="mt-1 flex justify-between items-center text-[10px] opacity-80 pt-1 border-t border-white/20">
                        <span>{priority.toFixed(0)} pts</span>
                        {subtaskCount > 0 && (
                            <span>{completedCount}/{subtaskCount} subtasks</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
