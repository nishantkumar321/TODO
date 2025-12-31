const form = document.getElementById('todo-form');
const taskInput = document.getElementById('task');
const timeInput = document.getElementById('time');
const priorityInput = document.getElementById('priority');
const filterInput = document.getElementById('filter');
const todoList = document.getElementById('todo-list');
const totalTimeDisplay = document.getElementById('total-time');
const exportBtn = document.getElementById('export-pdf');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let statusChart, priorityChart;

renderTasks();

// Add/Edit Task
form.addEventListener('submit', function(e){
    e.preventDefault();
    const task = taskInput.value;
    const time = timeInput.value;
    const priority = priorityInput.value;

    if(task && time && priority){
        if(form.dataset.editIndex){
            const index = form.dataset.editIndex;
            tasks[index].task = task;
            tasks[index].time = time;
            tasks[index].priority = priority;
            delete form.dataset.editIndex;
        } else {
            tasks.push({ task, time, priority, completed: false });
        }
        saveAndRender();
        form.reset();
    }
});

// Filter
filterInput.addEventListener('change', renderTasks);

// Render Tasks
function renderTasks(){
    todoList.innerHTML = '';
    let filteredTasks = tasks;
    const filterValue = filterInput.value;
    if(filterValue && filterValue !== "All"){
        filteredTasks = tasks.filter(t => t.priority === filterValue);
    }

    let totalMinutes = 0;

    filteredTasks.forEach((t, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.index = index;
        li.className = t.priority.toLowerCase();

        li.innerHTML = `
            <span style="text-decoration:${t.completed ? 'line-through' : 'none'}">
                ${t.task} - ${t.time}
            </span>
            <div>
                <button onclick="toggleComplete(${index})">${t.completed ? 'Undo' : 'Done'}</button>
                <button onclick="editTask(${index})">Edit</button>
                <button onclick="deleteTask(${index})">Delete</button>
            </div>
        `;
        addDragEvents(li);
        todoList.appendChild(li);

        const [hours, minutes] = t.time.split(':').map(Number);
        totalMinutes += hours * 60 + minutes;
    });

    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    totalTimeDisplay.textContent = `Total Estimated Time: ${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;

    updateCharts();
}

// Save & Render
function saveAndRender(){
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

// Task functions
function deleteTask(index){ tasks.splice(index, 1); saveAndRender(); }
function toggleComplete(index){ tasks[index].completed = !tasks[index].completed; saveAndRender(); }
function editTask(index){ taskInput.value = tasks[index].task; timeInput.value = tasks[index].time; priorityInput.value = tasks[index].priority; form.dataset.editIndex = index; }

// Drag & Drop
let dragStartIndex;
function addDragEvents(li){
    li.addEventListener('dragstart', dragStart);
    li.addEventListener('dragover', dragOver);
    li.addEventListener('drop', dragDrop);
    li.addEventListener('dragenter', dragEnter);
    li.addEventListener('dragleave', dragLeave);
}

function dragStart(e){ dragStartIndex = +this.dataset.index; this.classList.add('dragging'); }
function dragOver(e){ e.preventDefault(); }
function dragEnter(e){ this.classList.add('over'); }
function dragLeave(e){ this.classList.remove('over'); }
function dragDrop(e){ swapTasks(dragStartIndex, +this.dataset.index); this.classList.remove('over'); }
function swapTasks(fromIndex, toIndex){ const temp = tasks[fromIndex]; tasks[fromIndex] = tasks[toIndex]; tasks[toIndex] = temp; saveAndRender(); }

// Export PDF
exportBtn.addEventListener('click', function(){
    if(tasks.length === 0){ alert("No tasks to export!"); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Student Daily Activities To-Do List", 14, 20);
    doc.setFontSize(12);
    let y = 30;
    tasks.forEach((t,index)=>{
        const status = t.completed ? "[Done]" : "[Pending]";
        const line = `${index+1}. ${t.task} - ${t.time} - ${t.priority} - ${status}`;
        doc.text(line, 14, y); y+=10;
        if(y>280){ doc.addPage(); y=20; }
    });
    doc.text(totalTimeDisplay.textContent, 14, y+10);
    doc.save("DailyActivities.pdf");
});

// Charts
function updateCharts(){
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    if(statusChart) statusChart.destroy();
    statusChart = new Chart(ctxStatus, {
        type: 'pie',
        data: { labels:['Completed','Pending'], datasets:[{data:[completed,pending], backgroundColor:['#28a745','#dc3545']}] },
        options:{ plugins:{legend:{position:'bottom'}}}
    });

    const high = tasks.filter(t=>t.priority==='High').length;
    const medium = tasks.filter(t=>t.priority==='Medium').length;
    const low = tasks.filter(t=>t.priority==='Low').length;

    const ctxPriority = document.getElementById('priorityChart').getContext('2d');
    if(priorityChart) priorityChart.destroy();
    priorityChart = new Chart(ctxPriority, {
        type:'bar',
        data:{ labels:['High','Medium','Low'], datasets:[{label:'Number of Tasks', data:[high,medium,low], backgroundColor:['#e74c3c','#e67e22','#27ae60']}]},
        options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, stepSize:1}} }
    });
}
// ===== Dark Mode Toggle =====
const toggleBtn = document.getElementById('toggle-mode');

// Load saved mode
if(localStorage.getItem('mode') === 'dark'){
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = "☀️ Light Mode";
}

// Toggle mode function
toggleBtn.addEventListener('click', ()=>{
    document.body.classList.toggle('dark-mode');
    if(document.body.classList.contains('dark-mode')){
        toggleBtn.textContent = "☀️ Light Mode";
        localStorage.setItem('mode','dark');
    } else {
        toggleBtn.textContent = "🌙 Dark Mode";
        localStorage.setItem('mode','light');
    }
});





