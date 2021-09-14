let socket = io();

let obsField = document.getElementsByClassName('obs');
let obsTextArray = [];

let tokenUser = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  .split('=')[1];

for (i of obsField) {
  i.addEventListener('input', (e) => {
    e.preventDefault()
    obsTextArray.push(e.data);
    console.log(obsTextArray);
  });
}

document.querySelectorAll("input[name=checkbox]").forEach(element =>
  element.addEventListener('input', selectedInput))
 
function selectedInput() {  
  console.log(obsTextArray);
  obsTextString = obsTextArray.join("");
  console.log(typeof obsTextString);
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