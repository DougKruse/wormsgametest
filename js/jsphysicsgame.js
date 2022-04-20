const Flatten = globalThis["@flatten-js/core"];
//Pixi 6 Witchcraft for events plugin
delete PIXI.Renderer.__plugins.interaction;
//IMPORTS


//PIXI
let Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = loader.resources,
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics,
    Text = PIXI.Text,
    Container = PIXI.Container,
    tweenManager = PIXI.tweenManager
;


//Window update Scales
let fps = 60;
let FPS = 1000/fps;

//Websocket Test
const socket = new WebSocket("ws://localhost:40800");

//Connection Opened
socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});



//App Declaration and window sizing
let app = new Application({
    autoResize: true,
    resolution: window.devicePixelRatio,
    antialias: true,
})
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

window.addEventListener('resize', resize);

function resize(){
    app.renderer.resize(window.innerWidth, window.innerHeight);
}

resize();

//Add Application
document.getElementById("game_container").appendChild(app.view);

//Default Background
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block"
app.renderer.backgroundColor = 0xffffff;



// app.renderer.plugins.interaction = new PIXI.InteractionManager(app.renderer)
//Witchcraft that lets me use scroll wheel listeners
//https://pixijs.io/examples/#/events/slider.js for demo
delete PIXI.Renderer.__plugins.interaction;
if (!('events' in app.renderer)) {
    app.renderer.addSystem(PIXI.EventSystem, 'events');
}


//Base sprite loading
//Want to load sprites dynaically?
var sprites = {};

loader
    .add("bgtest", "../img/bg.png")
//    .add("maptest", "/maps/maptest3.txt")
    .load(load).onComplete.add(doneLoading);

function load(loader, resources){
    sprites.bgtest = new Sprite(resources.bgtest.texture);
}

function doneLoading(){
    setup();
}


