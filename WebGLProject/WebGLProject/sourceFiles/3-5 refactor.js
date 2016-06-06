/// <reference path="../libs/gl-matrix.js" />
/// <reference path="../libs/glElement.js" />.
/// <reference path="../libs/webgl-utils.js" />.
var gl;

function WebGlWrapper(canvasId, width, height) {
    this.canvas = document.getElementById(canvasId);
    this.canvas.setAttribute("width", width);
    this.canvas.setAttribute("height", height);
    gl = this.canvas.getContext('experimental-webgl')
    gl.viewportWidth = this.canvas.width;
    gl.viewportHeight = this.canvas.height;

    //Setup Objects
    this.prepareObjects();

    //Initialize Shaders
    this.shaderProgram = null;
    this.initShaders('shader-fs', 'shader-vs');

    //Initialize global matrixes
    this.mvMatrix = mat4.create(); //view matrix
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create(); // projection matrix

    //Initialize buffers
    this.initBuffers();

    //Initialize scene
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //Draw scene
    this.drawScene();
    //Animation?
    this.tick();
    
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

    var fragmentShader = getShader("shader-fs");
    var vertexShader = getShader("shader-vs");

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

WebGlWrapper.prototype.initBuffers = function () {
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
        this.Triangle.setColor(colors, 4, 18);

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
            -5.0, 0.0, -5.0
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

WebGlWrapper.prototype.prepareObjects = function () {
    this.Triangle = new GlElement();
    this.Square = new GlElement();
    this.Floor = new GlElement();

    this.rTri = 0;
    this.rSquare = 0;
    this.lastTime = 0;
}

WebGlWrapper.prototype.drawScene = function () {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pMatrix, 2, gl.viewportWidth / gl.viewportHeight, 0.1, 500.0);
    mat4.translate(this.pMatrix, this.pMatrix, [0.0, -3.0, -2.0]);
    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, this.mvMatrix,[-1.0, 0.0, -3.0]);

    WebGLUtils.mvPushMatrix(this.mvMatrix, this.mvMatrixStack);
    mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, -0.5, 0.0]);
    this.Floor.draw(this.shaderProgram);
    WebGLUtils.setMatrixUniform(this.shaderProgram.pMatrixUniform, this.pMatrix);
    WebGLUtils.setMatrixUniform(this.shaderProgram.mvMatrixUniform, this.mvMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.Floor.position.buffer.numItems);
    WebGLUtils.mvPopMatrix(this.mvMatrix, this.mvMatrixStack);

    WebGLUtils.mvPushMatrix(this.mvMatrix, this.mvMatrixStack);
    mat4.scale(this.mvMatrix, this.mvMatrix, [5.0, 5.0, 5.0])
    mat4.translate(this.mvMatrix, this.mvMatrix, [-1, 0.0, -1.0 - this.Triangle.velocity]);
    mat4.rotate(this.mvMatrix, this.mvMatrix, WebGLUtils.degToRad(this.Triangle.rotation), [2, 0, 0]);
    this.Triangle.draw(this.shaderProgram);
    WebGLUtils.setMatrixUniform(this.shaderProgram.pMatrixUniform, this.pMatrix);
    WebGLUtils.setMatrixUniform(this.shaderProgram.mvMatrixUniform, this.mvMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, this.Triangle.position.buffer.numItems);
    WebGLUtils.mvPopMatrix(this.mvMatrix, this.mvMatrixStack);

    mat4.translate(this.mvMatrix, this.mvMatrix, [3.0, 0.0, 0.0]);

    WebGLUtils.mvPushMatrix(this.mvMatrix, this.mvMatrixStack);
    mat4.rotate(this.mvMatrix, this.mvMatrix, WebGLUtils.degToRad(this.Square.rotation), [0, 1, 0]);
    this.Square.draw(this.shaderProgram);
    WebGLUtils.setMatrixUniform(this.shaderProgram.pMatrixUniform, this.pMatrix);
    WebGLUtils.setMatrixUniform(this.shaderProgram.mvMatrixUniform, this.mvMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.Square.position.buffer.numItems);
    WebGLUtils.mvPopMatrix(this.mvMatrix, this.mvMatrixStack);



}

WebGlWrapper.prototype.tick = function () {
    requestAnimationFrame(this.tick.bind(this));

    this.drawScene();
    this.animate()
}

WebGlWrapper.prototype.animate = function () {
    var timeNow = new Date().getTime();
    if (this.lastTime != 0) {
        var elapsed = timeNow - this.lastTime;

        this.Triangle.velocity += (1 * elapsed) / 1000.0;
        this.Triangle.rotation += (45 * elapsed) / 1000.0;
        this.Square.rotation += (75 * elapsed) / 1000.0;
    }
    this.lastTime = timeNow;
}