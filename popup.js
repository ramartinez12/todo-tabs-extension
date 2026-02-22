let draggedTaskId = null

function byId(id){return document.getElementById(id)}

async function getTasks(){
  return new Promise(resolve=>{
    chrome.storage.local.get({tasks:[]}, res=>resolve(res.tasks || []))
  })
}

async function saveTasks(tasks){
  return new Promise(resolve=>{
    chrome.storage.local.set({tasks}, ()=>resolve())
  })
}

function render(tasks){
  const list = byId('tasks')
  list.innerHTML = ''
  if(!tasks.length){
    byId('empty').style.display = 'block'
    return
  }
  byId('empty').style.display = 'none'
  tasks.forEach((task, taskIdx)=>{
    const li = document.createElement('li')
    li.className = 'task'
    li.draggable = true
    li.dataset.taskId = task.id

    li.addEventListener('dragstart', (e) => {
      draggedTaskId = task.id
      li.classList.add('dragging')
      e.dataTransfer.effectAllowed = 'move'
    })

    li.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if(draggedTaskId !== task.id) {
        li.classList.add('drag-over')
      }
    })

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over')
    })

    li.addEventListener('drop', async (e) => {
      e.preventDefault()
      li.classList.remove('drag-over')
      if(draggedTaskId === task.id) return
      let tasks = await getTasks()
      const draggedIdx = tasks.findIndex(t => t.id === draggedTaskId)
      const targetIdx = tasks.findIndex(t => t.id === task.id)
      if(draggedIdx !== -1 && targetIdx !== -1) {
        [tasks[draggedIdx], tasks[targetIdx]] = [tasks[targetIdx], tasks[draggedIdx]]
        await saveTasks(tasks)
        render(tasks)
      }
    })

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging')
      document.querySelectorAll('.task').forEach(el => el.classList.remove('drag-over'))
    })
    
    // Clicking a list item should focus the corresponding tab (or open it)
    li.addEventListener('click', async (e) => {
      // ignore clicks on the buttons inside the item
      if (e.target.closest('button')) return
      // if currently dragging, ignore click
      if (li.classList.contains('dragging')) return
      let tasks = await getTasks()
      const idx = tasks.findIndex(t => t.id === task.id)
      if (idx === -1) return
      const t = tasks[idx]
      if (typeof t.tabId === 'number') {
        chrome.tabs.update(t.tabId, {active:true}, (updatedTab) => {
          if (chrome.runtime.lastError || !updatedTab) {
            chrome.tabs.create({url: t.url})
          } else {
            if (updatedTab.windowId) chrome.windows.update(updatedTab.windowId, {focused:true})
          }
        })
      } else {
        chrome.tabs.create({url: t.url})
      }
    })
    const img = document.createElement('img')
    img.className = 'fav'
    img.src = task.favIconUrl || ''
    img.alt = ''
    const title = document.createElement('div')
    title.className = 'title'
    title.textContent = task.title || task.url
    const status = document.createElement('div')
    status.style.fontSize = '12px'
    status.style.color = '#6b7280'
    status.textContent = task.status === 'completed' ? 'Completed' : ''

    const completeBtn = document.createElement('button')
    completeBtn.textContent = task.status === 'completed' ? 'Re-open' : 'Complete'
    completeBtn.onclick = async ()=>{
      let tasks = await getTasks()
      const idx = tasks.findIndex(t=>t.id === task.id)
      if(idx === -1) return
      if(tasks[idx].status === 'completed'){
        // Re-open (create a new tab)
        chrome.tabs.create({url: tasks[idx].url})
        tasks[idx].status = 'open'
      } else {
        // Try to close the tab if it still exists
        if(typeof tasks[idx].tabId === 'number'){
          chrome.tabs.remove(tasks[idx].tabId, ()=>{
            // ignore errors
          })
        }
        tasks[idx].status = 'completed'
      }
      await saveTasks(tasks)
      render(tasks)
    }

    const delBtn = document.createElement('button')
    delBtn.className = 'danger'
    delBtn.textContent = 'Delete'
    delBtn.onclick = async ()=>{
      let tasks = await getTasks()
      tasks = tasks.filter(t=>t.id !== task.id)
      await saveTasks(tasks)
      render(tasks)
    }

    li.appendChild(img)
    li.appendChild(title)
    li.appendChild(status)
    li.appendChild(completeBtn)
    li.appendChild(delBtn)
    list.appendChild(li)
  })
}

async function saveCurrentWindowTabs(){
  chrome.tabs.query({currentWindow:true}, async (tabs)=>{
    const tasks = await getTasks()
    const now = Date.now()
    const newTasks = tabs.map((t,i)=>({
      id: `${now}-${i}`,
      title: t.title || t.url,
      url: t.url,
      favIconUrl: t.favIconUrl || '',
      tabId: t.id,
      status: 'open',
      createdAt: now
    }))
    const merged = tasks.concat(newTasks)
    await saveTasks(merged)
    render(merged)
  })
}

document.addEventListener('DOMContentLoaded', async ()=>{
  byId('saveTabs').addEventListener('click', saveCurrentWindowTabs)
  byId('clearCompleted').addEventListener('click', async ()=>{
    let tasks = await getTasks()
    tasks = tasks.filter(t=>t.status !== 'completed')
    await saveTasks(tasks)
    render(tasks)
  })
  const tasks = await getTasks()
  render(tasks)
})