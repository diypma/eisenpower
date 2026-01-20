export default function PriorityPanel({ tasks }) {
    const sortedTasks = [...tasks].sort((a, b) => {
        const scoreA = (a.y * 0.6) + (a.x * 0.4)
        const scoreB = (b.y * 0.6) + (b.x * 0.4)
        return scoreB - scoreA
    })

    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit sticky top-8">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                Priority Order
                <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {sortedTasks.map((task, index) => {
                    const score = (task.y * 0.6) + (task.x * 0.4)
                    return (
                        <div key={task.id} className="flex items-start gap-4">
                            <span className="font-black text-slate-200 text-2xl tabular-nums leading-none pt-1">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1">
                                <p className="font-bold text-slate-800 leading-tight">{task.text}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-semibold text-slate-400">
                                        Score: {score.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-slate-300">
                                        U:{task.x.toFixed(0)} I:{task.y.toFixed(0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {tasks.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <p>No tasks yet.</p>
                        <p className="text-xs mt-1">Click on the graph to add one.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
