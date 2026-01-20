import { useRef, useState } from 'react'

function getPriorityColor(score) {
    if (score >= 80) return 'from-red-400 to-orange-400'
    if (score >= 60) return 'from-orange-400 to-amber-400'
    if (score >= 40) return 'from-amber-400 to-yellow-400'
    if (score >= 20) return 'from-blue-400 to-indigo-400'
    return 'from-slate-300 to-slate-400'
}

export default function TaskNode({ task, onMove, onDelete, containerRef }) {
    const [isDragging, setIsDragging] = useState(false)
    const dragStartPos = useRef({ x: 0, y: 0, taskX: 0, taskY: 0 })

    const priority = (task.y * 0.6) + (task.x * 0.4)

    const handleMouseDown = (e) => {
        setIsDragging(true)
        dragStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            taskX: task.x,
            taskY: task.y,
        }
        e.preventDefault()
    }

    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const deltaX = e.clientX - dragStartPos.current.x
        const deltaY = e.clientY - dragStartPos.current.y

        const newX = dragStartPos.current.taskX + (deltaX / rect.width) * 100
        const newY = dragStartPos.current.taskY - (deltaY / rect.height) * 100 // Invert Y

        // Clamp to 0-100
        const clampedX = Math.max(0, Math.min(100, newX))
        const clampedY = Math.max(0, Math.min(100, newY))

        onMove(task.id, clampedX, clampedY)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Attach global listeners when dragging
    if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    } else {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
    }

    return (
        <div
            className={`absolute group cursor-move select-none transition-all ${isDragging ? 'scale-110 z-50' : 'z-10'}`}
            style={{
                left: `${task.x}%`,
                bottom: `${task.y}%`,
                transform: 'translate(-50%, 50%)',
            }}
            onMouseDown={handleMouseDown}
        >
            <div
                className={`
          px-4 py-3 rounded-2xl shadow-lg
          bg-gradient-to-br ${getPriorityColor(priority)}
          text-white font-semibold text-sm
          min-w-[120px] max-w-[200px]
          border-2 border-white/30
          ${isDragging ? 'shadow-2xl' : 'hover:shadow-xl'}
        `}
            >
                <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 leading-tight">{task.text}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(task.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white/80 hover:text-white transition-opacity text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
                <div className="mt-1 text-xs opacity-75">
                    Score: {priority.toFixed(0)}
                </div>
            </div>
        </div>
    )
}
