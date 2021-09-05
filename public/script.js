const yourUrl = "./login";
document.getElementById("button").addEventListener("click", sendJSON);

function sendJSON(){
			
    // let result = document.querySelector('.result');
    let password = document.querySelector('#password');
    let email = document.querySelector('#email');
    
    // Creating a XHR object
    let xhr = new XMLHttpRequest();

    // open a connection
    xhr.open("POST", yourUrl, true);

    // Set the request header i.e. which type of content you are sending
    xhr.setRequestHeader("Content-Type", "application/json");

    // Create a state change callback
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {

            // Print received data from server
            // result.innerHTML = this.responseText;
            let response = this.responseText;
            let responseParse = JSON.parse(response);
            // console.log("user: ", responseParse);
            //send toquen to login
            if(responseParse.token) {

                let xhrget = new XMLHttpRequest();

                xhrget.onreadystatechange = function () {
                    //print private's page
                    console.log(xhrget.readyState);
                    console.log(xhrget.status);  
                    // console.log(this.responseText);
                    document.getElementsByTagName("body")[0].innerHTML = this.responseText;                 
                }

                xhrget.open("GET", "./welcome", true);
                
                xhrget.setRequestHeader("x-access-token", responseParse.token);
                // console.log(responseParse.token);
                xhrget.send();
            }
        }
    };

    // Converting JSON data to string
    var data = JSON.stringify({ "password": password.value, "email": email.value });
    // console.log(data);

    // Sending data with the request
    xhr.send(data);
}