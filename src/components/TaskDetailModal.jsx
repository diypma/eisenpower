import { useEffect } from 'react'

export default function TaskDetailModal({ isOpen, onClose, task, onToggleSubtask, onDelete }) {
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    if (!isOpen || !task) return null

    const priority = (task.y * 0.6) + (task.x * 0.4)

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-all"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-tight pr-4">{task.text}</h2>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                                Priority: {priority.toFixed(0)}
                            </span>
                            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">
                                U: {task.x.toFixed(0)} / I: {task.y.toFixed(0)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-8">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                        Sub-Tasks
                        {task.subtasks?.length > 0 && (
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px]">
                                {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length}
                            </span>
                        )}
                    </h3>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {task.subtasks?.map((sub) => (
                            <div
                                key={sub.id}
                                className="flex items-center gap-3 group/sub cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                                onClick={() => onToggleSubtask(task.id, sub.id)}
                            >
                                <div className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                  ${sub.completed
                                        ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 group-hover/sub:border-indigo-300 dark:group-hover/sub:border-indigo-500'}
                `}>
                                    {sub.completed && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`font-semibold text-sm transition-all ${sub.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {sub.text}
                                </span>
                            </div>
                        ))}
                        {(!task.subtasks || task.subtasks.length === 0) && (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-bold text-slate-300 dark:text-slate-600">No sub-tasks defined</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 border-t border-slate-100 dark:border-slate-700 pt-8">
                    <button
                        onClick={() => {
                            if (window.confirm("Delete this task?")) {
                                onDelete(task.id);
                                onClose();
                            }
                        }}
                        className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        Delete Task
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
