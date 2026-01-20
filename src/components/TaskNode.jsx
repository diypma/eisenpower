import { useRef, useState, useEffect } from 'react'
import { getTaskAccentColor } from '../utils/colorUtils'

function getPriorityColor(score) {
    if (score >= 80) return 'from-red-400 to-orange-400'
    if (score >= 60) return 'from-orange-400 to-amber-400'
    if (score >= 40) return 'from-amber-400 to-yellow-400'
    if (score >= 20) return 'from-blue-400 to-indigo-400'
    return 'from-slate-300 to-slate-400'
}

export default function TaskNode({ task, onMove, onDelete, onExpand, containerRef, isSubtaskNode = false, parentAccentColor = null, onMouseEnter, onMouseLeave, isHighlighted = false, onReturnSubtask }) {
    const [isDragging, setIsDragging] = useState(false)
    const dragRef = useRef({
        startX: 0,
        startY: 0,
        initialTaskX: 0,
        initialTaskY: 0,
        startTime: 0,
        totalDist: 0
    })

    // Use a ref for onMove to avoid stale closures in listeners
    const onMoveRef = useRef(onMove)
    onMoveRef.current = onMove

    const priority = (task.y * 0.6) + (task.x * 0.4)

    // Get accent color for this task (or use parent's if it's a subtask)
    const accentColor = isSubtaskNode && parentAccentColor
        ? parentAccentColor
        : getTaskAccentColor(task.parentId || task.id)

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const deltaX = e.clientX - dragRef.current.startX
            const deltaY = e.clientY - dragRef.current.startY

            // Track movement distance for click vs drag threshold
            dragRef.current.totalDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

            // Calculate new percentage based on mouse movement
            const newX = dragRef.current.initialTaskX + (deltaX / rect.width) * 100
            const newY = dragRef.current.initialTaskY - (deltaY / rect.height) * 100

            // Clamp to 0-100
            const clampedX = Math.max(0, Math.min(100, newX))
            const clampedY = Math.max(0, Math.min(100, newY))

            onMoveRef.current(task.id, clampedX, clampedY)
        }

        const handleMouseUp = (e) => {
            setIsDragging(false)

            const duration = Date.now() - dragRef.current.startTime
            const distance = dragRef.current.totalDist

            // Threshold: < 200ms and < 5px distance = Click (Expand)
            if (duration < 250 && distance < 6) {
                onExpand(task.id)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, task.id, containerRef, onExpand])

    const handleMouseDown = (e) => {
        // Only drag with left click and ignore if clicking delete button
        if (e.button !== 0 || e.target.closest('button')) return

        setIsDragging(true)
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialTaskX: task.x,
            initialTaskY: task.y,
            startTime: Date.now(),
            totalDist: 0
        }

        e.preventDefault()
        e.stopPropagation()
    }

    const subtaskCount = task.subtasks?.length || 0
    const completedCount = task.subtasks?.filter(s => s.completed)?.length || 0

    // Handle drop for parent tasks (to accept sub-tasks being returned)
    const handleDragOver = (e) => {
        if (isSubtaskNode) return // Only parent tasks accept drops
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e) => {
        if (isSubtaskNode) return // Only parent tasks accept drops
        e.preventDefault()
        e.stopPropagation()

        try {
            const json = e.dataTransfer.getData('application/json')
            if (json) {
                const data = JSON.parse(json)
                // Check if this is a sub-task being returned to its parent
                if (data.type === 'SUBTASK_MOVE' && data.parentId === task.id && onReturnSubtask) {
                    onReturnSubtask(task.id, data.subtaskId)
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div
            className={`absolute task-node pointer-events-auto cursor-grab active:cursor-grabbing select-none ${isDragging
                ? 'z-50 scale-110 shadow-2xl'
                : 'z-10 hover:scale-105 transition-all duration-200'
                } ${isHighlighted ? 'ring-4 ring-offset-2 rounded-2xl' : ''
                }`}
            style={{
                left: `${task.x}%`,
                bottom: `${task.y}%`,
                transform: 'translate(-50%, 50%)',
                ...(isHighlighted ? {
                    '--tw-ring-color': accentColor.glow,
                    '--tw-ring-offset-color': 'transparent'
                } : {})
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggable={isSubtaskNode}
            onDragStart={(e) => {
                if (isSubtaskNode && task.parentId) {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'SUBTASK_MOVE',
                        parentId: task.parentId,
                        subtaskId: task.id,
                        text: task.text
                    }))
                    e.dataTransfer.effectAllowed = 'move'
                }
            }}
        >
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
                {/* Accent pip for parent tasks */}
                {!isSubtaskNode && (
                    <div
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900"
                        style={{ backgroundColor: accentColor.light }}
                    />
                )}
                <div className="flex items-start justify-between gap-2">
                    <span className={`leading-tight ${isSubtaskNode ? 'text-xs' : ''}`}>{task.text}</span>
                </div>
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
