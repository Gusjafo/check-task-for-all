let socket = io();

let obsField = document.getElementsByClassName('obs');
let obsTextArray = [];

let tokenUser = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  .split('=')[1];

for (i of obsField) {
  i.addEventListener('input', (e) => {
    obsTextArray.push(e.data);
  });
}


document.querySelectorAll("input[name=checkbox]").forEach(element =>
  element.addEventListener('change', selectedInput))

function selectedInput() {
  obsTextString = obsTextArray.join("");
  obsTextArray = [];
  console.log("Saliendo desde host con " + this.value);
  console.log("Saliendo desde host con " + obsTextString);
  socket.emit('checkbox changed', this.value, obsTextString, tokenUser);
}

socket.on('checkbox changed', function (msg) {
  console.log("volviendo a host " + msg)
  if (msg) {
    location.reload();
  }
});