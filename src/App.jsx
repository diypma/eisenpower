import { useState, useRef } from 'react'
import GraphPaper from './components/GraphPaper'
import TaskNode from './components/TaskNode'
import PriorityPanel from './components/PriorityPanel'

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Launch Eisenpower', x: 75, y: 85 },
    { id: 2, text: 'Plan next features', x: 25, y: 75 },
    { id: 3, text: 'Check email', x: 65, y: 30 },
  ])
  const [newTaskText, setNewTaskText] = useState('')
  const [pendingPosition, setPendingPosition] = useState(null)
  const graphContainerRef = useRef(null)

  const handleAddTask = (x, y) => {
    if (!newTaskText.trim()) {
      setPendingPosition({ x, y })
      return
    }

    const newTask = {
      id: Date.now(),
      text: newTaskText,
      x,
      y,
    }
    setTasks([...tasks, newTask])
    setNewTaskText('')
    setPendingPosition(null)
  }

  const handleInputSubmit = (e) => {
    e.preventDefault()
    if (!newTaskText.trim()) return

    if (pendingPosition) {
      handleAddTask(pendingPosition.x, pendingPosition.y)
    } else {
      handleAddTask(50, 50)
    }
  }

  const moveTask = (id, x, y) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, x, y } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="px-6 py-3 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <h1 className="text-xl font-black tracking-tight bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Eisenpower
        </h1>

        <form onSubmit={handleInputSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="New task..."
            className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-indigo-400 min-w-[200px]"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </form>
      </header>

      <main className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Graph Paper Matrix */}
        <div className="flex-1 pr-20">
          <GraphPaper onAddTask={handleAddTask}>
            {tasks.map(task => (
              <TaskNode
                key={task.id}
                task={task}
                onMove={moveTask}
                onDelete={deleteTask}
                containerRef={graphContainerRef}
              />
            ))}
          </GraphPaper>
        </div>

        {/* Priority Panel */}
        <div className="w-80 flex-shrink-0">
          <PriorityPanel tasks={tasks} />
        </div>
      </main>
    </div>
  )
}

export default App
