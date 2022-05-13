let fps = 60; //Number of server inputs // outputs a second, could have lower number with interpolation system probs a good idea
let port = "40800";
let address = "localhost"
let routing = "ws://" + address + ":" + port + "/";

//All physics objects
//Unique ID : {data including graphics:PIXI.Container}
let actors = {}
//Temporary Storage of newly modified actors, reset each loop
let modifiedActors = [];

//
//New Obj Socket
//
const newObjSocket = new WebSocket(routing + "newObj");

newObjSocket.addEventListener("message", function (event) {
    let object = newActor(event);
    actors[object.ID] = object;
});

//
//Modified Obj Socket
//
const modObjSocket = new WebSocket(routing + "modObj");

modObjSocket.addEventListener("message", function (event) {
    let object = interpretMessage(event);
    modifiedActors.push(object);
});

//
//Removed Obj Socket
//
const remObjSocket = new WebSocket(routing + "remObj");

remObjSocket.addEventListener("message", function (event) {
    let object = interpretMessage(event);
    
    removeActors(actors, object);
});

//
//InputsSocket
//
const inputsSocket = new WebSocket(routing + "inputs");

//
//Button Input Checking
//
let inputKeys = [];
document.addEventListener("keydown", function (e){
    let name = e.code;
    if (inputKeys.indexOf(name) < 0){
        inputKeys.push(name);
    }
});
document.addEventListener("keyup", function (e){
    let name = e.code;
    let index = inputKeys.indexOf(name);
    if (index > -1){
        inputKeys.splice(index, 1);
    };
});

//
//
//Game Loop
//Future probably want one loop (or part of loop) for server and another for rendering, with interpolation.
//
function gameLoop(){

    //All this stuff is in the "message" eventlistener section above, when a message is sent a reply is sent from the server with the requested info

    //Get New Objects
    sendMessage(newObjSocket, "Gimme the Actors");

    //Get New Object Pos / Status
    sendMessage(modObjSocket, "Gimme the Modifications");


    //Get Deleted Objects
    //Delete them
    sendMessage(remObjSocket, "Gimme the Modifications");

    //Get Inputs
    let inputs = interpretInputs(inputKeys);
    //Send inputs in context of current style
    sendMessage(inputsSocket, inputs);


    //UI Handling

}

let gameTimer = setInterval(gameLoop, 1000/fps);

//Might need more logic for sending
function sendMessage(ws, message){
    ws.send(message);
}

//Create new render actors
function newActor(message){
    let object =  interpretMessage(message);
    //TODO: Create PIXI Container and graphics
    //TODO: READ CONSTRUCTION RULES FROM EXTERNAL SHEET
    return object;
}

//Interepts message string into js object
function interpretMessage(event){
    let object = JSON.parse(event.data);
    return object;
}


//Handle Anim Statuses and movement
function modifyActors(actors, modify){
    //TODO: Modify PIXI Objects and graphics or recreate if needed

    for (let key in modify){
        actors[modify.ID][key] = modify[key];
    }
    return actors;
}

//Remove actors from store and canvas
function removeActors(actors, remove){
    //TODO: Remove PIXI ELEMENTS

    //Remove Referance
    for (let key in actors){
        if (actors[key] === object.ID){
            delete actors[key];
        }
    }

    return actors;
}

function createObject(data){
    //Types of object, or always data from vertices?
    //Add to map of all actors 
}

function interpretInputs(inputs){
    //TODO: MAP KEYS TO INPUTS
    //TODO: READ MAPPING FROM BINDINGS FILE
    inputs = inputs.join(" "); //Stringify
    return inputs;
}
