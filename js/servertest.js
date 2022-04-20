let Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = loader.resources,
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics,
    Text = PIXI.Text,
    Container = PIXI.Container,
    tweenManager = PIXI.tweenManager
;

let app = new Application({
    autoResize: true,
    resolution: window.devicePixelRatio,
    antialias: true,
})
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

document.getElementById("game_container").appendChild(app.view);
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block"
app.renderer.backgroundColor = 0xffffff;

let worldScene = new Container();
app.stage.addChild(worldScene); 
worldScene.x = window.innerWidth/2;
worldScene.y = window.innerHeight/2;


// const socket = new WebSocket("ws://localhost:40800");
const actorSocket = new WebSocket("ws://localhost:40800/getActors");
const positionSocket = new WebSocket("ws://localhost:40800/getPosition");
const inputSocket = new WebSocket("ws://localhost:40800/sendInputs");

let fillColor = 0x949494, borderColor = 0x2e2e2e, borderWidth = 2;
let actors = {};
let pixiActors = {};
//Connection Opened
actorSocket.addEventListener('open', function (event) {
    actorSocket.send("doesntmatter");
});

actorSocket.addEventListener('message', function (event) {
    // console.log(event.data);
    let actorData = JSON.parse(event.data);
    actors[actorData.ID] = actorData;
    // console.log(actors);
    let actorBlob = new Graphics();
    actorBlob.beginFill(fillColor);
    actorBlob.lineStyle({ color: borderColor, width: borderWidth, alignment: 0 });

    if(actorData.shape === "circle"){
        actorBlob.drawCircle(actorData.pos[0], actorData.pos[1], actorData.dim.r);
    }
    if(actorData.shape === "rectangle"){
        actorBlob.drawRect(actorData.pos[0], actorData.pos[1], actorData.dim.width, actorData.dim.height);
    }
    actorBlob.endFill();
    worldScene.addChild(actorBlob);
    pixiActors[actorData.ID] = actorBlob;
});

let inputLeft = function(){};
let inputRight = function(){};
inputSocket.addEventListener('open', function (event) {
    inputLeft = function(){
        inputSocket.send("left")
    };
    inputRight = function(){
        inputSocket.send("right")
    };
});

let positionSend = function(){};
positionSocket.addEventListener('open', function (event) {
    positionSend = function(){
        positionSocket.send("doesntmatter")
    };
});

positionSocket.addEventListener('message', function (event) {
    let actorData = JSON.parse(event.data);
    pixiActors[actorData.ID].x = actorData.pos[0];
    pixiActors[actorData.ID].y = actorData.pos[1];
    //console.log(pixiActors[actorData.ID].x);
});

//Capture inputs
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


function gameLoop(){
    for (let index in inputKeys){
        let key = inputKeys[index];
        if(key === "KeyA"){
            inputLeft();
        }
        if(key === "KeyD"){
            inputRight();
        }
    }
    positionSend();
}

let gameTimer = setInterval(gameLoop, 1000/60);
