import { useRef } from 'react'

export default function GraphPaper({ onAddTask, children }) {
    const containerRef = useRef(null)

    const handleClick = (e) => {
        if (e.target !== containerRef.current && !e.target.classList.contains('graph-clickable')) {
            return // Don't add task if clicking on a task node
        }

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((rect.height - (e.clientY - rect.top)) / rect.height) * 100 // Invert Y axis

        onAddTask(x, y)
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Graph Paper Container */}
            <div
                ref={containerRef}
                onClick={handleClick}
                className="relative w-full aspect-square max-w-3xl graph-clickable"
                style={{
                    backgroundImage: `
            radial-gradient(circle, #cbd5e1 1.5px, transparent 1.5px)
          `,
                    backgroundSize: '24px 24px',
                    backgroundColor: '#f8fafc',
                }}
            >
                {/* Axis Lines */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Vertical center line (50% urgency) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/50" />
                    {/* Horizontal center line (50% importance) */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300/50" />
                </div>

                {/* Axis Labels */}
                <div className="absolute -bottom-8 right-4 text-sm font-bold text-slate-500">
                    Urgency →
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500">
                    ↑ Importance
                </div>

                {/* Quadrant Labels (subtle) */}
                <div className="absolute top-4 right-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Schedule</div>
                <div className="absolute top-4 left-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Do First</div>
                <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Eliminate</div>
                <div className="absolute bottom-4 left-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Delegate</div>

                {/* Task Nodes */}
                {children}
            </div>
        </div>
    )
}
