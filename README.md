admin-page
    A backend command system that allows users with permission to log into a dashboard for seeing nosql data

pivxPoker
    The backend system that controls poker

pivxpokerfrontend
    The frontend system that users play on. You need to build it then add it to the pivxPoker/build for it to work

landingpage
    This is the landing page that a user get too they first go to the website. 
    currently the "new poker" folder is what is being used

A reverse proxy is required to make sure everything is routed correctly.



# Over all system idea and how it works together
This is by no means a full idea of how this works This is just my ramblings as I try and document an undocumented peice of code so that it is less of a pain for those
who come after me or who want to work on it some. More info can generally be found inside of the specific folders readme files.

The pivxpokerfrontend is a react system that follows some of the react standards and ideas. The important part is that you need to pay attention to all of the socket
calls as the variable names can change and mess around with them causing rather large confusion when trying to work on the backend and frontend. If you understand
socket.io already it should be no problem for you but just a warning

Routing on the frontend is done through app.js

The pivxPoker folder its self is the whole system. This system is made complete when you add the build folder from the pivxpokerfrontend. There are a lot of hidden configs that are hardcoded into the system be aware of that. I will try and make note of as many of them as possible, and hopefully eventually get them all in one place but for now it still is a mess. Most of these will be inside of the /shared/ folder. I have made more notes in the pivxpokerfrontend readme.