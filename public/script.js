let socket = io();

let user = document.getElementById('hidden').value;

let tokenUser = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  .split('=')[1];

let obsField = document.getElementsByClassName('obs');
let obsTextArray = [];
index = 0;

document.querySelectorAll("input[type=checkbox]").forEach(element =>
  element.addEventListener('input', selectedInput))

function selectedInput() {
  if (user != 0) {
    let textForm = document.getElementById('task' + this.name).value;
    console.log("Saliendo desde host con " + this.value);
    console.log("Saliendo desde host con " + textForm);
    socket.emit('checkbox changed', this.value, textForm, tokenUser);
  } else {
    alert('No tienes suficientes permisos');
    location.reload();
  }
}

socket.on('checkbox changed', function (msg, obsField, checkedState, task, time, updated) {
  if (msg) {
    let idtime = 'time' + task;
    let idupdated = 'by' + task;
    task = 'task' + task;
    checkedBox = document.getElementById(msg);
    checkedState == 'checked' ? checkedBox.checked = 'checked' : checkedBox.checked = '';
    document.getElementById(idtime).innerHTML = time;
    document.getElementById(idupdated).innerHTML = updated;
    document.getElementById(task).value = obsField;
    // location.reload();
  }
});

