import { useRef } from 'react'

export default function GraphPaper({ onAddTask, children }) {
    const containerRef = useRef(null)

    const handleClick = (e) => {
        if (e.target !== containerRef.current && !e.target.classList.contains('graph-clickable')) {
            return
        }

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
                className="relative w-full h-full graph-clickable"
                style={{
                    backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                    backgroundColor: '#f8fafc',
                }}
            >
                {/* Axis Lines */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/50" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300/50" />
                </div>

                {/* Axis Labels */}
                <div className="absolute top-1/2 -right-16 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Urgency →
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-400">
                    ↑ Importance
                </div>

                {/* Quadrant Labels - corrected positions */}
                <div className="absolute top-4 right-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Do First</div>
                <div className="absolute top-4 left-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Schedule</div>
                <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Delegate</div>
                <div className="absolute bottom-4 left-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Eliminate</div>

                {/* Task Nodes */}
                {children}
            </div>
        </div>
    )
}
