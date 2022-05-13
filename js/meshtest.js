import {shader_dict, render_dict} from '/js/render_definitions.js';

delete PIXI.Renderer.__plugins.interaction;
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
    antialias: true
})

//Events Plugin Init
if (!('events' in app.renderer)) {
    app.renderer.addSystem(PIXI.EventSystem, 'events');
}

//Render Settings
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;


document.getElementById("game_container").appendChild(app.view);
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block"
app.renderer.backgroundColor = 0x0a0a0a;
// app.renderer.backgroundColor = 0xFFFFFF;

function resize(){
    app.renderer.resize(window.innerWidth, window.innerHeight);
}

resize();


//Shader Wizardry
//Simple Flat Color Shader for 2d Object
const worldShader = PIXI.Shader.from(`
    precision mediump float;
    attribute vec2 aVertexPosition;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;


    void main() {
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }`,

    `precision mediump float;
    uniform vec4 u_Color;
    
    void main() {
        gl_FragColor = u_Color;
    }
    `,
    {
        u_Color: [255/255,87/255,51/255,1]
    }
);
//const vec4 aFillColor = vec4(0.0, 255.0, 255.0, 1.0);
//layout(location = 0) out aFillColor;
//gl_FragColor = aFillColor;
//vec4(0.0, 255.0, 255.0, 1.0);

//Trying Reverse masking filter
let reverseMaskFilter = new PIXI.SpriteMaskFilter(undefined, `\
    varying vec2 vMaskCoord;
    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;
    uniform sampler2D mask;
    uniform float alpha;
    uniform float npmAlpha;
    uniform vec4 maskClamp;

    void main(void)
    {
        float clip = step(3.5,
            step(maskClamp.x, vMaskCoord.x) +
            step(maskClamp.y, vMaskCoord.y) +
            step(vMaskCoord.x, maskClamp.z) +
            step(vMaskCoord.y, maskClamp.w));

        vec4 original = texture2D(uSampler, vTextureCoord);
        vec4 masky = texture2D(mask, vMaskCoord);
        float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

        original *= 1.0 - (alphaMul * masky.r * alpha * clip);

        gl_FragColor = original;
    }
`)

let textures = {};
loader
    .add("tube", "../img/launcher/launchtube.png")
    .add("tubefront", "../img/launcher/launchtubefront.png")
    .add("launcher", "../img/launcher/launchbase.png")
    .add("alienidlesheet", "../img/alienidlespritesheet.json")
    .add("rocketsheet", "../img/launcher/rocket/rocketsheet.json")
    // .add("debug1", "../img/debug.png")
    // .add("debug2", "../img/debug2.png")
    .load(load).onComplete.add(doneLoading)
;

function load(loader, resources){
    textures.tube = resources.tube.texture;
    textures.tubefront = resources.tubefront.texture;
    textures.launch = resources.launcher.texture;
    textures.alienIdleSheet = resources.alienidlesheet.spritesheet.textures;
    textures.alienIdleSheetArray = Object.values(textures.alienIdleSheet);
    textures.rocketSheet = Object.values(resources.rocketsheet.spritesheet.textures);
}

function doneLoading(){
    setup();
}

