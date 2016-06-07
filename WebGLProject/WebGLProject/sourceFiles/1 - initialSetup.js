/// <reference path="../libs/gl-matrix.js" />.
var gl;


function webGlStart() {
    var canvas = document.getElementById("firstCanvas");
    canvas.setAttribute("width",500);
    canvas.setAttribute("height", 500);
    // Inicjalizacja
    initGL(canvas);
    // Inicjalizacja shaderów
    initShaders();
    // Inicjalizacja bufora
    initBuffers();  

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
    
}

// Wstępna inicjalizacja webGL - pobranie kontekstu + ustawienie rozmiaru obszaru roboczego
function initGL(canvas) {
    try {
        // Zdobycie kontekstu WebGL - 
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {

    }
    if (!gl) {
        alert("Could not initialise WebGL");
    }
}

// Parsuje ustawione shadery do użycia w WebGL
// Wydobywa dwa shadery - fragment i vertex, które następnie zwraca
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

// SHADER - co to?
// *** Dawniej mówiły systemowi jak rysować cień/kolor/części scen przed narysowaniem
// *** Teraz potrafią niemal wszystko (przed narysowaniem sceny)
// *** Działają na karcie graficznej i potrafią robić całkiem niezłe przekształcenia

var shaderProgram;

function initShaders() {
    // Wydobycie shaderów - fragment i vertex
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    // Dopięcie shaderów do "programu"
    // "Program" to kod po stronie WebGL - coś co działa na karcie graficznej
    // "Program" może mieć wiele doczepionych shaderów
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    // Same shadery działają trochę jak "kod" doczepiony do WebGL, który z nich korzysta
    gl.useProgram(shaderProgram);

    // Każdy program może zawierać max 1 shader danego typu

    // Tworzymy nową właściwość dla shaderProgram
    // vertexPositionAttribute zostanie użyty do ustawienia pozycji verteksów trójkąta w buforze
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    // Mówimy WebGL, że będziemy chcieć dostarczyć wartości za pomocą tablicy
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    // Zapisanie dwóch kolejnych wartości dla programu  lokalizacje dwóch "uniform variables"
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

// Macierz do trzymania modelu-widoku (mv)
// W niej odbywa się proces przemiszczania/obracania elementów
var mvMatrix = mat4.create();
// Macierz do trzymania rzutowania (projekcji)
// Zajmuje się odwzorowaniem zjawiska "przestrzeni"
// Funkcja mat4.perspective wypełniła macierz wartościami, które dają "perspektywę"
//   Powyższe nadało m.in. aspect ratio czy field-of-view
var pMatrix = mat4.create();


// Przesłanie WebGL wartości, które uzyskaliśmy w kodzie Javascriptowym
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
    
    drawElements();
}

var trpos = [-1.5, 0.0, -5.0];
var sqpos = [3.0, 0.0, 0.0];

function drawElements() {
    // Metoda identity ustawia mvMatrix jako jednostkową, by mieć od czego zacząć - przesuwa nas na punkt początkowy
    mat4.identity(mvMatrix);

    // Pora na rysowanie
    // Centrum przestrzeni 3d zostało ustawione (powyżej), więc pora zmienić pozycję i tam zacząć rysowanie trójkąta
    mat4.translate(mvMatrix, trpos);

    // bindBuffer pozwala na określenie aktualnego bufora (ArrayBuffer) i wywołanie kodu, który na nim operuje
    // Wybieramy traingleVertexPositionBuffer i nakazujemy OpenGL korzystać z jego vertexów (ich pozycji)
    // itemSize wskazuje buforowi, że długość każdego elementu w buforze to trzy liczby
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Przesuwa działania do karty graficznej (tudzież obliczenia na macierzach)
    setMatrixUniforms();

    // WebGL ma tablice liczb (pozycje verteksów) i wie o macierzach - pora wskazać co ma z nimi zrobić
    // Zaczyna od elementu na indeksie 0 do elementu numItems
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    // Trójkąt jest narysowany - pora na kwadrat!

    //Zmiana macierzy na centrum (z powrotem) i ustawienie na 3 w prawo
    mat4.translate(mvMatrix, sqpos);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Wciśnięcie macierzy model-widok (mv) i macierzy projekcji
    setMatrixUniforms();

    // TRIANGLE_STRIP pozwala określić współrzędne kolejnych werteksów trójkątów - prosty sposób na zrobienie kwadratu
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function move(matrix, arr) {
    // Wyczyszczenie canvas by rysować
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.translate(matrix, arr);
    drawElements();
}

function rotate(matrix, arr) {
    // Wyczyszczenie canvas by rysować
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.rotate(matrix, 0.285, arr);
    drawElements();
}

function moveElements(x, y, z) {
    // Wyczyszczenie canvas by rysować
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    trpos[0] += x;
    trpos[1] += y;
    trpos[2] += z;
    sqpos[0] += x;
    sqpos[1] += y;
    sqpos[2] += z;

    drawElements();
}

