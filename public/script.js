let socket = io();

let obsField = document.getElementsByClassName('obs');
let obsTextArray = [];
index = 0;

let tokenUser = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  .split('=')[1];

// for (i of obsField) {
//   i.addEventListener('input', (event) => {
//     event.preventDefault()
//     obsTextArray.push(event.data);
//     console.log(obsTextArray);
//   });
// }
for (i of obsField) {
  i.addEventListener('input', (event) => {
    event.preventDefault()
    obsTextArray[index] = event.data;
    console.log(obsTextArray[index]);
    index++;
    // obsField.innerHTML = index;
  });
}



document.querySelectorAll("input[name=checkbox]").forEach(element =>
  element.addEventListener('input', selectedInput))
 
function selectedInput() {  
  console.log(obsTextArray);
  obsTextString = obsTextArray.join("");
  console.log(typeof obsTextString);
  obsTextArray = [];
  index = 0;
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