function setup(){
    let globals = {};
    let animStore = [];

    globals.mouseX = 0;
    globals.mouseY = 0;

 

    let notUiScene = new Container();
    app.stage.addChild(notUiScene); 
    notUiScene.hitArea = new PIXI.Rectangle(0,0,app.screen.width, app.screen.height);

    let worldScene = new Container();
    app.stage.addChild(worldScene); 
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
    });

    

    let interactContainer = new Container();
    interactContainer.hitArea = app.renderer.screen;
    app.stage.addChild(interactContainer); 

    worldScene.x = window.innerWidth/2;
    worldScene.y = window.innerHeight/2;

    //console.log(tranglesForRing(4, 150, 100));

    let geomtery = new PIXI.Geometry();
    // geomtery.addAttribute("position", [0, -150, 106, -106, 0, -100, 106, -106, 150, 0, 70.7, -70.7]);

     // geomtery.addAttribute("aVertexPosition", vertexPos); //Has to be aVertexPosition for PIXI
    // geomtery.addIndex(Array.from(Array(vertexPos.length).keys())); //If you want mouse interaction functionality have to have indexes so prolly worth always using
    // let mesh = new PIXI.Mesh(geomtery, shader_dict.flatColorShader([0,0.5,1,1]));
    // worldScene.addChild(mesh);

    let meshSample = [
        210,0,
        400,0,
        250,90,
        220,190,
        410,240,
        320,260,
        444,260,
        444,460,
        354, 460,
        354, 300,
        170, 300,
        120,355,
        135, 406,
        171,369,
        241,409,
        106,446,
        0, 385,
        64,145
    ];
    let meshSampleIndices = [
        0,1,2,
        0,2,17,
        2,17,3,
        3,4,5,
        5,6,9,
        6,7,9,
        7,8,9,
        9,5,10,
        3,5,10,
        17,3,10,
        17,10,11,
        17,16,11,
        16,11,12,
        16,12,15,
        12,15,14,
        12,13,14
    ];

    

    let meshGraphic = render_dict.fancyMeshTest({vertexPos:meshSample, indices: meshSampleIndices, fillColor:0x8B4513});
    // meshGraphic.x = 220;
    meshGraphic.y = -500;
    meshGraphic.x = -700;
    worldScene.addChild(meshGraphic);

    let vertexPos3 = [
        0,0,200,0,0,200, 
        200,0,200,200,0,200, 
        200,0,400,200,200,200,  
        200,200,400,200,200,400
    ];
    let mesh3 = render_dict.fancyMeshTest({vertexPos:vertexPos3, fillColor:0x4287f5});
    mesh3.x = -600;
    worldScene.addChild(mesh3);

    let button = render_dict.basicCircle()
    worldScene.addChild(button);


    let sides = 5;
    let vertexPos = tranglesForRing(sides, 300, 200);
    let vertexPos2 = vertexPos.map(x => x * 1.5);
    let mesh2 = render_dict.fancyMeshTest({vertexPos:vertexPos2, alpha:1, fillColor: 0x4F239A});
    mesh2.x = 200;
    worldScene.addChild(mesh2);

    button.interactive = true;
    button.x = 200;
    button.on("click", function(){
        mesh2.destroy();
        sides++;
        vertexPos = tranglesForRing(sides, 300, 200);
        mesh2 = render_dict.fancyMeshTest({vertexPos:vertexPos, alpha:1, fillColor: 0x4F239A});
        mesh2.x = 200;
        worldScene.addChild(mesh2);
    });

    let square = render_dict.basicRectangle({
        height:60, 
        edgeColor:0xff85da,
        edgeWidth: 1,
        pos: [-150,30]
    });
    // square.x = -150;
    // worldScene.addChild(square);

    let circ = render_dict.basicCircle({
        radius:60, 
        edgeColor:0xff85da,
        edgeWidth: 4,
        edgeAlign: 0.5,
        pos: [0,150]
    });
    // square.x = -150;
    // worldScene.addChild(circ);

    // let spriteTest = render_dict.basicSprite({textures: {tube: textures.tube, launcher: textures.launch}});
    let spriteTest = render_dict.basicSprite();
    spriteTest.x = 350;
    // worldScene.addChild(spriteTest);
    // spriteTest.state("debug2");

    let launcher = new Sprite(textures.launch)
    launcher.anchor.set(0.5);
    launcher.scale.set(5);
    // worldScene.addChild(launcher);

    let tubeContainer = new Container();
    // worldScene.addChild(tubeContainer);
    tubeContainer.sortableChildren = true;
    tubeContainer.y = -50;
    tubeContainer.lastFired = 5001;

    let tube = new Sprite(textures.tube);
    tube.anchor.set(0.5);
    tube.scale.set(5);
    tube.zIndex = 1;
    tubeContainer.addChild(tube);

    let tubeFront = new Sprite(textures.tubefront);
    tubeFront.visible = false;
    tubeFront.anchor.set(0.5);
    tubeFront.scale.set(5);
    tubeFront.zIndex = 3;
    tubeContainer.addChild(tubeFront);

    let mask = new Graphics();
    mask.beginFill(0xFF3300);
    mask.drawRect(-tubeFront.width/2,-tubeFront.height/2, tubeFront.width-35,tubeFront.height);
    mask.zIndex = 3;
    // mask.visible = false;
    mask.endFill(); 
    // tubeContainer.addChild(mask);
    

    // console.log(textures.alienIdleSheetArray);
    let alienIdleSprite = new PIXI.AnimatedSprite(textures.alienIdleSheetArray);
    alienIdleSprite.animationSpeed = 0.1;
    alienIdleSprite.x = -250;
    alienIdleSprite.scale.set(5);
    alienIdleSprite.anchor.set(0.35);
    // console.log(alienIdleSprite);
    alienIdleSprite.play();
    // worldScene.addChild(alienIdleSprite);


    // interactContainer.interactive = true;
    tubeContainer.stopTurn = false; 
    let fireDelay = 300;

    interactContainer.addEventListener("mousemove", function(e){
        globals.mouseX = e.data.global.x;
        globals.mouseY = e.data.global.y;
    });
    interactContainer.addEventListener("click", function(e){
        tubeContainer.stopTurn = true; 
        // console.log(tube.stopTurn);
        // console.log(tubeContainer.lastFired);
        if(tubeContainer.lastFired > fireDelay && tubeContainer.stopTurn){
            makeRocket(tubeContainer);
            tubeContainer.lastFired = 0;
        }
    });

    
    let timedActorContainer = [];

    function makeRocket(container){
        let rocketContainer = new Container();
        let rocketSprite = new PIXI.AnimatedSprite(textures.rocketSheet);
        rocketSprite.animationSpeed = 0.2;
        rocketSprite.scale.set(5);
        rocketSprite.anchor.set(0.5);
        rocketSprite.zIndex = 2;
        rocketContainer.x = container.x;
        rocketContainer.y = container.y;
        rocketContainer.rotation = container.rotation + Math.PI/2;
        // console.log(rocketSprite);
        rocketSprite.play();
        worldScene.addChild(rocketContainer);
        rocketContainer.addChild(rocketSprite);

        tubeFront.visible = true;
        rocketContainer.filters = [reverseMaskFilter];
        rocketContainer.filters[0].maskSprite = tubeFront;
        // console.log(rocketContainer.filters)
        // rocketContainer.mask = mask;

        rocketSprite.anim = "shaking";
        timedActorContainer.push(rocketSprite);

        setTimeout(function(){
            rocketSprite.anim = "launch";
            timedActorContainer.push(rocketSprite);

            setInterval(function(){
                rocketSprite.y += -5;
            }, 10)
        }, 1000);
    }

    function rumble(rocket){
        rocket.anim = {};
        rocket.anim.place = 0;
        rocket.anim.end = 1000;
        animStore.push(rocket);
    }

    // makeRocket();

    let rotateSpeed = 0.05;
    function gameLoop(){
        
        for (let index in timedActorContainer){
            let actor = timedActorContainer[index];
            clearTimeout(actor.timer);
            if (actor.anim === "shaking"){
                actor.timer = setInterval(function(){
                    actor.x += Math.random()*4 - 2;
                    actor.y += Math.random()*4 - 2;
                }, 100)
            }
            timedActorContainer.splice(index,1);
        }        

        if(!tubeContainer.stopTurn){
            let tubeGlobal = tubeContainer.getGlobalPosition();
            let x = globals.mouseX - tubeGlobal.x;
            let y = globals.mouseY - tubeGlobal.y;
            let ang = Math.atan(y/x);
            // console.log
            if (x < 0){
                ang = ang - Math.PI;
            }
            // console.log(tube.rotation - ang);
            if(tubeContainer.rotation - ang > rotateSpeed){
                // tubeContainer.rotation -= rotateSpeed;
            } else if (tubeContainer.rotation - ang < -rotateSpeed){
                // tubeContainer.rotation += rotateSpeed
            } else {
                // tubeContainer.rotation = ang;
            }   
        }

        tubeContainer.lastFired++;
        if ( tubeContainer.lastFired >= fireDelay){
            tubeContainer.stopTurn = false;
        }
    }

    let gameTimer = setInterval(gameLoop, 1000/60);

}



function fastRound(value){  //Fast rounding hack for irrational near 0s
    return value + 8 - 8;
}

function shapePoints(sides, radius){
    let points = [];
    for (let i = 0; i < sides; i++){
        let x = fastRound(Math.sin(Math.PI*2 / sides * i)) * radius;
        let y = -fastRound(Math.cos(Math.PI*2 / sides * i)) * radius; //Inverted for clockwise generation path
        points.push([x, y]);
    }
    return points;
}

function tranglesForRing(sides, outerR, innerR){
    let outerPoints = shapePoints(sides, outerR);
    let innerPoints = shapePoints(sides, innerR);

    let points = [];
    for (let i = 0; i < sides; i++){ //2 Triangles per side
        let wrapAround = i + 1;
        if (wrapAround >= sides){
            wrapAround = 0;
        }
        points = points.concat(outerPoints[i], outerPoints[wrapAround], innerPoints[i]) //Traingle 1
        points = points.concat(innerPoints[i], innerPoints[wrapAround], outerPoints[wrapAround]) //Traingle 2
    }
    // console.log(points);
    return points;
}
