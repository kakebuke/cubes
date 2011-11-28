var CUBE_WIDTH = 32;
var CUBE_HEIGHT = 32;
var CANVAS_WIDTH = 500;
var CANVAS_HEIGHT = 500;
var NUM_COLS = CANVAS_WIDTH / CUBE_WIDTH;
var NUM_ROWS = CANVAS_HEIGHT / (CUBE_HEIGHT/2);

var COLOR_GREY = "rgb(200,200,200)";


var DEBUG_TILE = false;

var ctx;
var cube;
var canvas;

var mapArray = new Array(10);
for (var i = 0; i < mapArray.length; i++)
{
	mapArray[i] = new Array(10);
}



function init() 
{
	var START_POINT = new Point(200,200);
	var canvasHtml = '<canvas id="canvas" width="' + CANVAS_WIDTH + '" height="' + CANVAS_HEIGHT + '"></canvas>';
	document.getElementById("main").innerHTML = canvasHtml;
	canvas = document.getElementById("canvas");
	var fill = true;
	
	var initialPoint = START_POINT;
	
	if (canvas.getContext)
	{
		ctx = canvas.getContext("2d");
		
		canvas.addEventListener("click", alertOnClick, false);
		
		for (var i = 0; i < mapArray.length; i++)
		{
			for (var j = 0; j < mapArray[i].length; j++)
			{
				drawGridSquare(new Point(initialPoint.x() - (j * 16), initialPoint.y() + (j * 8)), fill, "" + i + "/" + j);
				fill = !fill;
			}
			initialPoint.setX(initialPoint.x()+16);
			initialPoint.setY(initialPoint.y()+8);
			fill = !fill;
		}		
		load();
	}
}

function drawGridSquare(pos, fill, num)
{
	var xIni,
		yIni;
		
	xIni = pos.x();
	yIni = pos.y() + 24;
	
	ctx.beginPath();
	ctx.moveTo(xIni, yIni);
	ctx.lineTo(xIni + 16, yIni - 8); 
	ctx.lineTo(xIni + 32, yIni);
	ctx.lineTo(xIni + 16, yIni + 8);
	ctx.lineTo(xIni, yIni);
	ctx.closePath();
	ctx.fillStyle = COLOR_GREY;
	ctx.strokeStyle = COLOR_GREY;
	if (fill == true)
		ctx.fill();
	ctx.stroke();
	
	if (DEBUG_TILE) 
	{
		ctx.strokeStyle='rgb(0,0,0)';
		ctx.font         = 'normal 11px sans-serif';
		ctx.strokeText(num,xIni +8, yIni+3);
	}	
}

function load()
{
	cube = new Image();
	cube.src = 'images/cubeOrange.png';
	cube.onload = function()
	{
		drawCube( new Point(0,0) );
	 	

	};
}

function drawCube(pos)
{
	pos = getPosByTile(pos.x(),pos.y());
	
	ctx.drawImage(cube, pos.x(), pos.y());
}

function getPosByTile(tx, ty)
{
	var initialPoint = new Point(200,200);
	var pos = new Point(initialPoint.x() + (tx * 16) - (ty * 16), initialPoint.y() + (ty * 8) + (tx * 8));
	return pos;
}

function tileFromPos(pos)
{
	var canvasX = pos.x() - canvas.offsetLeft;
	var canvasY = pos.y() - canvas.offsetTop;
	var tileX = null;
	var tileY = null;
	
	if (canvasX >= 0 && canvasX <= CANVAS_WIDTH && canvasY >= 0 && canvasY <= CANVAS_HEIGHT)
	{
		canvasX = canvasX - 216;
		canvasY = canvasY - 216;
		
	    tileX = Math.floor(((2 * canvasY) + canvasX) / CUBE_WIDTH);
	    tileY = Math.floor(((2 * canvasY) - canvasX) / CUBE_HEIGHT);	
	}
	
	return {tx: tileX, ty: tileY};
}

function alertOnClick(evt)
{
	var clickedOn = new Point(evt.pageX, evt.pageY);
	var tilePos = tileFromPos(clickedOn);
	
	//alert("Clicked on tile: " + tilePos.tx + " , " + tilePos.ty);

    if (tilePos.tx >= 0 && tilePos.tx < 10 && tilePos.ty >= 0 && tilePos.ty < 10)
    {
        drawCube(new Point(tilePos.tx, tilePos.ty));
    }
}

var Point = function(x,y)
{
	this._x = x || 0;
	this._y = y || 0;
	
	this.x = function() {return this._x;};
	this.y = function() {return this._y;};
	
	this.setX = function(value) {this._x = value;};
	this.setY = function(value) {this._y = value;};	
};

