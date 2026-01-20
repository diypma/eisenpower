import { useRef, useState, useEffect } from 'react'

function getPriorityColor(score) {
    if (score >= 80) return 'from-red-400 to-orange-400'
    if (score >= 60) return 'from-orange-400 to-amber-400'
    if (score >= 40) return 'from-amber-400 to-yellow-400'
    if (score >= 20) return 'from-blue-400 to-indigo-400'
    return 'from-slate-300 to-slate-400'
}

export default function TaskNode({ task, onMove, onDelete, containerRef }) {
    const [isDragging, setIsDragging] = useState(false)
    const dragRef = useRef({
        startX: 0,
        startY: 0,
        initialTaskX: 0,
        initialTaskY: 0
    })

    // Use a ref for onMove to avoid stale closures in listeners
    const onMoveRef = useRef(onMove)
    onMoveRef.current = onMove

    const priority = (task.y * 0.6) + (task.x * 0.4)

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const deltaX = e.clientX - dragRef.current.startX
            const deltaY = e.clientY - dragRef.current.startY

            // Calculate new percentage based on mouse movement
            const newX = dragRef.current.initialTaskX + (deltaX / rect.width) * 100
            const newY = dragRef.current.initialTaskY - (deltaY / rect.height) * 100 // Invert Y

            // Clamp to 0-100
            const clampedX = Math.max(0, Math.min(100, newX))
            const clampedY = Math.max(0, Math.min(100, newY))

            onMoveRef.current(task.id, clampedX, clampedY)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, task.id, containerRef])

    const handleMouseDown = (e) => {
        // Only drag with left click and ignore if clicking delete button
        if (e.button !== 0 || e.target.closest('button')) return

        setIsDragging(true)
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialTaskX: task.x,
            initialTaskY: task.y
        }

        e.preventDefault()
        e.stopPropagation()
    }

    const subtaskCount = task.subtasks?.length || 0
    const completedCount = task.subtasks?.filter(s => s.completed)?.length || 0

    return (
        <div
            className={`absolute task-node pointer-events-auto cursor-grab active:cursor-grabbing select-none ${isDragging ? 'z-50 scale-110 shadow-2xl' : 'z-10 transition-all duration-300 hover:scale-105'}`}
            style={{
                left: `${task.x}%`,
                bottom: `${task.y}%`,
                transform: 'translate(-50%, 50%)',
            }}
            onMouseDown={handleMouseDown}
        >
            <div
                className={`
          p-3 rounded-2xl shadow-lg
          bg-gradient-to-br ${getPriorityColor(priority)}
          text-white font-semibold text-sm
          min-w-[140px] max-w-[200px]
          border-2 border-white/30
          ${isDragging ? 'ring-4 ring-indigo-200/50' : 'hover:shadow-xl'}
        `}
            >
                <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 leading-tight">{task.text}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(task.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white/80 hover:text-white transition-opacity text-xl leading-none"
                    >
                        ×
                    </button>
                </div>
                <div className="mt-1 flex justify-between items-center text-[10px] opacity-80 pt-1 border-t border-white/20">
                    <span>{priority.toFixed(0)} pts</span>
                    {subtaskCount > 0 && (
                        <span>{completedCount}/{subtaskCount} subtasks</span>
                    )}
                </div>
            </div>
        </div>
    )
}
