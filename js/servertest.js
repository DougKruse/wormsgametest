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

// let sprites = {};
let textures = {};
loader
    .add("spacemanIdle", "../img/walktest/idle.png")
    .add("spacemanWalk0", "../img/walktest/walk1.png")
    .add("spacemanWalk1", "../img/walktest/walk2.png")
    .add("spacemanWalk2", "../img/walktest/walk3.png")
    .add("spacemanWalk3", "../img/walktest/walk4.png")
//    .add("maptest", "/maps/maptest3.txt")
    .load(load).onComplete.add(doneLoading);

function load(loader, resources){
    textures.spacemanIdle = resources.spacemanIdle.texture;
    let textureArray = [];
    for (let i = 0 ; i < 4; i++){
        let texture = resources["spacemanWalk"+i].texture;
        textureArray.push(texture);
    }
    textures.spacemanWalkArray = textureArray;
}

function doneLoading(){
    setup();
}

function setup(){
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


    actorSocket.addEventListener('open', function (event) {
        actorSocket.send("doesntmatter");
    });

    let spriteForPlayer //for when moving
    actorSocket.addEventListener('message', function (event) {
        // console.log(event.data);
        let actorData = JSON.parse(event.data);
        actors[actorData.ID] = actorData;
        // console.log(actors);

        let actorContainer = new Container();
        worldScene.addChild(actorContainer);

        let actorBlob = new Graphics();
        actorBlob.beginFill(fillColor);
        actorBlob.lineStyle({ color: borderColor, width: borderWidth, alignment: 0 });

        let spriteAdjustWidth
        let spriteAdjustHeight

        if(actorData.shape === "circle"){
            actorBlob.drawCircle(actorData.pos[0], actorData.pos[1], actorData.dim.r);
            spriteAdjustWidth = actorData.dim.r;
            spriteAdjustHeight = actorData.dim.r;
        }
        if(actorData.shape === "rectangle"){
            actorBlob.drawRect(actorData.pos[0], actorData.pos[1], actorData.dim.width, actorData.dim.height);
            spriteAdjustWidth = actorData.dim.width;
            spriteAdjustHeight = actorData.dim.height;
        }
        actorBlob.endFill();
        actorContainer.addChild(actorBlob);

        if (actorData.isPlayer === 1){
            // console.log(textures);
            let playerSprite = new PIXI.AnimatedSprite([textures.spacemanIdle]);
            playerSprite.anchor.set(0.15,0.8);
            playerSprite.scale.set(5);
            playerSprite.animationSpeed = 0.1;
            // console.log(playerSprite);
            playerSprite.play();
            // playerSprite.x = -playerSprite.width;
            // playerSprite.y = spriteAdjustHeight;
            // console.log(textures.spacemanWalkArray);
            spriteForPlayer = playerSprite;
            actorContainer.addChild(playerSprite);
        }   

        pixiActors[actorData.ID] = actorContainer;

        let gameTimer = setInterval(gameLoop, 1000/60);
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
            positionSocket.send("doesntmatter");
        };
    });
    positionSocket.addEventListener('close', function (event) {
        positionSend = function(){};
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
                if(spriteForPlayer.textures !== textures.spacemanWalkArray || spriteForPlayer.scale.x !== -Math.abs(spriteForPlayer.scale.x)){
                    spriteForPlayer.textures = textures.spacemanWalkArray;
                    spriteForPlayer.scale.x = -Math.abs(spriteForPlayer.scale.x);
                    spriteForPlayer.gotoAndPlay(0);
                }
            }
            if(key === "KeyD"){
                inputRight();
                if(spriteForPlayer.textures !== textures.spacemanWalkArray || spriteForPlayer.scale.x !== Math.abs(spriteForPlayer.scale.x)){
                    spriteForPlayer.textures = textures.spacemanWalkArray;
                    spriteForPlayer.scale.x = Math.abs(spriteForPlayer.scale.x);
                    spriteForPlayer.gotoAndPlay(0);
                }
            }
        }
        if(inputKeys.length === 0){
            if(spriteForPlayer.textures !== [textures.spacemanIdle]){
                spriteForPlayer.textures = [textures.spacemanIdle];
                spriteForPlayer.gotoAndPlay(0);
            }
        }
        positionSend();
    }

    
}
