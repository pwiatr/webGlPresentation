var gl;

function webGlStart() {
    var canvas = document.getElementById("firstCanvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
    
}


function initGL(canvas) {
    try{
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {

    }
    if (!gl) {
        alert("Could not initialise WebGL");
    }
}

function getShader(gl, id) {
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

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function initBuffers() {
    // Tworzenie bufora - fragment pamięci na karcie graficznej
    // Do bufora pójdą pozycje verteksów, które zostaną użyte do elementów
    triangleVertexPositionBuffer = gl.createBuffer();
    squareVertexPositionBuffer = gl.createBuffer();

    // Akcje działające na buforze będą używać ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    var vertices = [
        0.0, 1.0, 0.0,
       -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];
    // Tworzymy tablicę opartą o powyższą listę i wypełniamy nią bufor
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    // Specjalne właściwości, które mogą przydać się później
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    var vertices = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
}

function drawScene() {
    // Określamy rozmiar viewport (obszaru) do renderowania
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    // Wyczyszczenie canvas by rysować
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Pozwala na stworzenie perspektywy z ograniczoną widocznością - dzięki temu można używać głębi
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    // Aktualne pozycja i rotacja trzymane są w macierzy - np 4x4 wystarczy do wszystkich możliwych transformacji w 3D
    // Zaczynamy od macierzy jednostkowej (identity matrix) - która nic nie robi i którą mnożymy przez pierwszą transformację
    // Obliczona macierz przedstawia wszystkie ruchy na raz
    // Macierz wskazująca aktualny stan ruchu/obrotu zwana jest model-view matrix (mvMatrix)
    
    // Metoda identity ustawia mvMatrix jako jednostkową, by mieć od czego zacząć - przesuwa nas na punkt początkowy
    mat4.identity(mvMatrix);

    // Pora na rysowanie
    // Centrum przestrzeni 3d zostało ustawione (powyżej), więc pora zmienić pozycję i tam zacząć rysowanie trójkąta
    mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);

    // bindBuffer pozwala na określenie aktualnego bufora (ArrayBuffer) i wywołanie kodu, który na nim operuje
    // Wybieramy traingleVertexPositionBuffer i nakazujemy OpenGL korzystać z jego vertexów (ich pozycji)
    // itemSize wskazuje buforowi, że długość każdego elementu w buforze to trzy liczby
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Przesuwa działania do karty graficznej
    setMatrixUniforms();

    // WebGL ma tablice liczb (pozycje verteksów) i wie o macierzach - pora wskazać co ma z nimi zrobić
    // Zaczyna od elementu na indeksie 0 do elementu numItems
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    // Trójkąt jest narysowany - pora na kwadrat!
    
    //Zmiana macierzy na centrum (z powrotem) i ustawienie na 3 w prawo
    mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Wciśnięcie macierzy model-widok (mv) i macierzy projekcji
    setMatrixUniforms();

    // TRIANGLE_STRIP pozwala określić współrzędne kolejnych werteksów trójkątów - prosty sposób na zrobienie kwadratu
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);

}

function move(posArr) {
    // Wyczyszczenie canvas by rysować
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.translate(mvMatrix, posArr);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
}

function moveToBack() {
    move([0.0, 0.0, -1.0]);
}

function moveToFront() {
    move([0.0, 0.0, 1.0]);
}