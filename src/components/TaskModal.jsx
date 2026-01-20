import { useState, useEffect, useRef } from 'react'

export default function TaskModal({ isOpen, onClose, onSubmit, position }) {
    const [text, setText] = useState('')
    const [subtasks, setSubtasks] = useState([])
    const inputRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            setText('')
            setSubtasks([])
            // Small timeout to ensure modal is rendered before focusing
            setTimeout(() => inputRef.current?.focus(), 10)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleAddSubtask = () => {
        setSubtasks([...subtasks, { id: Date.now(), text: '', completed: false }])
    }

    const handleSubtaskChange = (id, val) => {
        setSubtasks(subtasks.map(s => s.id === id ? { ...s, text: val } : s))
    }

    const handleRemoveSubtask = (id) => {
        setSubtasks(subtasks.filter(s => s.id !== id))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!text.trim()) return

        onSubmit({
            text: text.trim(),
            subtasks: subtasks.filter(s => s.text.trim() !== '')
        })
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-all"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                <h2 className="text-2xl font-black mb-6 text-slate-800">Add New Task</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Task Description</label>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="What needs doing?"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Sub-tasks</label>
                            <button
                                type="button"
                                onClick={handleAddSubtask}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                + Add Sub-task
                            </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {subtasks.map((sub) => (
                                <div key={sub.id} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Sub-task details..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-100 text-sm outline-none focus:border-indigo-300 bg-slate-50"
                                        value={sub.text}
                                        onChange={(e) => handleSubtaskChange(sub.id, e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSubtask(sub.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {subtasks.length === 0 && (
                                <p className="text-xs text-slate-300 italic py-2">No sub-tasks added yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
