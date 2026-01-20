export default function PriorityPanel({ tasks, onToggleSubtask, onExpandTask }) {
    const sortedTasks = [...tasks].sort((a, b) => {
        const scoreA = (a.y * 0.6) + (a.x * 0.4)
        const scoreB = (b.y * 0.6) + (b.x * 0.4)
        return scoreB - scoreA
    })

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-colors">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 flex-shrink-0 text-slate-900 dark:text-white">
                Priority Order
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {sortedTasks.map((task, index) => {
                    const score = (task.y * 0.6) + (task.x * 0.4)
                    const hasSubtasks = task.subtasks && task.subtasks.length > 0

                    return (
                        <div key={task.id} className="group">
                            <div
                                className="flex items-start gap-4 cursor-pointer"
                                onClick={() => onExpandTask(task.id)}
                            >
                                <span className="font-black text-slate-200 dark:text-slate-700 text-2xl tabular-nums leading-none pt-1 group-hover:text-indigo-100 dark:group-hover:text-indigo-900 transition-colors">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ">{task.text}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">
                                            Score: {score.toFixed(0)}
                                        </p>
                                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                                            U:{task.x.toFixed(0)} I:{task.y.toFixed(0)}
                                        </p>
                                    </div>

                                    {hasSubtasks && (
                                        <div className="mt-3 space-y-1.5 border-l-2 border-slate-50 dark:border-slate-700 pl-3">
                                            {task.subtasks.slice(0, 3).map(sub => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center gap-2 group/sub cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleSubtask(task.id, sub.id);
                                                    }}
                                                >
                                                    <div className={`
                            w-3 h-3 rounded border flex items-center justify-center transition-all
                            ${sub.completed
                                                            ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 group-hover/sub:border-indigo-300 dark:group-hover/sub:border-indigo-500'}
                          `}>
                                                        {sub.completed && (
                                                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-medium transition-all ${sub.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {sub.text}
                                                    </span>
                                                </div>
                                            ))}
                                            {task.subtasks.length > 3 && (
                                                <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 italic">+ {task.subtasks.length - 3} more...</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                {tasks.length === 0 && (
                    <div className="text-center py-20 text-slate-400 dark:text-slate-600">
                        <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100/50 dark:border-slate-700/50">
                            <svg className="w-6 h-6 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <p className="font-bold text-slate-500 dark:text-slate-500">No tasks mapped</p>
                        <p className="text-xs mt-1 text-slate-300 dark:text-slate-600">Click on the grid paper to add one.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
