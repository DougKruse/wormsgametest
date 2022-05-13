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
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const shader_dict = {
    flatColorShader: function(color = 0xfc0303){
        return Shader.from(
            `
            precision mediump float;
            attribute vec2 aVertexPosition;

            uniform mat3 translationMatrix;
            uniform mat3 projectionMatrix;


            void main() {
                gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
            }
            `
            ,
            `
            precision mediump float;
            uniform vec4 u_Color;
            
            void main() {
                gl_FragColor = u_Color;
            }
            `
            ,
            {
                u_Color: color
            }
        )
    },
    textureShader: function(texture = debugTexture1){
        const vertexSrc = 
        `
            precision mediump float;

            attribute vec2 aVertexPosition;
            attribute vec3 aColor;


            uniform mat3 translationMatrix;
            uniform mat3 projectionMatrix;

            varying vec2 vUvs;
            varying vec3 vColor;

            void main() {

                vColor = aColor;
                gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
            }
        `;

        const fragmentSrc = 
        `

            precision mediump float;

            varying vec3 vColor;
            varying vec2 vUvs;

            uniform sampler2D uSampler2;

            void main() {

                gl_FragColor = texture2D(uSampler2, vUvs) * vec4(vColor, 1.0);
            }
        `;
        const uniforms = { uSampler2: texture};

        const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);

        return shader;
    }
}
let debugTexture1 = Texture.from("../img/debug1.png");
let debugTexture2 = Texture.from("../img/debug2.png");
let testGroundTexture = Texture.from("../img/testground.png");
let testGroundTexture2 = Texture.from("../img/testground2Big.png");
// let adjustedGroundTexture = new Texture(testGroundTexture.baseTexture, undefined, undefined, undefined, undefined, [10,1]);


