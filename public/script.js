let socket = io();

let pageInput = document.querySelectorAll('input');

let tokenUser = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  .split('=')[1];
// console.log(tokenUser); 

for (i of pageInput) {
  i.addEventListener('click', function (e) {
    e.preventDefault();
    if (true) {
      console.log("Saliendo desde host con " + this.value)
      socket.emit('checkbox changed', this.value, tokenUser);
    }
  });
}

socket.on('checkbox changed', function (msg) {
  console.log("volviendo a host " + msg)
  if (msg) {
    location.reload();
  }
});