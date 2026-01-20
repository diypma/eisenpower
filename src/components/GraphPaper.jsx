import { useRef } from 'react'

export default function GraphPaper({ onAddTask, onDrop, connections, children }) {
    const containerRef = useRef(null)

    const handleDragOver = (e) => {
        // Necessary to allow dropping
        e.preventDefault()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        if (!onDrop) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((rect.height - (e.clientY - rect.top)) / rect.height) * 100

        // Try getting JSON data for subtask extraction
        try {
            const json = e.dataTransfer.getData('application/json')
            if (json) {
                const data = JSON.parse(json)
                onDrop(x, y, data)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleClick = (e) => {
        // Explicitly ignore if clicking inside a task node
        if (e.target.closest('.task-node')) {
            return
        }

        // Only proceed if clicking the grid container or an element specifically marked as clickable
        const isGridClick = e.target === containerRef.current || e.target.classList.contains('graph-clickable')
        if (!isGridClick) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((rect.height - (e.clientY - rect.top)) / rect.height) * 100

        onAddTask(x, y)
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Graph Paper Container */}
            <div
                ref={containerRef}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative w-full h-full graph-clickable cursor-crosshair"
                style={{
                    backgroundImage: `radial-gradient(circle, var(--grid-dot-color, #e2e8f0) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                    backgroundPosition: 'center center',
                    backgroundColor: 'transparent', // Handled by parent for dark mode
                }}
            >
                {/* Axis Lines (Background) */}
                <div className="absolute inset-0 pointer-events-none select-none">
                    {/* Vertical Axis with background mask */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[4px] -ml-[2px] bg-white dark:bg-slate-800" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/30 dark:bg-slate-600/30" />

                    {/* Horizontal Axis with background mask */}
                    <div className="absolute top-1/2 left-0 right-0 h-[4px] -mt-[2px] bg-white dark:bg-slate-800" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300/30 dark:bg-slate-600/30" />
                </div>

                {/* Axis Labels */}
                <div className="absolute top-1/2 right-4 translate-y-2 text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                    Urgency →
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                    ↑ Importance
                </div>

                {/* Connection Lines (Behind labels/nodes but above background) */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
                    {connections?.map((conn) => (
                        <line
                            key={conn.id}
                            x1={`${conn.start.x}%`}
                            y1={`${100 - conn.start.y}%`}
                            x2={`${conn.end.x}%`}
                            y2={`${100 - conn.end.y}%`}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            className="text-indigo-300 dark:text-indigo-700 opacity-50 transition-all duration-300"
                        />
                    ))}
                </svg>

                {/* Quadrant Labels */}
                <div className="absolute top-6 right-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Do First</div>
                <div className="absolute top-6 left-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Schedule</div>
                <div className="absolute bottom-6 right-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Delegate</div>
                <div className="absolute bottom-6 left-6 text-[10px] font-black text-slate-300/40 dark:text-slate-600/40 uppercase tracking-[0.2em] pointer-events-none select-none z-0">Eliminate</div>

                {/* Task Nodes (Foreground) */}
                <div className="absolute inset-0 z-20 overflow-visible pointer-events-none">
                    {children}
                </div>
            </div>
        </div>
    )
}