let render_dict = {
    empty: function(data){
        let container = new Container();

        return container;
    },
    basicCircle: function(data = {}){
        let fillColor = data.fillColor !== undefined ? data.fillColor : 0xBF40BF; //Bright Purple By default
        let edgeColor = data.fillColor !== undefined ? data.fillColor : 0x000000; //Black By default
        let edgeWidth = data.edgeWidth !== undefined ? data.edgeWidth : 0;
        let edgeAlign = data.edgeAlign != undefined ? data.edgeAlign : 0;
        let pos = data.pos !== undefined ? data.pos : [0,0];
        let radius = data.radius !== undefined ? data.radius : 10;

        let container = new Container();
        let graphic = new Graphics();
        graphic.beginFill(fillColor);
        graphic.lineStyle({ color: edgeColor, width: edgeWidth, alignment: edgeAlign});
        graphic.drawCircle( 0 , 0 , radius);
        graphic.endFill();
        
        container.x = pos[0];
        container.y = pos[1];
        container.addChild(graphic);
        return container;
    },
    basicRectangle: function(data = {}){
        let fillColor = data.fillColor !== undefined ? data.fillColor : 0x25B95C; //Bright Green By default
        let edgeColor = data.edgeColor !== undefined ? data.edgeColor : 0x000000; //Black By default
        let edgeWidth = data.edgeWidth !== undefined ? data.edgeWidth : 0;
        let edgealign = data.edgealign !== undefined ? data.edgealign : 0;
        let width = data.width !== undefined ? data.width : 30;
        let height = data.height !== undefined ? data.height : 30;
        let rotation = data.rotation !== undefined ? data.rotation : 0;
        let pos = data.pos ? data.pos : [0,0];

        let container = new Container();
        let graphic = new Graphics();
        graphic.beginFill(fillColor);
        graphic.lineStyle({ color: edgeColor, width: edgeWidth, alignment: edgealign});
        graphic.drawRect(0, 0, width, height);
        graphic.endFill();

        container.rotation = rotation;
        container.x = pos[0];
        container.y = pos[1];
        container.addChild(graphic);
        return container;
    },
    basicMesh: function(data = {}){
        let fillColor = data.fillColor !== undefined ? data.fillColor : 0xFF5733; //Bright Orange By default
        let alpha = data.alpha !== undefined ? data.alpha : 1; //Bright Orange By default
        let vertexPos = data.vertexPos !== undefined ? data.vertexPos : [0,0,10,0,0,10];
        let indices = data.indices !== undefined ? data.indices : undefined;
        let fillColorRGB = hexToRgb(fillColor.toString(16)).concat(alpha);

        let container = new Container();
        let geomtery = new Geometry();
        geomtery.addAttribute("aVertexPosition", vertexPos);
        if (indices){geomtery.addIndex(indices)};
        // let mesh = new Mesh(geomtery, shader_dict.flatColorShader([0,0.5,1,1]));
        let mesh = new Mesh(geomtery, shader_dict.flatColorShader(fillColorRGB));

        container.addChild(mesh);
        return container;
    },
    basicSprite: function(data = {}){
        let rotation = data.rotation !== undefined ? data.rotation : 0;
        let pos = data.pos !== undefined ? data.pos : [0,0];
        let anchor = data.anchor !== undefined ? data.anchor : [0.5];
        let scale = data.scale !== undefined ? data.scale : 5;
        let textures = data.textures !== undefined ? data.textures : {debug1: debugTexture1, debug2: debugTexture2};
        // TODO: Spritesheet support, or array of sprites
        
        let container = new Container();
        container.rotation = rotation;
        container.x = pos[0];
        container.y = pos[1];
        container.scale.set(scale);

        let spriteObjects = {};
        let index = 0;
        
        //Create Sprite for each state, sets visible to false for all but first
        for (let key in textures){
            let sprite = new Sprite(textures[key])
            sprite.anchor.set(anchor[0], anchor[1]);

            container.addChild(sprite);
            spriteObjects[key] = sprite;

            if (index > 0){
                sprite.visible = false;
            }
            index++;
        }

        //Sets all sprites to not visible then sets selected state to visible, if not existant defaults to first state
        container.state = function(state = "debug1"){
            for (let key in spriteObjects){
                spriteObjects[key].visible = false;
            }
            if (spriteObjects[state] !== undefined){
                spriteObjects[state].visible = true;
            } else{
                spriteObjects[Object.keys(spriteObjects)[0]].visible = true;
            }
            
        }
        return container;
    },
    basicTilingSprite: function(data = {}){
        let rotation = data.rotation !== undefined ? data.rotation : 0;
        let pos = data.pos !== undefined ? data.pos : [0,0];
        let anchor = data.anchor !== undefined ? data.anchor : [0.5];
        let scale = data.scale !== undefined ? data.scale : 5;
        let texture = data.texture !== undefined ? data.texture : debugTexture1;
        let width = data.width !== undefined ? data.width / scale : 50;
        let height = data.height !== undefined ? data.height : 50;
        // TODO: Spritesheet support, or array of sprites

        let container = new Container();
        container.rotation = rotation;
        container.x = pos[0];
        container.y = pos[1];
        container.scale.set(scale);

        let sprite = new PIXI.TilingSprite(texture, width, height);
        sprite.anchor.set(anchor[0], anchor[1]);
        // console.log(sprite);
        // sprite.clampMargin = -10;
        // console.log(sprite);
        sprite.uvMatrix.clampMargin = 0;
        sprite.uvMatrix.clampOffset = 0;
        container.addChild(sprite);

        return container;
    },
    basicAnimatedSprite: function(data = {}){

        let container = new Container();
        
        return container;
    },
    //Test of beautification
    fancyMeshTest: function(data = {}){
        let height = 32;
        let container = this.basicMesh(data);
        let vertexesFlat = Array.from(container.children[0].geometry.buffers[0].data);
        let indices = undefined;
        if (container.children[0].geometry.buffers[1] !== undefined){
            indices = Array.from(container.children[0].geometry.buffers[1].data);
        }
        // container.children[0].alpha = 0.5;
        let lines = [];
        let edges = [];

        let vertexFull = vertexesFlat;
        //Indices Check, transofrm to full vertex object if it does
        if (indices !== undefined){
            vertexFull = indices.map(function(num, index){
                return [vertexesFlat[num*2], vertexesFlat[num*2 + 1]];
            }).flat();
        }
        // console.log(vertexFull);
        //Gets outside lines derived as edges of a triangle that are unique (not found in any other tri)
        for (let i = 0; i < vertexFull.length; i += 6){

            let point1 = [vertexFull[i], vertexFull[i+1]];
            let point2 = [vertexFull[i+2], vertexFull[i+3]];
            let point3 = [vertexFull[i+4], vertexFull[i+5]];

            let triangle = [point1, point2,point3];

            // console.log(triangle);
            for (let j in triangle){
                // console.log(triangle[j]);
                let nextPoint = j < 2 ? +j+1 : 0; //Wraparound for last point
                let lastPoint = j < 1 ? +j+2 : 1; //Wraparound for last point
                let lineArray = [
                    triangle[j], 
                    triangle[nextPoint],
                ];
                // console.log(lineArray);
                let lineInverse = [lineArray[1], lineArray[0]];
                let edgeWithTriangle = {
                    pos1: triangle[j], 
                    pos2: triangle[nextPoint], 
                    pos3: triangle[lastPoint]
                }

                let lineIndex = lines.findIndex(function(obj){
                    return  compareArrays(obj, lineArray) || compareArrays(obj, lineInverse);
                })
                // console.log(lineIndex);

                if (lineIndex < 0){
                    lines.push(lineArray);
                    edges.push(edgeWithTriangle);
                } else{
                    // console.log(i + " " + j);
                    lines.splice(lineIndex, 1);
                    edges.splice(lineIndex, 1);
                }
            }
            
        }


        let ringPoints = [];

        let currentPoint = [];

        let numGrounds = -1;
        

        //Turns unique set of lines into a set of points outlining each "border" where order of the points is the path to draw
        //Each point has a second value indicating if the ground is in our out
        for (let index = lines.length-1; index >= 0; index--){
            // ringPoints.push(currentPoint);
            // console.log(lines[index]);
            let nextLineIndex = lines.findIndex(function (obj){
                if (compareArrays(obj[0], currentPoint)){
                    currentPoint = obj[1];
                    return true;
                } else if (compareArrays(obj[1], currentPoint)){
                    currentPoint = obj[0];
                    return true;
                } else {
                    return false;
                }
            });
            if (nextLineIndex < 0){
                currentPoint = lines[0][0];
                numGrounds++;
                ringPoints[numGrounds] = [];
                nextLineIndex = 0;
            } 

            let pos1 = edges[nextLineIndex].pos1;
            let pos2 = edges[nextLineIndex].pos2;
            let pos3 = edges[nextLineIndex].pos3;
            let inOrOut = (pos2[0] - pos1[0]) * (pos3[1] - pos1[1]) - (pos2[1] - pos1[1]) * (pos3[0] - pos1[0]);
            let context = inOrOut >= 0 ? 1 : 0;
            let pointWithContext = {point: currentPoint, context:context, inOrOut: inOrOut};
            ringPoints[numGrounds].push(pointWithContext);
            // console.log(nextPoint);

            lines.splice(nextLineIndex, 1);
            edges.splice(nextLineIndex, 1);
        }
        // console.log(lines);
        // console.log(ringPoints);

        let bordersContainer = [];  //Sub elements for each "ring" because context matters
        let cornersContainer = [];  //No sub because is self contained
        //Does the Math for corners and edges, need to test speed, but should allow more power in graphics
        for (let borderIndex in ringPoints){
            let borderPoints = ringPoints[borderIndex];
            bordersContainer.push([]);
            bordersContainer[borderIndex][0] = {};
            for (let pointIndex in borderPoints){
                ///Get point, and lines on either side
                let point = borderPoints[pointIndex].point;
                let nextPointIndex = +pointIndex + 1 >= borderPoints.length ? 0 : +pointIndex + 1;      //Wraparounds
                let prevPointIndex = +pointIndex - 1 < 0 ? +borderPoints.length - 1 : +pointIndex - 1;
                let nextPoint = borderPoints[nextPointIndex].point;
                let prevPoint = borderPoints[prevPointIndex].point;
                let context = borderPoints[pointIndex].context;

                function vectorAdjust(point, rotation, height){
                    return [point[0] - Math.sin(rotation) * height, point[1] + Math.cos(rotation) * height]
                }

                let difference = nextPoint.map(function(num, index){
                    return num - point[index];
                });
                let difference2 = prevPoint.map(function(num, index){
                    return num - point[index];
                });
                let rotation = Math.atan2(difference[1], difference[0]);
                let rotation2 = Math.atan2(difference2[1], difference2[0]);

                rotation = +rotation + Math.PI;

                let thirdPoint = vectorAdjust(nextPoint, rotation, height);
                let fourthPoint = vectorAdjust(point, rotation, height);
                let archPoint = fourthPoint;
                let archPoint2 = vectorAdjust(point, rotation2, height)

                ///Create Point Mesh for the corner

                let archMiddlePointOffset = archPoint.map(function(num, index){
                    return point[index] - (+num + archPoint2[index])/2;
                });
                let archMiddleRot = Math.atan2(archMiddlePointOffset[1], archMiddlePointOffset[0]);
                archMiddleRot = archMiddleRot + Math.PI/2;
                let archHeight = height / Math.cos(archMiddleRot - rotation);
                let archCap = vectorAdjust(point, archMiddleRot, archHeight);

                let archCaptoThirdDiff =  archCap.map(function(num, index){
                    return num - thirdPoint[index];
                });
                let archCaptoArch2Diff =  archCap.map(function(num, index){
                    return num - archPoint2[index];
                });
                let insideAngle = (Math.atan2(archCaptoThirdDiff[1], archCaptoThirdDiff[0]) - Math.atan2(archCaptoArch2Diff[1], archCaptoArch2Diff[0]));
                let arcTopLength = Math.hypot(archCaptoArch2Diff[0],archCaptoArch2Diff[1]);

                let extInPoint = vectorAdjust(archCap, Math.PI/2 + rotation,  arcTopLength * Math.cos(insideAngle));
                let extInPoint2 = vectorAdjust(archCap, -Math.PI/2 + rotation2,  arcTopLength * Math.cos(insideAngle));

                let extOutPoint = vectorAdjust(extInPoint, rotation, -height);
                let extOutPoint2 = vectorAdjust(extInPoint2, rotation2, -height);

                let firstPointChangeDifference = extOutPoint.map(function(num, index){
                    return num - point[index];
                });
                let distanceMoved = Math.hypot(firstPointChangeDifference[0], firstPointChangeDifference[1]);

                //Simple Line
                let line = new Graphics();
                line.beginFill(0xFFFFFF);
                line.lineStyle(4, 0xFFFFFF, 10);
                line.moveTo(point[0], point[1]);
                line.lineTo(nextPoint[0], nextPoint[1]);
                line.endFill();
                // graphicContainer.addChild(line)


                // Debug Circles
                let circ = this.basicCircle({pos:[archPoint[0], archPoint[1]]});
                // let circ2 = this.basicCircle({pos:[archPoint2[0], archPoint2[1]]});
                // container.addChild(circ);
                circ.interactive = true;
                circ.on("click", function(){
                    console.log((insideAngle));
                });
                 //Debug Shapes
                    
                // let testLine = new Graphics();
                // testLine.lineStyle(4, 0x000000, 10);
                // testLine.moveTo(point[0],point[1]);
                // testLine.lineTo(extOutPoint[0], extOutPoint[1]);
                // testLine.endFill();
                // graphicContainer.addChild(testLine);

                    // let testLine2 = new Graphics();
                    // testLine2.lineStyle(4, 0xffc0cb , 10);
                    // testLine2.moveTo(extInPoint2[0],extInPoint2[1]);
                    // testLine2.lineTo(extOutPoint2[0], extOutPoint2[1]);
                    // testLine2.endFill();
                    // graphicContainer.addChild(testLine2);

                let flatEdgeContainer = bordersContainer[borderIndex][pointIndex];
                let nextEdge = +pointIndex + 1 < borderPoints.length ? +pointIndex + 1 : 0;
                if (bordersContainer[borderIndex][nextEdge] === undefined){
                    bordersContainer[borderIndex][nextEdge] = {};
                }
                let nextFlatEdgeContainer = bordersContainer[borderIndex][nextEdge];
                //Vertex Math, if needed extended corner
                let cornerPoints = [];

                //Is it an inner or outer angle
                if (Math.cos(insideAngle) > -0.0001){
                    //Obtuse Corner
                    flatEdgeContainer.first = extOutPoint2;
                    flatEdgeContainer.second = extInPoint2;

                    nextFlatEdgeContainer.fourth = extOutPoint;
                    nextFlatEdgeContainer.third = extInPoint;
                    // edgePoints.push(vectorAdjust(edgePoints[0], Math.PI/2  + rotation, length - distanceMoved * 2));
                    // edgePoints.push(vectorAdjust(edgePoints[1], rotation, height));
                    // edgePoints.push(vectorAdjust(edgePoints[0], rotation, height));
                    
                    // flatEdgeContainer 

                    cornerPoints.push(point);
                    cornerPoints.push(extOutPoint);
                    cornerPoints.push(extInPoint);
                    cornerPoints.push(archCap);
                    cornerPoints.push(extInPoint2);
                    cornerPoints.push(extOutPoint2);
                    // edgePoints.push(cornerPoints[0]);
                    

                } else { 
                    
                    //Acute Corner
                    flatEdgeContainer.first = point;
                    flatEdgeContainer.second = archPoint2;

                    nextFlatEdgeContainer.third = archPoint;
                    nextFlatEdgeContainer.fourth = point;

                    // edgePoints.push(point);
                    // edgePoints.push(nextPoint);
                    // edgePoints.push(thirdPoint);
                    // edgePoints.push(fourthPoint);
                    
                    cornerPoints.push(point);
                    cornerPoints.push(archPoint);
                    cornerPoints.push(archCap);
                    cornerPoints.push(archPoint2);

                }
                    
                cornersContainer.push(cornerPoints);

                //
                //Deprecated Grahics
                // let archPoly = new Graphics();
                // // poly.beginFill(0x873e23);
                // archPoly.beginFill(0x000000);
                // archPoly.moveTo(cornerPoints[0][0], cornerPoints[0][1]);
                // for (let i = 1; i < cornerPoints.length; i++){
                //     archPoly.lineTo(cornerPoints[i][0], cornerPoints[i][1]);
                // }
                // archPoly.alpha = 0.5;

                // archPoly.closePath();
                // archPoly.endFill();
                // graphicContainer.addChild(archPoly);
                
                // // graphicContainer.addChild(circ2);


                // ///Create Line Mesh to Next Point

                

                // //Mesh with Sprite Texture
                // let poly = new Graphics();
                // // poly.beginFill(0x873e23);
                // poly.beginFill(0xFFFFFF);
                // poly.moveTo(edgePoints[0][0], edgePoints[0][1]);
                // for (let i = 1; i < edgePoints.length; i++){
                //     poly.lineTo(edgePoints[i][0], edgePoints[i][1]);
                // }
                // poly.alpha = 0.2;
                // // poly.lineTo(point[0], point[1]);
                // poly.closePath();
                // poly.endFill();
                // graphicContainer.addChild(poly);

                // let groundTextureShader = shader_dict.flatColorShader(0xFFFFFF);
                // // let groundTextureShader = shader_dict.textureShader();
                // let groundTextueMesh = new Mesh(poly.geometry, groundTextureShader);
                // graphicContainer.addChild(groundTextueMesh);
                
                // let groundSprite = this.basicTilingSprite({texture:testGroundTexture2, pos:edgePoints[0], anchor: [1,0.5], width: length, height:20});
                // groundSprite.rotation = edgeRotation;
                // graphicContainer.addChild(groundSprite);

                // console.log(groundTextueMesh);
                // console.log(poly);
            }
        }
        let graphicContainer = new Container();
        container.addChild(graphicContainer);

        //Construct Arches at edges
        for (let index in cornersContainer){
            let edgePoints = cornersContainer[index];
            //Mesh with Sprite Texture
            let poly = new Graphics();
            // poly.beginFill(0x873e23);
            poly.beginFill(0x000000);
            poly.moveTo(edgePoints[0][0], edgePoints[0][1]);
            for (let i = 1; i < edgePoints.length; i++){
                poly.lineTo(edgePoints[i][0], edgePoints[i][1]);
            }
            poly.alpha = 0.5;
            // poly.lineTo(point[0], point[1]);
            poly.closePath();
            poly.endFill();
            graphicContainer.addChild(poly);
        }
        // console.log(bordersContainer)
        //Construct Ground Textures
        for (let ringIndex in bordersContainer){
            for (let pointIndex in bordersContainer[ringIndex]){
                let border = bordersContainer[ringIndex][pointIndex];
                let poly = new Graphics();
                // poly.beginFill(0x873e23);
                poly.beginFill(0xFFFFFF);
                poly.moveTo(border.first[0], border.first[1]);
                poly.lineTo(border.second[0], border.second[1]);
                poly.lineTo(border.third[0], border.third[1]);
                poly.lineTo(border.fourth[0], border.fourth[1]);

                poly.alpha = 0.8;
                // poly.lineTo(point[0], point[1]);
                poly.closePath();
                poly.endFill();
                // graphicContainer.addChild(poly);
                let difference = border.first.map(function(num, index){
                    return num - border.fourth[index];
                });
                let rotation = Math.atan2(difference[1], difference[0]) + Math.PI;

                let width = Math.hypot(border.first[0]-border.fourth[0], border.first[1]-border.fourth[1]);
                let groundSprite =  this.basicTilingSprite({
                    texture: testGroundTexture2, 
                    width: width, 
                    height: 32,
                    pos: border.first,
                    rotation: rotation,
                    anchor: [0,0.5],
                    scale: 1
                });
                graphicContainer.addChild(groundSprite);

            }
        }
        




        // let linesFlat = ringPoints[0].map(function (point, index){
        //     return new PIXI.Point(point[0], point[1]);
        // })
        // console.log(linesFlat);


        // let ropeTest = new PIXI.RopeGeometry(50, linesFlat, 0);
        // let ropeTest = new PIXI.SimpleRope(testGroundTexture2, linesFlat, 5)
        // container.addChild(ropeTest);
        // console.log(linesFlat);

        return container
    }
}

export {shader_dict, render_dict};

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16)/255,
        parseInt(result[2], 16)/255,
        parseInt(result[3], 16)/255
    ] : null;
}

// Array Comparing
function compareArrays(array1, array2) {
    // if the other array is a falsy value, return
    if (!array2)
        return false;

    // compare lengths - can save a lot of time 
    if (array1.length != array2.length)
        return false;

    for (var i = 0, l=array1.length; i < l; i++) {
        // Check if we have nested arrays
        if (array1[i] instanceof Array && array1[i] instanceof Array) {
            // recurse into the nested arrays
            // if (!array1[i].compare(array2[i]))
            if (!compareArrays(array1[i], array2[i]))
                return false;       
        }           
        else if (array1[i] != array2[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
function normalizeVector(vector){
    let length = Math.sqrt(vector[0]**2+vector[1]**2);
    if(length === 0){
        return [0,0];
    }
    let normal = [vector[0]/length, vector[1]/length];
    return normal;
}