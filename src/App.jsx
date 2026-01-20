import { useState, useMemo } from 'react'

const QUADRANTS = [
  { id: 'urgent-important', name: 'Do First', description: 'Urgent & Important', color: 'bg-red-50 border-red-200 text-red-700' },
  { id: 'not-urgent-important', name: 'Schedule', description: 'Not Urgent but Important', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'urgent-not-important', name: 'Delegate', description: 'Urgent but Not Important', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'not-urgent-not-important', name: 'Eliminate', description: 'Neither Urgent nor Important', color: 'bg-slate-100 border-slate-200 text-slate-500' },
]

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Launch Eisenpower', quadrant: 'urgent-important' },
    { id: 2, text: 'Plan next features', quadrant: 'not-urgent-important' },
  ])
  const [newTaskText, setNewTaskText] = useState('')
  const [activeQuadrant, setActiveQuadrant] = useState('urgent-important')

  const addTask = (e) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    const newTask = {
      id: Date.now(),
      text: newTaskText,
      quadrant: activeQuadrant
    }
    setTasks([...tasks, newTask])
    setNewTaskText('')
  }

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const moveTask = (id, direction) => {
    // Basic movement logic can be expanded to drag and drop later
    // For now, let's just allow deleting and re-adding or similar simple interaction
  }

  // Priority algorithm: 
  // 1. Do First (Urgent & Important)
  // 2. Schedule (Not Urgent & Important)
  // 3. Delegate (Urgent & Not Important)
  // 4. Eliminate (Not Urgent & Not Important)
  const prioritizedTasks = useMemo(() => {
    const order = ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important']
    return [...tasks].sort((a, b) => order.indexOf(a.quadrant) - order.indexOf(b.quadrant))
  }, [tasks])

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Eisenpower
          </h1>
          <p className="mt-2 text-slate-500 font-medium">Master your time with the Eisenhower Matrix.</p>
        </div>

        <form onSubmit={addTask} className="flex w-full md:w-auto gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 outline-none"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
          <select
            className="bg-slate-50 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 outline-none"
            value={activeQuadrant}
            onChange={(e) => setActiveQuadrant(e.target.value)}
          >
            {QUADRANTS.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Add
          </button>
        </form>
      </header>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Matrix Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 aspect-square max-w-2xl mx-auto w-full">
          {QUADRANTS.map(quadrant => (
            <div
              key={quadrant.id}
              className={`p-6 rounded-3xl border-2 flex flex-col transition-all duration-300 ${quadrant.color} hover:shadow-xl`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black uppercase tracking-widest text-xs opacity-70 italic">{quadrant.description}</h3>
                <span className="font-bold text-lg">{quadrant.name}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {tasks.filter(t => t.quadrant === quadrant.id).map(task => (
                  <div key={task.id} className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-white/50 group flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                    <span className="font-medium text-slate-700">{task.text}</span>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-all"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Priority List */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            Suggested Priority
            <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full">{tasks.length}</span>
          </h2>

          <div className="space-y-4">
            {prioritizedTasks.map((task, index) => (
              <div key={task.id} className="flex items-start gap-4">
                <span className="font-black text-slate-200 text-2xl tabular-nums leading-none pt-1">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 leading-tight">{task.text}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                    {QUADRANTS.find(q => q.id === task.quadrant)?.name}
                  </p>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>No tasks yet.</p>
                <p className="text-xs">Add some to see your priority list.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
