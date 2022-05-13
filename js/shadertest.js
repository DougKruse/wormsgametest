let Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = loader.resources,
    Sprite = PIXI.Sprite,
    AnimatedSprite = PIXI.AnimatedSprite,
    Graphics = PIXI.Graphics,
    Text = PIXI.Text,
    Container = PIXI.Container,
    Mesh = PIXI.Mesh,
    Geometry = PIXI.Geometry,
    Shader = PIXI.Shader,
    SpriteMaskFilter = PIXI.SpriteMaskFilter,
    Texture = PIXI.Texture
;

let app = new Application({
    autoResize: true,
    resolution: window.devicePixelRatio,
    antialias: true
})

//Render Settings
PIXI.settings.WRAP_MODES = PIXI.WRAP_MODES.REPEAT;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

document.getElementById("game_container").appendChild(app.view);
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block"
app.renderer.backgroundColor = 0x999999;
app.renderer.resize(window.innerWidth, window.innerHeight);

let worldScene = new Container();
app.stage.addChild(worldScene); 

const geometry = new PIXI.Geometry()
    .addAttribute('aVertexPosition', // the attribute name
        [
            0,0,
            0,200,
            200,200,
            200,200,
            200,0,
            0,0

        ], 
        2) // the size of the attribute

    .addAttribute('aColor', // the attribute name
        [
            1, 0, 0, // r, g, b
            0, 1, 0, // r, g, b
            0, 0, 1,
            0, 0, 1, // r, g, b
            0, 1, 0, // r, g, b
            1, 0, 0
        ], // r, g, b
        3) // the size of the attribute

    .addAttribute('aUvs', // the attribute name
        [   
            0, 0,
            0, 1,
            1, 1,
            1, 1,
            1, 0,
            0, 0
        ], 
        2); // the size of the attribute

const vertexSrc = `
    //VERTEX SHADER
    precision mediump float;

    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 vUvs;
    varying vec3 vColor;

    void main() {

        vUvs = aUvs;
        gl_Position = vec4(((projectionMatrix) * (translationMatrix) * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    }`;

const fragmentSrc = `
    //FRAGMENT SHADER
    precision mediump float;

    varying vec2 vUvs;

    uniform sampler2D uSampler2;

    void main() {

        gl_FragColor = texture2D(uSampler2, vUvs) * vec4(1, 1, 1, 1.0);
        // gl_FragColor = texture2D(uSampler2, vUvs) * vec4(vColor, 1.0);
    }`;

let texture = Texture.from('../img/testground2Debug.png');
console.log(texture);
const uniforms = { uSampler2: texture };
texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
// const uniforms = { uSampler2: PIXI.Texture.from('../img/debug2.png') };

const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);

let a = new Graphics();
// a.lineStyle({ color: 0x000000, width: 5});
a.beginFill(0xFFFFFF)
a.lineTo(300,200);
a.lineTo(300,400);
a.lineTo(0,200);
a.closePath();
a.endFill();
a.x = 200;
a.y = 200;
// app.stage.addChild(a);
a.filers = [fragmentSrc];


let sprite = new PIXI.TilingSprite(texture, a.width, a.height);

sprite.x = a.x;
sprite.y = a.x;
sprite.tileTransform.scale.set(5);
// app.stage.addChild(sprite);

console.log(sprite.tileTransform);
let lengthd = 301;
let heightd = 292;
let ang = Math.sin(Math.PI/4)
let ajdusde = heightd*ang/lengthd;


let testGeom = new Geometry();
const vertexPos = [
    225, 0,
    0, 160,
    450,160,
    180, 390,
    230, 350,
    280, 390
];
const indices = [
    0, 1, 4,
    0, 2, 4,
    1, 3, 4,
    2, 5, 4
];
const uvs = [
    0, 0,
    -1, 0,
    1, 0,
    -1, 1,
    -ajdusde, 2*ajdusde,
    1, 1,
];
testGeom.addAttribute("aVertexPosition", vertexPos , 2);
testGeom.addAttribute("aUvs", uvs , 2);
testGeom.addIndex(indices);
let testMesh = new PIXI.Mesh(testGeom, shader);
testMesh.x = 800;
testMesh.y = 200;
app.stage.addChild(testMesh);


let length = Math.hypot(700,700);
let angle = Math.PI/4;
let adjust = Math.cos(angle) * Math.hypot(200,200) / length;
//console.log(adjust);
const vertexPos2 = [
    0, 0,
    500, 500,
    300, 700,
    -400, 0
];
const indices2 = [
    0, 1, 2,
    0, 2, 3
];
const uvs2 = [
    adjust, 0,
    1, 0,
    1, 1,
    0, 1

];

let textureWidth = 500;
let rotationAngle = Math.PI / 4; 

let modifiedUvs = uvs2.map(function(num, index){
    return num// * length / textureWidth;
});


console.log(modifiedUvs)
let testGeom2 = new Geometry();
testGeom2.addAttribute("aVertexPosition", vertexPos2 , 2);
testGeom2.addAttribute("aUvs", modifiedUvs , 2);
testGeom2.addIndex(indices2);
let testMesh2 = new PIXI.Mesh(testGeom2, shader);
testMesh2.x = 400;
testMesh2.y = 200;
// app.stage.addChild(testMesh2);
// testMesh2.scale.set(10);


// testGeom.addAttribute('aUvs', a.geometry.uvs, 2); 
// testGeom.addAttribute('aVertexPosition', a.geometry.graphicsData[0].shape.points, 2); 
// // testGeom.addAttribute('aVertexPosition', a.geometry.points, 2); 
// testGeom.addIndex(a.geometry.indices);

// console.log(a.geometry.indices)
// console.log(geometry);
// const triangle = new PIXI.Mesh(geometry, shader);

// triangle.position.set(400, 300);
// triangle.scale.set(2);

// app.stage.addChild(triangle);

// app.ticker.add((delta) => {
//     // triangle.rotation += 0.01;
// });

// app.renderer.backgroundColor = 0xFFFFFF;