function setup(){

    let worldSize = [2000, 2000];
    let wWidth = worldSize[0];
    let wHeight = worldSize[1]; 

    //Background
    let notUiScene = new Container();
    app.stage.addChild(notUiScene); 
    let backgroundScene = new Container();
    notUiScene.addChild(backgroundScene); 

    //World objects
    let worldScene = new Container();

  
   //worldScene.scale.set(0.7)

    //center on world
    worldScene.x = app.screen.width/2;
    worldScene.y = app.screen.height/2;

    //set central pivot
    // let pivotPoint = new PIXI.ObservablePoint(function(){}, "me", wWidth/2, wHeight/2);
    worldScene.pivot.set(wWidth/2, wHeight/2)
    //worldScene.pivot.y(1000);

    //Center at 0 for testing
    // worldScene.x = app.screen.width/2;
    // worldScene.y = app.screen.height/2;

     //Default Scale
    zoomOut({x:app.screen.width/2, y:app.screen.height/2}, 1.7);

    notUiScene.addChild(worldScene);

    //UI
    let uiScene = new Container();
    app.stage.addChild(uiScene);

    //
    //Move and zoom functionality
    //
    notUiScene.interactive = true;
    notUiScene.dragging = false;
    let clickStartX = 0;
    let clickStartY = 0;
    let moveOriginX = 0;
    let moveOriginY = 0;

    //Get mouse pos in the world axis for aiming or other things
    let mousePosition = {x:0, y:0};


    notUiScene.on("mousedown", function(e){
        notUiScene.dragging = true;
        clickStartX = e.data.global.x;
        clickStartY = e.data.global.y;
        moveOriginX = worldScene.x;
        moveOriginY = worldScene.y;
    })
    notUiScene.on("mousemove", function(e){
        if (notUiScene.dragging){
            //console.log(clickStartX);
            worldScene.x = moveOriginX + e.data.global.x - clickStartX;
            worldScene.y = moveOriginY + e.data.global.y - clickStartY;
        }
        mousePosition = worldScene.transform.worldTransform.applyInverse(e.client);
    })
    notUiScene.on("mouseup", function(e){
        notUiScene.dragging = false;
    })
    notUiScene.on("mouseupoutside", function(e){
        notUiScene.dragging = false;
    })


    //Zoom
    let zoomScale = 1.1;

    function zoomOut (coords, amount){
        worldScene.scale.set(worldScene.scale.x / (amount));
        worldScene.x = worldScene.x + (coords.x-worldScene.x)*(amount-1)/amount;
        worldScene.y = worldScene.y + (coords.y-worldScene.y)*(amount-1)/amount;
    }
    function zoomIn (coords, amount){
        worldScene.scale.set(worldScene.scale.x * (amount));
        worldScene.x = worldScene.x - (coords.x-worldScene.x)*(amount-1);
        worldScene.y = worldScene.y - (coords.y-worldScene.y)*(amount-1);
    }


    notUiScene.addEventListener("wheel", function(e){
        //Zoom out
        //console.log(e.global.x);
        if (e.deltaY === -100){
            zoomIn(e.global, zoomScale)
        } 
        //Zoom in
        else if (e.deltaY === 100){
            zoomOut(e.global, zoomScale)
        }
        moveOriginX = worldScene.x;
        moveOriginY = worldScene.y;
        clickStartX = e.global.x;
        clickStartY = e.global.y;
    })

    //
    //BACKGROUND STUFF
    //
    //let backgroundGraphics = new Graphics();
    // backgroundGraphics.beginFill(0xff8585);
    // backgroundGraphics.drawRect(0, 0, app.screen.width, app.screen.height);
    // backgroundGraphics.endFill();
    //backgroundScene.addChild(backgroundGraphics);
    backgroundScene.addChild(sprites.bgtest);

    //
    //WORLD STUFF
    //

    //Game Bounds
    let gameBounds = new Graphics();
    gameBounds.beginFill(0, 0);
    gameBounds.lineStyle({ color: 0x0000, width: 3, allignment: 0 });
    gameBounds.drawRect(0, 0, wWidth, wHeight);
    gameBounds.endFill();
    worldScene.addChild(gameBounds);
    


    //Simple map and test using beginhole to model damage
    
    // let mapData = JSON.parse(resources.maptest.data);

    let mapContainer = new Container();
    worldScene.addChild(mapContainer);
    mapContainer.interactive = false;

    // let radius = 800;
    // let outerRadius = 1200
    // let simpleMap = new Graphics();
    // simpleMap.beginFill(0xFFFFFF);
    // simpleMap.drawCircle(wWidth/2,wHeight/2, outerRadius);
    // simpleMap.endFill();
    // simpleMap.beginHole();
    // simpleMap.drawCircle(wWidth/2,wHeight/2, radius);
    // simpleMap.endHole();
    //mapContainer.addChild(simpleMap);


    // simpleMap.beginHole();
    // simpleMap.drawCircle(286,329, 100);
    // simpleMap.endHole();

    //Map Create from matrix file
    // Yeah this is as expected terrible performance, who woulda guessed
    // for (let x in mapData){
    //     for (let y in mapData[x]){
    //         if (+mapData[x][y] === 1){
    //             let mapPixel = new Graphics();
    //             mapPixel.beginFill(0xFFFFFF);
    //             mapPixel.drawRect(x,y,1,1);
    //             mapContainer.addChild(mapPixel);
    //         }
    //     }
    // }


    //Actors Container
    let actorContainer = new Container();
    worldScene.addChild(actorContainer);

    //Player Container
    let playerContainer = new Container();
    actorContainer.addChild(playerContainer);

    

    //
    //UI STUFF
    //






    //
    //Map Generation
    //

    //Simple map generation for testing
    //Pulls draw edge instructions from segements and arcs, want to generate them from python file
    //right now draws them here

    let mapSize = 2000;
    let radius = 800;


    let arcPoint = new Flatten.Point([mapSize/2,mapSize/2]);
    let testArc = new Flatten.Arc(arcPoint, radius, Math.PI*19/10, Math.PI/10, false); 
    // console.log(testArc);

    //let a = new Flatten.Segment(new Flatten.Point([100,100]), new Flatten.Point([0,0]));
    let testPoint = new Flatten.Point([mapSize,0]);
    let tempPoint1 = new Flatten.Point([0,0]);
    let tempPoint2 = new Flatten.Point([testPoint.x,mapSize/2]);
    let tempPoint3 = new Flatten.Point([mapSize,mapSize]);
    let tempPoint4 = new Flatten.Point([0,mapSize]);

    // Interior Circle World
    let interiorCircleWorld = new Flatten.Polygon([
        testArc, 
        new Flatten.Segment(testArc.end, tempPoint2),
        new Flatten.Segment(tempPoint2, tempPoint3),
        new Flatten.Segment(tempPoint3, tempPoint4),
        new Flatten.Segment(tempPoint4, tempPoint1),
        new Flatten.Segment(tempPoint1, testPoint),
        new Flatten.Segment(testPoint, tempPoint2),
        new Flatten.Segment(tempPoint2, testArc.start)

    ]);
    
    //Box world
    let boxWorld = new Flatten.Polygon([
        
        new Flatten.Segment(tempPoint4, tempPoint3),
        
        
    ]);
    
    //World Select
    let collisionWorld = interiorCircleWorld;

    function flattenEdgesToPixiGraphic(obj){

        let graphicsObject = new PIXI.Graphics();
        graphicsObject.beginFill(0xFF3300);
        graphicsObject.lineStyle(10, 0xffd900, 1, 0);
        let [first] = obj.edges;
        graphicsObject.moveTo(first.start.x, first.start.y);

        obj.edges.forEach(function(val1, val2, set){
            if(val1.shape.r){
                let shape = val1.shape;
                graphicsObject.arc(shape.pc.x, shape.pc.y, shape.r, shape.startAngle, shape.endAngle, !shape.counterClockwise);
            } else {
                graphicsObject.lineTo(val1.end.x, val1.end.y);
            }
        });
        graphicsObject.closePath();
        graphicsObject.endFill();
        return graphicsObject;
    }
    let worldGraphics = flattenEdgesToPixiGraphic(collisionWorld);
    // console.log(worldGraphics);
    mapContainer.addChild(worldGraphics);

    //Map gravtity constructor
    //Each mach should have its own gravity, allows for shenanigans
    //calculates the gravity accelration of an object based on its location, and any other things you might want like weight
    let gravityConstant = 0.000023;
    function interiorCircleGravity(group){
        let pos = [group.physicsObj.pc.x,group.physicsObj.pc.y];
        let center = [mapSize/2, mapSize/2];
        let difference = addVectors(invertVector(center), pos);
        let magnitude = magnitudeVector(difference);
        let normal = normalizeVector(difference);
        // console.log(normal);
        let gravityEffectRadius = (magnitude-radius/2) * (300/radius); //Cap to range of -150 to 150

        let gravityEffect = gravityConstant * (gravityEffectRadius* Math.abs(gravityEffectRadius))  //want r**2 but want to keep signed
        let gravityEffectLinnear = gravityConstant * (gravityEffectRadius) * 200 //want r**2 but want to keep signed
        // console.log(magnitude-radius/2)
        // console.log(gravityEffect)
        return {gravityEffect: gravityEffect, vector: normal};
    }

    function simpleLinnearGravity(group){
        return {gravityEffect: 0.46801, vector:[0,1]};
    }

    function mapGravity(group){
        return interiorCircleGravity(group);
    }

    //
    //Player Constructor
    //ITS A CIRCLE ON BOTH ENDS, could use path stuff for different shapes later or just a box or something idk
    let actors = [];
    let players = [];


    let playerRadius = 20
    let playerPosition = [wWidth/2,wHeight/2+500];

    let playerGroup = createActorCircle(playerPosition, playerRadius, 0xfcba03, 0x0000, 4);
    players.push(playerGroup);
    //console.log(playerGroup);
    // let playerPhysics = new Flatten.Circle(new Flatten.Point(playerPosition), playerRadius);
    // playerPhysics.v = [0,0];
    // playerPhysics.a = [0,0];
    // playerPhysics.weight = 10;
    // playerPhysics.onGround = true;
    // // console.log(playerPhysics);

    // let playerBlob = new Graphics();
    // playerBlob.beginFill(0xfcba03);
    // playerBlob.lineStyle({ color: 0x0000, width: 4, allignment: 0 });
    // playerBlob.drawCircle(0, 0, playerPhysics.r);
    // playerBlob.endFill();
    
    // playerContainer.position.set(playerPhysics.pc.x, playerPhysics.pc.y);
    // playerContainer.addChild(playerBlob);

    // let playerGroup = {
    //     physicsObj:playerPhysics,
    //     graphicsCont:playerContainer
    // }
    // actors.push(playerGroup);

    let style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        fill: 0x185c00,
        allign: "center"
    });

    let playerSpeedText = new Text("25", style);
    playerSpeedText.anchor.set(0.5);
    playerSpeedText.y = -60;
    playerGroup.graphicsCont.addChild(playerSpeedText);

    let style2 = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'bold',
        fill: 0x590303,
        allign: "center"
    });

    let playerAccText = new Text("2", style2);
    playerAccText.anchor.set(0.5);
    playerAccText.y = 60;
    playerGroup.graphicsCont.addChild(playerAccText);


    

    
    

    
  

    //
    //Turn order stuff
    //
    let activeTurn = true;



    //
    //Physics Engine
    //

    //Player Movement
    let walkingSpeed = 2; //MAX walking speed under ordinary conditions
    let walkingAcceleration = 0.5;
    let dragFriction = 0.4;
    
    //Want a resistance scaling factor on item?
    let resistance = (walkingAcceleration - dragFriction) / (walkingSpeed ** 2)/100;
    // resistance = 0;
    let jumpForce = 10;

    function addVelocity (group,amt, vector){
        //Vector is a normalized vector
        for (let index in group.physicsObj.v){
            group.physicsObj.v[index] = group.physicsObj.v[index] + (vector[index] * amt);
        }
    }
 
    function addAcc (group,amt, vector){
        //Vector is a normalized vector
        for (let index in group.physicsObj.v){
            group.physicsObj.a[index] = group.physicsObj.a[index] + (vector[index] * amt);
        }
    }
    function setAcc (group,amt, vector){
        //Vector is a normalized vector
        for (let index in group.physicsObj.v){
            group.physicsObj.a[index] = (vector[index] * amt);
        }
    }
 
    //Dynamic Object Creation

    //funciton to create and return actor object, (circle) in group with graphics container
    function createActorCircle(pos, r, fillColor = 0x949494, borderColor = 0x2e2e2e, borderWidth = 2){ //poisition [x,y] and radius

        let actorPhysics = new Flatten.Circle(new Flatten.Point(pos), r);
        actorPhysics.v = [0,0];
        actorPhysics.a = [0,0];
        //actorPhysics.weight = 10;
        actorPhysics.onGround = false;
        actorPhysics.stopped = false;


        let actorBlob = new Graphics();
        actorBlob.beginFill(fillColor);
        actorBlob.lineStyle({ color: borderColor, width: borderWidth, alignment: 0 });
        actorBlob.drawCircle(0, 0, actorPhysics.r);
        actorBlob.endFill();
        

        let createdActor = new Container();
        actorContainer.addChild(createdActor);
        
        createdActor.position.set(actorPhysics.pc.x, actorPhysics.pc.y);
        createdActor.addChild(actorBlob);


        let actorGroup = {
            physicsObj:actorPhysics,
            graphicsCont:createdActor
        }
        actors.push(actorGroup);

        return actorGroup;
    }


    //bullet function to create object at player position with aiming
    function createBullet(firingActor, r, aim, power){
        let actorPos = getActorPos(firingActor);
        let aimVector = [aim.x, aim.y];
        let actorGroup = createActorCircle(actorPos, r);
        let vector = normalizeVector(addVectors(invertVector(actorPos), aimVector));
        addAcc(actorGroup, power, vector)


        return actorGroup
    }

    let lastFired = 0;
    //System to limit bullet firing speed
    function fireBullet(firingActor, r, aim, power,delay, timer){
        if((timer-delay) > lastFired){
            createBullet(firingActor, r, aim, power);
            lastFired = timer;
        }
    }

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

   



    //Game Loop
    let timer = 0;
    function gameLoop() {
        let reportFlag = false;
        timer++;
        //Zero out Acceleration
        actors.map(function(group){
            setAcc(group, 0, [0,0])
            return group;
        });
        
        //Calculates Groundedness
        actors.map(function(group){
            //console.log(group.physicsObj.stopped);
            if (!group.physicsObj.stopped){
                if(Flatten.Relations.intersect(group.physicsObj,collisionWorld)){
                    // console.log("checking")
                    group.physicsObj.onGround = true;
                }else {
                    group.physicsObj.onGround = false;
                }
            } else {
                group.physicsObj.onGround = true;
            }
            // console.log(group.physicsObj.onGround);
            return group;
        });

        //Add Acceleration from Movement
        if (activeTurn){
            // console.log(inputKeys);
            let inputVector = [0,0];
            let leavingGround = false;
            for (let index in inputKeys){
                let key = inputKeys[index];
                //console.log(key);
                if(key === "KeyA"){
                    reportFlag = true;
                    if (playerGroup.physicsObj.onGround){
                        //console.log(perpendicularVector(mapGravity(playerGroup).vector));
                        inputVector = addVectors(inputVector , perpendicularVector(mapGravity(playerGroup).vector));
                    }
                }
                if(key === "KeyD"){
                    reportFlag = true;
                    if (playerGroup.physicsObj.onGround){
                        inputVector = addVectors(inputVector , invertVector(perpendicularVector(mapGravity(playerGroup).vector)));
                    }
                }
                if(key === "KeyW"){
                    reportFlag = true;
                    if (playerGroup.physicsObj.onGround){
                        leavingGround = true;
                        addAcc(playerGroup, jumpForce, invertVector(mapGravity(playerGroup).vector));
                        // console.log(jumpForce);
                        //inputVector[1] += -1;
                    }
                }
                if(key === "Space"){
                    reportFlag = true;
                    fireBullet(playerGroup, 10, mousePosition, 10, 60, timer);
                }
                // Close Socket connection for testing :)
                if(key === "NumpadAdd"){
                    if(socket.readyState === 0 || socket.readyState === 1){
                        socket.close(1000, "Hey I did this");
                    }
                }
            }
            addAcc(playerGroup, walkingAcceleration, normalizeVector(inputVector));

            if(leavingGround){
                playerGroup.physicsObj.onGround = false;
            }
        }

        //All things that should apply to grounded, not-moving objects should apply above here
        //Checks to see if things are stopped (or near stopped) and doesnt do the rest of the calcs to them to save muh framez and stop jittering
        actors.map(function(group){
            // console.log(magnitudeVector(group.physicsObj.v));
            if(magnitudeVector(group.physicsObj.a) === 0 && magnitudeVector(group.physicsObj.v) < 0.5 && group.physicsObj.onGround){
                group.physicsObj.stopped = true;
            } else {
                group.physicsObj.stopped = false;
            }
            //console.log(group.physicsObj.stopped);
            return group;
        });

        // console.log(playerGroup.physicsObj.onGround);
        //Gravity Acceleration
        actors.map(function(group){
            if(!group.physicsObj.stopped){
                let gravityData = mapGravity(group);
                addAcc(group, gravityData.gravityEffect, gravityData.vector);
            }
            return group;
        });

        //Decrements Acceleration by drag
        //does this instead need to get inverse vector of movement and apply in that direction instead of per-axis?
        // ye cuz u move faster diagonally lmao
        actors.map(function(group){
            if(!group.physicsObj.stopped){
                let groundDrag = group.physicsObj.onGround ? dragFriction : 0;
                
                //Resistance as a function of velocity
                // for (let index in group.physicsObj.a){

                let acceleration = group.physicsObj.a;
                let velocity = group.physicsObj.v;
                // console.log(velocity);
                let velocityMagnitude = magnitudeVector(velocity);
                // console.log(velocityMagnitude);
                let resMagnitude = (velocityMagnitude ** 2) * resistance;
                //console.log(resMagnitude);
                let resVector = invertVector(normalizeVector(velocity));
                // console.log(normalizeVector(velocity));
                addAcc(group, resMagnitude, resVector);
                
                
                //Constant drag for being on the ground 
                //In the future for sliding on something?

                //If this addition would cause direction to invert, instead puts it to 0
                //Should be last step
                //Doenst work need vector logic
                let accelerationMagnitude = magnitudeVector(acceleration);
                if (Math.abs(velocityMagnitude+accelerationMagnitude) < groundDrag){
                    groundDrag = Math.abs(velocityMagnitude+accelerationMagnitude);
                    // console.log("Here")
                }
                addAcc(group, groundDrag, resVector);
                // if (velocity > 0){
                //     group.physicsObj.a[index] = acceleration - groundDrag;
                // }else if (velocity < 0){
                //     group.physicsObj.a[index] = acceleration + groundDrag;
                // }else{
                //         //group.physicsObj.a[index] = 0;
                //     }
                    //console.log(groundDrag);
                
                // if(e.physicsObj.a[0] >= walkingSpeed && e.physicsObj.onGround){
                //     e.physicsObj.a[0] = 0;
                //     console.log("yeet")
                // }
            }
            return group;
        });

        //Converts Acceleration to Velocity
        actors.map(function(group){
            if(!group.physicsObj.stopped){
                for (let index in group.physicsObj.v){
                    group.physicsObj.v[index] = group.physicsObj.v[index] + group.physicsObj.a[index]
                }
            }
            
            return group;
        });

         
        // if(Flatten.Relations.intersect(playerGroup.physicsObj, collisionWorld)){
        //     console.log(playerGroup.physicsObj.pc);
        //     // console.log(collisionWorldd);
        //     console.log(Flatten.Relations.relate(playerGroup.physicsObj,collisionWorld));
        // }

        // console.log(playerGroup.physicsObj.);
        //Move Actor and sync graphic. Prolly Sync graphics somewhere else in the future esp with collision getting added
        //Actors are circles
        //Also world collides
        actors.map(function(group){
            if(!group.physicsObj.stopped){ 
                let oldPositions = [group.physicsObj.pc.x, group.physicsObj.pc.y];
                
                group.physicsObj.pc.x = group.physicsObj.pc.x + group.physicsObj.v[0];
                group.physicsObj.pc.y = group.physicsObj.pc.y + group.physicsObj.v[1];
                
                let newPositions = [group.physicsObj.pc.x, group.physicsObj.pc.y];

                let moved = magnitudeVector(addVectors(oldPositions, invertVector(newPositions))) > 1 ? true : false;
                //console.log(moved);

                if(Flatten.Relations.intersect(group.physicsObj,collisionWorld)){

                    let collisionMatrix = Flatten.Relations.relate(group.physicsObj,collisionWorld);
                    // console.log("collide")
                    if(collisionMatrix.B2B[1]){
                        let collisionPoint = [(collisionMatrix.B2B[0].x + collisionMatrix.B2B[1].x)/2, (collisionMatrix.B2B[0].y + collisionMatrix.B2B[1].y)/2];

                        let distanceCheck = magnitudeVector(addVectors(oldPositions, invertVector(collisionPoint)))

                        //Allowing an overlap of 1 allows for checking groundedness with relations, makes it jitter >.<
                        //Could check groundedness with a small bigger circle around actors but that's more checks, might be worth
                        //Line beneath them based on gravity would be more complicated but would work
                        
                        //console.log(distanceCheck)
                        //For Actors that should shunt when they hit the world, add check for actors that delete on collision
                        //Either should be stop at first point of collision, or move via a vector perpendicular to the collision segement
                        //Lets try point of collision calculation because it should be easy for circles
                        //Lmao it lets you slide around like iceskates, lets go with perpendicular 
                        // let directionalTransform = invertVector(normalizeVector(group.physicsObj.v)).map(e => e * group.physicsObj.r);
                
                        let directionalTransform = perpendicularVector([collisionMatrix.B2B[0].x-collisionMatrix.B2B[1].x, collisionMatrix.B2B[0].y-collisionMatrix.B2B[1].y]);
                        //There's 2 Perpendicular vectors, gotta check which one ends up closer to the previous point
                        //TODO: add bounce at higher speeds
                        let directionalTransform1 = normalizeVector(directionalTransform).map(e => e * (group.physicsObj.r-1)); //1 for groundedness overlap
                        let directionalTransform2 = invertVector(directionalTransform1);
                        let newObjectPoint1 = [collisionPoint[0]+directionalTransform1[0], collisionPoint[1]+directionalTransform1[1]];
                        let newObjectPoint2 = [collisionPoint[0]+directionalTransform2[0], collisionPoint[1]+directionalTransform2[1]];
                        let compare1 = magnitudeVector([oldPositions[0]-newObjectPoint1[0], oldPositions[1]-newObjectPoint1[1]]);
                        let compare2 = magnitudeVector([oldPositions[0]-newObjectPoint2[0], oldPositions[1]-newObjectPoint2[1]]);
                        let newObjectPoint
                        //console.log(directionalTransform2);
                        if (compare1 < compare2){
                            newObjectPoint = newObjectPoint1;
                        } else {
                            newObjectPoint = newObjectPoint2;
                        }
                        // console.log(group.physicsObj.pc);
                        group.physicsObj.pc.x = newObjectPoint[0];
                        group.physicsObj.pc.y = newObjectPoint[1];
                        //console.log(collisionPoint);
                        //Correct velocity adjusting for collision
                        group.physicsObj.v[0] = group.physicsObj.pc.x - oldPositions[0];
                        group.physicsObj.v[1] = group.physicsObj.pc.y - oldPositions[1];
                    }
                }
            }
            
            
            return group;
        });

        //Match graphics objects to phyics ones of actors
        actors.map(function(group){
            group.graphicsCont.x = group.physicsObj.pc.x;
            group.graphicsCont.y = group.physicsObj.pc.y;
            return group;
        });

        // if (playerPhysics.pc.y < 1885){
        //     console.log(playerPhysics.pc.y);
        // }
        

        //Display speed and acceleration magnitude
        playerSpeedText.text = Math.round((magnitudeVector(playerGroup.physicsObj.v)) * 100) / 100;
        playerAccText.text = Math.round((magnitudeVector(playerGroup.physicsObj.a)) * 100) / 100;

        //for x, y coordinate instead
        // playerAccText.text = magnitudeVector(playerPhysics.a).map(function(e){
        //     return Math.round((e + Number.EPSILON) * 100) / 100;
        // });


        //Rotate world to keep player at bottom middle

        //Calculate rotation angle with dot product, thanks high school and google
        let v1 = [0, 1];
        let v2 = mapGravity(playerGroup).vector;

        let dot = (a, b) => a[0] * b[0] + a[1] * b[1];
        //This angle is directionless :(
        // let angle = Math.acos(dot(v1, v2));
        let angle = Math.atan2(v2[1], v2[0] ) - Math.atan2(v1[1], v1[0]);

    
        worldScene.rotation = -angle;
        // console.log(angle*180/Math.PI);
        // console.log(app.renderer.events)
        

    }
    let gameTimer = setInterval(gameLoop, FPS);
    // console.log(app.renderer)
    //console.log(worldScene.rotation);













    //Unused Mesh Attempt
      // let vertexArray = [];
    // let pointConvert = collisionWorld.vertices.map(function(x){
    //     vertexArray.push(x.x, x.y); 
    //     return [x.x, x.y];
    // });
    // console.log(vertexArray);

    // //Shader Wizardry
    // const worldShader = PIXI.Shader.from(`

    //     precision mediump float;
    //     attribute vec2 aVertexPosition;

    //     uniform mat3 translationMatrix;
    //     uniform mat3 projectionMatrix;

    //     void main() {
    //         gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    // }`,

    // `precision mediump float;

    //     void main() {
    //         gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    //     }

    // `);
    
    
    // // const worldGeometry = new PIXI.Geometry()
    // .addAttribute('aVertexPosition', [-100, -50, 100, -50, 0, 100]);

    // let worldGeometry = new PIXI.Geometry();
    // worldGeometry.addAttribute("aVertexPosition", vertexArray, 2);
    // let worldShader = new PIXI.MeshMaterial(PIXI.Texture.EMPTY);
    // let meshWorld = new PIXI.Mesh(worldGeometry, worldShader);

    // let worldGraphics = new PIXI.Graphics();
    // worldGraphics.beginFill(0xFF3300);
    // worldGraphics.lineStyle(10, 0xffd900, 1);
    // worldGraphics.moveTo(170,100);

    // worldGraphics.arc(100,100,70, 0, Math.PI*3/2, true)

    // worldGraphics.lineTo(200,0);
    // worldGraphics.lineTo(170,100);
    // worldGraphics.closePath();
    // worldGraphics.endFill();


    // let meshWorld = new PIXI.Polygon(vertexArray);
    // let worldGraphics = new PIXI.Graphics();
    // worldGraphics.beginFill(0xFFFFFF);
    // worldGraphics.drawPolygon(meshWorld);
    // worldGraphics.endFill();

 
    // console.log(meshWorld);
}

function magnitudeVector(vector){
    let length = Math.sqrt(vector[0]**2+vector[1]**2);
    return length;
}
function normalizeVector(vector){
    let length = Math.sqrt(vector[0]**2+vector[1]**2);
    if(length === 0){
        return [0,0];
    }
    let normal = [vector[0]/length, vector[1]/length];
    return normal;
}
//There's 2 and idk which one is correct lmao, either this or its inversion
function perpendicularVector(vector){
    return [-vector[1], vector[0]];
}
function invertVector(vector){
    let invert = vector.map(x => -x);
    return invert;
}
function addVectors(vector1, vector2){
    return [vector1[0]+vector2[0], vector1[1]+vector2[1]];
}

function getActorPos(actor){
    return ([actor.physicsObj.pc.x, actor.physicsObj.pc.y]);
}