/// <reference path="../libs/gl-matrix.js" />.
var gl;

function GLApp() {
    this.canvas = document.getElementById("firstCanvas");
    gl = this.canvas.getContext('experimental-webgl');
    
    this.triangleVertexPositionBuffer = null;
    this.squareVertexPositionBuffer = null;
    this.squareVertexColorBuffer = null;
    this.triangleVertexColorBuffer = null;

    this.rTri = 0;
    this.rSquare = 0;
    this.lastTime = 0;

    this.shaderProgram = null;
    this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();

    this.canvas.setAttribute("width", 600);
    this.canvas.setAttribute("height", 600);
    
    this.initGL();
    this.initShaders();
    this.initBuffers();

    gl.clearColor(1.0,1.0,1.0, 1.0);
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

        this.rTri += (90 * elapsed) / 1000.0;
        this.rSquare += (75 * elapsed) / 1000.0;
    }
    this.lastTime = timeNow;
}

GLApp.prototype.initGL = function() {
    try {
        gl = this.canvas.getContext("experimental-webgl");
        gl.viewportWidth = this.canvas.width;
        gl.viewportHeight = this.canvas.height;
    } catch (e) { }
    (!gl) ? alert("Could not initialise WebGL") : null;
}

GLApp.prototype.getShader = function(id) {
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

GLApp.prototype.setMatrixUniforms = function() {
    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
}

GLApp.prototype.initBuffers = function() {
    this.triangleVertexPositionBuffer = gl.createBuffer();
    this.triangleVertexColorBuffer = gl.createBuffer();
    this.squareVertexPositionBuffer = gl.createBuffer();
    this.squareVertexColorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexPositionBuffer);
    var vertices = [
        0.0, 1.0, 0.0,
       -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.triangleVertexPositionBuffer.itemSize = 3;
    this.triangleVertexPositionBuffer.numItems = 3;

    this.triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexColorBuffer);
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.5, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    this.triangleVertexColorBuffer.itemSize = 4;
    this.triangleVertexColorBuffer.numItems = 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    var vertices = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.squareVertexPositionBuffer.itemSize = 3;
    this.squareVertexPositionBuffer.numItems = 4;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexColorBuffer);
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.5, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.5, 0.2, 0.3, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    this.squareVertexColorBuffer.itemSize = 4;
    this.squareVertexColorBuffer.numItems = 4;
}

GLApp.prototype.drawScene = function() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, this.pMatrix);
    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, [-1.0, 0.0, -7.0]);

    this.mvPushMatrix();
    mat4.rotate(this.mvMatrix, this.degToRad(this.rTri), [10, 0.1, 0.1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexPositionBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triangleVertexColorBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    this.setMatrixUniforms();

    gl.drawArrays(gl.TRIANGLES, 0, this.triangleVertexPositionBuffer.numItems);
    this.mvPopMatrix();

    mat4.translate(this.mvMatrix, [3.0, 0.0, 0.0]);
    this.mvPushMatrix();
    
    mat4.rotate(this.mvMatrix, this.degToRad(this.rSquare), [1, 1, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexColorBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, this.squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);


    this.setMatrixUniforms();

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);

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

GLApp.prototype.mvPushMatrix = function() {
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