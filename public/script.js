let socket = io();

let pageInput = document.querySelectorAll('input');
let title = document.getElementsByTagName('h1')[0].innerText;
let savelist = document.getElementById('savelist');

savelist.addEventListener('click', function () {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      window.alert("Base de datos guardada");
    }
  };
  xhr.open("GET", "/savelist?title=" + title, true);
  xhr.send();
})

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

socket.on('update msg', function (msg) {
  if (msg) {
    location.reload();
  }
})