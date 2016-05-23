/// <reference path="../libs/gl-matrix.js" />.
var gl;

function WebGlWrapper(canvasId, width, height) {
    this.canvas = document.getElementById(canvasId);
    this.canvas.setAttribute("width", width);
    this.canvas.setAttribute("height", height);
    gl = this.canvas.getContext("experimental-webgl");

    //Initialize Shaders
    this.initShaders('shader-fs','shader-vs');
    //Initialize global matrixes

    //Initialize buffers
}

WebGlWrapper.prototype.initShaders = function (shaders) {
    function getShader(id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    this.shaderProgram = gl.createProgram();
    
    for (var shader in arguments) {
        var glShader = getShader(shader);
        gl.attachShader(this.shaderProgram, glShader);
    }

    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(this.shaderProgram);

    this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);


    this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
    this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
}

function GlElement() {
    this.position = {
        buffer: gl.createBuffer(),
        vertices: []
    }
    this.color = {
        buffer: gl.createBuffer(),
        vertices: []
    }
    this.rotation = 0;

    this.setPosition = function (vertices, itemSize, numItems) {
        this.position.vertices = vertices;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.position.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.position.vertices), gl.STATIC_DRAW);
        this.position.buffer.itemSize = itemSize;
        this.position.buffer.numItems = numItems;
    }

    this.setColor = function (vertices, itemSize, numItems) {
        this.color.vertices = vertices;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.color.vertices), gl.STATIC_DRAW);
        this.color.buffer.itemSize = itemSize;
        this.color.buffer.numItems = numItems;
    }

    this.draw = function (shaderProgram) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.position.buffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.position.buffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color.buffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.color.buffer.itemSize, gl.FLOAT, false, 0, 0);
    }
}

function GLApp() {
    this.canvas = document.getElementById("firstCanvas");
    gl = this.canvas.getContext('experimental-webgl');

    this.rTri = 0;
    this.rSquare = 0;
    this.lastTime = 0;

    this.shaderProgram = null;
    this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();

    this.canvas.setAttribute("width", 1920);
    this.canvas.setAttribute("height", 850);

    this.Triangle = new GlElement();
    this.Square = new GlElement();
    this.Floor = new GlElement();

    this.initGL();
    this.initShaders();
    this.initBuffers();

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    this.drawScene();

    this.tick();
}

GLApp.prototype.tick = function () {
    requestAnimationFrame(this.tick.bind(this));

    this.drawScene();
    this.animate()
}

GLApp.prototype.animate = function () {
    var timeNow = new Date().getTime();
    if (this.lastTime != 0) {
        var elapsed = timeNow - this.lastTime;

        this.Triangle.rotation += (90 * elapsed) / 1000.0;
        this.Square.rotation  += (75 * elapsed) / 1000.0;
    }
    this.lastTime = timeNow;
}

GLApp.prototype.initGL = function () {
    try {
        gl = this.canvas.getContext("experimental-webgl");
        gl.viewportWidth = this.canvas.width;
        gl.viewportHeight = this.canvas.height;
    } catch (e) { }
    (!gl) ? alert("Could not initialise WebGL") : null;
}

GLApp.prototype.getShader = function (id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

GLApp.prototype.initShaders = function () {
    var fragmentShader = this.getShader("shader-fs");
    var vertexShader = this.getShader("shader-vs");

    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);

    gl.linkProgram(this.shaderProgram);


    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    
    gl.useProgram(this.shaderProgram);

    this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    
    this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);


    this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
    this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
}

GLApp.prototype.setMatrixUniforms = function () {
    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
}





GLApp.prototype.initBuffers = function () {
    var vertices = [
           // Front face
            0.0, 1.0, 0.0,
           -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
           // Right face
            0.0, 1.0, 0.0,
            1.0, -1.0, 1.0,
            1.0, -1.0, -1.0,
           // Back face
            0.0, 1.0, 0.0,
            1.0, -1.0, -1.0,
           -1.0, -1.0, -1.0,
           // Left face
            0.0, 1.0, 0.0,
           -1.0, -1.0, -1.0,
           -1.0, -1.0, 1.0,
           //Bottom face L
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, -1.0,
           //Bottom face R
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0
    ];
    this.Triangle.setPosition(vertices, 3, 18);
    var colors = [
        // Front face
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        // Right face
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        // Back face
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        // Left face
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        // Bottom face
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0
    ];
    this.Triangle.setColor(colors, 4,18);

    var vertices = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];
    this.Square.setPosition(vertices, 3, 4);

    var colors = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.5, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.5, 0.2, 0.3, 1.0
    ];
    this.Square.setColor(colors, 4, 4);

    var floorVert = [
        5.0, 0.0, 5.0,
        -5.0, 0.0, 5.0,
        5.0, 0.0, -5.0,
        -5.0,0.0,-5.0
    ]
    this.Floor.setPosition(floorVert, 3, 4);

    var colors = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 0.5, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.5, 0.2, 0.3, 1.0
    ];
    this.Floor.setColor(colors, 4, 4);

}

GLApp.prototype.drawScene = function () {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(90, gl.viewportWidth / gl.viewportHeight,0.1, 100.0, this.pMatrix);
    mat4.translate(this.pMatrix, [0.0, -3.0, -2.0]);
    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, [-1.0, 0.0, -3.0]);
    
    this.mvPushMatrix();
    this.Floor.draw(this.shaderProgram);
    mat4.translate(this.mvMatrix, [0.0, -0.5, 0.0]);
    this.setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.Floor.position.buffer.numItems);
    this.mvPopMatrix();

    this.mvPushMatrix();
    mat4.scale(this.mvMatrix, [5.0,5.0,5.0])
    mat4.translate(this.mvMatrix, [-1, 0.0, -1.0]);
    mat4.rotate(this.mvMatrix, this.degToRad(this.Triangle.rotation), [2, 0, 0]);
    this.Triangle.draw(this.shaderProgram);
    this.setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, this.Triangle.position.buffer.numItems);
    this.mvPopMatrix();

    mat4.translate(this.mvMatrix, [3.0, 0.0, 0.0]);

    this.mvPushMatrix();
    mat4.rotate(this.mvMatrix, this.degToRad(this.Square.rotation), [1, 1, 0]);
    this.Square.draw(this.shaderProgram);
    this.setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.Square.position.buffer.numItems);
    this.mvPopMatrix();

   

}

function move(posArr) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.translate(mvMatrix, posArr);
    mat4.rotate(mvMatrix, 0.01, [-0.01, 0.0, 0.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, this.triangleVertexPositionBuffer.numItems);
}

function moveToBack() {
    move([0.01, 0.0, -0.01]);
}

function moveToFront() {
    move([-0.01, 0.0, 0.01]);
}

GLApp.prototype.mvPushMatrix = function () {
    var copy = mat4.create();
    mat4.set(this.mvMatrix, copy);
    this.mvMatrixStack.push(copy);
}

GLApp.prototype.mvPopMatrix = function () {
    if (this.mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    this.mvMatrix = this.mvMatrixStack.pop();
}

GLApp.prototype.degToRad = function (degrees) {
    return degrees * Math.PI / 180;
}