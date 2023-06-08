var gl;
    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl", {stencil:true});
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
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
		shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }
    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
	
	var mvMatrixStack = [];

    function mvPushMatrix() {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }
    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }
    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }
	
	
	var pyramidVerPosBuff;
	var pyramidVerColBuff;
	var pyramidFan1Buff;
	var pyramidFan2Buff;
	
    function initBuffers() {
        pyramidVerPosBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVerPosBuff);
        vertices = [
				0.0, 1.0, 0.0,
                1.0, -1.0, 1.0,
                -1.0, -1.0, 1.0,
                1.0, -1.0, -1.0,
                -1.0, -1.0, -1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        pyramidVerPosBuff.itemSize = 3;
        pyramidVerPosBuff.numItems = 5;
		
		pyramidVerColBuff = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVerColBuff);
		colors = [
			0.0, 0.0, 0.0, 1.0,
			1.0, 1.0, 1.0, 1.0,
			0.0, 1.0, 1.0, 1.0,
			1.0, 0.0, 1.0, 1.0,
			1.0, 1.0, 0.0, 1.0
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		pyramidVerColBuff.itemSize = 4;
		pyramidVerColBuff.numItems = 5;
		
		
		pyramidFan1Buff = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidFan1Buff);
		tFan1 = [
				0,2,1,
                0,1,3,
                0,3,4,
                0,4,2
		];
		
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tFan1), gl.STATIC_DRAW);
		pyramidFan1Buff.itemSize = 1;
		pyramidFan1Buff.numItems = 4 * 3;
		
		pyramidFan2Buff = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidFan2Buff);
		tFan2 = [
				1, 3, 2,
				4, 3, 2
		];
		
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tFan2), gl.STATIC_DRAW);
		pyramidFan2Buff.itemSize = 1;
		pyramidFan2Buff.numItems = 2 * 3;
	}
	
	   
    var squareVertexPositionBuffer;
	var squareVertexColorBuffer;
	
	
	function drawStage(){
	
		gl.frontFace(gl.CW);
		
		mvPushMatrix();
		
		mat4.translate(mvMatrix, [0.0, -2.0, -8.0]);
		
		mat4.scale(mvMatrix, [2.5, 1.5, 2.0]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.depthMask(false);
		gl.colorMask(true, false, false, true);
		
        setMatrixUniforms();
		
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
		
		gl.colorMask(true, true, true, true);
		gl.depthMask(true);
		
		mvPopMatrix();
	
	}
	
    function renderStage() {		
        squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        var flatSquareVertices = [
            -1.0, 0.0, -1.0,

			1.0, 0.0, -1.0,

			-1.0, 0.0, 1.0,

			1.0, 0.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatSquareVertices), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 3;
        squareVertexPositionBuffer.numItems = 4;
		
		squareVertexColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
		var flatSquareColors = [
			1.0, 0.0, 0.0, 0.5,

			1.0, 0.0, 0.0, 1.0,

			0.0, 0.0, 0.0, 0.0,

			0.5, 0.0, 0.0, 0.5
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatSquareColors), gl.STATIC_DRAW);
		squareVertexColorBuffer.itemSize = 4;
		squareVertexColorBuffer.numItems = 4;
		
		drawStage();
    
	}
	
	function renderToStencil(){
	
		gl.enable(gl.STENCIL_TEST);
		gl.stencilFunc(gl.ALWAYS, 1, 0xFFFFFFFF);
		gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
		
		renderStage();
		
		gl.stencilFunc(gl.EQUAL, 1, 0xFFFFFFFF);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);		
	
	}
	
	var transY = 0.0;
	var rPyramid = 0.0;
	
	function degreeToRadians(degrees){
		return degrees * Math.PI / 180;
	}
	
	function drawPyramid(){
		gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVerPosBuff);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVerPosBuff.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVerColBuff);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pyramidVerColBuff.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidFan1Buff);
		setMatrixUniforms();
		gl.drawElements(gl.TRIANGLE_FAN, pyramidFan1Buff.numItems, gl.UNSIGNED_SHORT, 0);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidFan2Buff);
		setMatrixUniforms();
		gl.drawElements(gl.TRIANGLE_FAN, pyramidFan2Buff.numItems, gl.UNSIGNED_SHORT, 0);
		
	}
	
    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);	
		
		
		renderToStencil();
		
		//adjusting the frustum
		var fieldOfView = 60.0;
		var aspectRatio = gl.viewportWidth/gl.viewportHeight;
		var zNear = 0.1;
		var zFar = 1000.0;
		
		
        mat4.perspective(fieldOfView, aspectRatio, zNear, zFar, pMatrix);
		
		
		gl.enable(gl.CULL_FACE);
		
		gl.cullFace(gl.BACK);
		
		mat4.identity(mvMatrix);
		       
		
		mvPushMatrix();
		
		gl.enable(gl.STENCIL_TEST);
		
		gl.disable(gl.DEPTH_TEST);		
		
		mat4.translate(mvMatrix, [0.0, (Math.sin(-transY)/ 2.0) - 2.5, -8.0]);
		
		mat4.rotate(mvMatrix, degreeToRadians(rPyramid), [0, 1, 0]);
		
		mat4.scale(mvMatrix, [1.0, -1.0, 1.0]);
		
		gl.frontFace(gl.CW);
		
		gl.enable(gl.BLEND);
		
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
		
		drawPyramid();
		
		gl.disable(gl.BLEND);
		
		mvPopMatrix();
		
		gl.enable(gl.DEPTH_TEST);
		
		gl.disable(gl.STENCIL_TEST);
		
		mvPushMatrix();
		
		mat4.scale(mvMatrix, [1.0, 1.0, 1.0]);
		
		gl.frontFace(gl.CCW);
		
		mat4.translate(mvMatrix, [0.0, 1.5 * (Math.sin(transY)/ 2.0) + 2.0, -8.0]);
		
		mat4.rotate(mvMatrix, degreeToRadians(rPyramid), [0, 1, 0]);
		
		transY += 0.075;
		rPyramid += 0.4;
		
        drawPyramid();	
		
		mvPopMatrix();
        
    }

	function onSceneChanged(){

		requestAnimFrame(onSceneChanged);
		
		drawScene();	
	}


    function webGLStart() {
        var canvas = document.getElementById("reflectiveSurface");
        initGL(canvas);
        initShaders();
        initBuffers();
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
		
		onSceneChanged();
    }