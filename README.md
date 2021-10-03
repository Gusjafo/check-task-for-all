# check-task-for-all
## Group task viewer

https://user-images.githubusercontent.com/69098117/135756441-13a3b11b-e2f9-4819-89ae-f79831ab1105.mp4

With this app you can have a list of tasks and see it on different devices.
When some user checks a task, it is updated in all users and the name of the person who checked it and at what time is added.
A description can also be added.

## Features
- Any number of tasks can be added.
- It has the function of saving history of task lists and downloading in * .csv format.
- on the route "/order" you can order the tasks.
- Different privileges with the possibility of checking or only viewing.
- **Login with microsoft account** 

## Use
- MongoDB connection.
- App registration in Microsoft Azure Directory (https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-nodejs-webapp-msal)
- Use environment variables to determine privileges
  - ADMIN
  - USUARIO
