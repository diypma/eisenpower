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
      // Default position if no click yet
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Eisenpower
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            {pendingPosition
              ? 'Type your task and press Enter'
              : 'Type a task, then click on the graph to place it'}
          </p>
        </div>

        <form onSubmit={handleInputSubmit} className="flex w-full md:w-auto gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="New task..."
            className="flex-1 px-4 py-2 outline-none min-w-[250px]"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Add
          </button>
        </form>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

        {/* Graph Paper Matrix */}
        <div className="lg:col-span-3 pl-12 pb-12 pt-12">
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
        <div className="lg:col-span-1">
          <PriorityPanel tasks={tasks} />
        </div>
      </main>
    </div>
  )
}

export default App
