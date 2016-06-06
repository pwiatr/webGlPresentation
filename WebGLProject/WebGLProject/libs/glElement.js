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
    this.velocity = 0;

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