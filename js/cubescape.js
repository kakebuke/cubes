var GRID_SPACING = 10;
var SELECTION_OFFSET_X = 5;
var SELECTION_OFFSET_Y = 11;

var cubes = [];
var order = [];
var cubeId = 0;
var canvasLock = false;
var replayMarker = 0;
var replaying = false;
var animateReplayTimer = null;

function init()
{
	/* Selecting a colour */
	if (document.getElementById("colourSelect") == null)
	{
		$("body").append('<div id="colourSelect"></div>');
	}

	var currentlySelected = $("#colours .on");
	
	if (currentlySelected.length > 0)
	{
		var offset = currentlySelected.offset();
		$("#colourSelect").css("left", offset.left).css("top", offset.top);
		
		selectedColour = currentlySelected[0].id;
	}
	
	$("#colours a").click(function()
		{
			$("#colours li").removeClass("on");
			
			var offset = $(this).offset();
			var anchor = this;
			
			$("#colourSelect").animate({"left": offset.left, "top": offset.top}, 600);
			
			$("#sizes").fadeOut(400, function()
				{
					$("#sizes").removeClass().addClass(anchor.parentNode.id).fadeIn(400);
				}
			);
			
			selectedColour = this.parentNode.id;
			$(this.parentNode).addClass("on");
			
			this.blur();
			
			$("#draw a").click();
			
			return false;
		}
	);
	
	$("a", currentlySelected).click();
	
	/* Canvas resizing */
	resizeCanvas();
	
	$(window).bind("resize", resizeCanvas);
	
	function resizeCanvas()
	{
		var window = $("body");
		var canvasContainer = $("#canvasContainer");
		var canvas = $("#canvas");
		
		var width = window.width();
		var height = window.height() - $("#header").height();
		
		canvasContainer.css("height", height);			
		canvas.css("width", width).css("height", height);
	};
	
	$("#toolbar a")
		.mouseover(function()
			{
				if ($(this).parents("li")[0].id != "save")
				{
					if (document.getElementById("toolbarTooltip") == null)
					{
						var tooltip = $('<div id="toolbarTooltip"></div>');
						tooltip.appendTo("#header");
					}
					
					$("#toolbarTooltip").text(this.title)
	
					this.oldTitle = this.title;
					this.title = "";
				}
			}
		)
		.mouseout(function()
			{
				if ($(this).parents("li")[0].id != "save")
				{
					this.title = this.oldTitle;
					
					$("#toolbarTooltip").remove();
				}
			}
		)
	
	/* Draw */
	$("#draw a").click(function()
		{
			if (replaying)
			{
				return false;
			}
			
			var erase = $("#erase");
			var replay = $("#replay");

			erase.removeClass("buttonDown");
			$("#gridSelect").removeClass("erase");
			$(".cube").unbind();
			$(".vShadow").unbind();
			
			replay.removeClass("buttonDown");
			
			$("#draw").addClass("buttonDown");
			
			return false;
		}
	).click();
	
	/* Erase cubes */
	$("#erase a").click(function()
		{
			if (replaying)
			{
				return false;
			}
			
			var draw = $("#draw");
			var erase = $("#erase");
			
			draw.removeClass("buttonDown");
			
			if (!erase.hasClass("buttonDown"))
			{
				erase.addClass("buttonDown");

				$("#gridSelect").addClass("erase");
				
				$(".cube").click(function()
					{
						var cube = $(this);
						
						cube.unbind();
						
						var id = this.id.replace(/cube/, "");
						var row = this.row;
						var col = this.col;
						
						order[order.length] = {"id": id, "row": row, "col": col, "colour": "delete"};
						
						var exploder = $('<div class="exploder"><div class="left"></div><div class="right"></div></div>');

						if (cubes[row][col][cubes[row][col].length - 1].id == this.id)
						{
							exploder.append('<div class="top"></div>');
						}
						
						exploder
							.css("left", cube.css("left"))
							.css("top", cube.css("top"))
							.css("zIndex", cube.css("zIndex"))

						cube.after(exploder);
						cube.remove();
						
						explosion(exploder);
						
						$("#vShadow" + id).remove();
						
						$("#shadow" + id).animate({"opacity": 0}, 400, function()
							{
								$(this).remove();
							}
						);

						for (var i = 0; i < cubes[row][col].length; i++)
						{
							if (cubes[row][col][i].id == "cube" + id)
							{
								cubes[row][col].splice(i, 1);
								
								break;
							}
						}
						
						var old = i;
						
						for (; i < cubes[row][col].length; i++)
						{
							id = cubes[row][col][i].id.replace(/cube/, "");
							
							$("#" + cubes[row][col][i].id).animate({"top": parseInt($("#" + cubes[row][col][i].id).css("top")) - 5 - 5 * (i - old)}, 100 + 20 * (i - old), "easeOutQuart", function(index)
								{
									return function()
									{
										$("#" + cubes[row][col][index].id).animate(
											{
												"top": (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y - index * GRID_SPACING
											},
											300,
											"easeInQuart",
											function()
											{
												if (index == cubes[row][col].length - 1)
												{
													checkShadows(row, false);
												}
											}
										);
									}
								}(i)
							);

							$("#vShadow" + id).animate({"top": parseInt($("#" + cubes[row][col][i].id).css("top")) - 5 - 5 * (i - old) + 5}, 100 + 20 * (i - old), "easeOutQuart", function(id, index)
								{
									return function()
									{
										$("#vShadow" + id).animate(
											{
												"top": (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y - index * GRID_SPACING + 5
											},
											300,
											"easeInQuart"
										);
									}
								}(id, i)
							);
							
							var shadow = $("#shadow" + id);
							shadow.animate(
								{
									"left": parseInt(shadow.css("left")) + 5 + 5 * (i - old),
									"top": parseInt(shadow.css("top")) - 3 - parseInt(2.5 * (i - old))
								}, 100 + 20 * (i - old),
								"easeOutQuart",
								function(id, index)
								{
									return function()
									{
										var shadow = $("#shadow" + id);
										shadow.animate(
											{
												"left": row * GRID_SPACING + col * GRID_SPACING - SELECTION_OFFSET_X + index * GRID_SPACING + GRID_SPACING,
												"top": (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y - index * GRID_SPACING + 6 + index * GRID_SPACING / 2
											},
											300,
											"easeInQuart"
										);
										
									}
								}(id, i)
							);
						}
					}
				);
				
				$(".cube")
					.mouseover(function()
						{
							$(this).addClass("cubeErase");
						}
					)
					.mouseout(function()
						{
							$(this).removeClass("cubeErase");
						}
					)
				
				$(".vShadow")
					.mouseover(function()
						{
							$("#cube" + this.id.replace(/vShadow/, "")).mouseover();
						}
					)
					.mouseout(function()
						{
							$("#cube" + this.id.replace(/vShadow/, "")).mouseout();
						}
					)
					.click(function()
						{
							$("#cube" + this.id.replace(/vShadow/, "")).click();
						}
					)
			}
			
			return false;
		}
	);
	
	function explosion(exploder)
	{
		switch (true)
		{
			case exploder.hasClass("exploder9"):
				exploder.remove();
				
				return;
				
				break;
				
			case exploder.hasClass("exploder8"):
				exploder.removeClass("exploder8");
				exploder.addClass("exploder9");
				
				break;
				
			case exploder.hasClass("exploder7"):
				exploder.removeClass("exploder7");
				exploder.addClass("exploder8");
				
				break;
				
			case exploder.hasClass("exploder6"):
				exploder.removeClass("exploder6");
				exploder.addClass("exploder7");
				
				break;
				
			case exploder.hasClass("exploder5"):
				exploder.removeClass("exploder5");
				exploder.addClass("exploder6");
				
				break;
				
			case exploder.hasClass("exploder4"):
				exploder.removeClass("exploder4");
				exploder.addClass("exploder5");
				
				break;
				
			case exploder.hasClass("exploder3"):
				exploder.removeClass("exploder3");
				exploder.addClass("exploder4");
				
				break;
				
			case exploder.hasClass("exploder2"):
				exploder.removeClass("exploder2");
				exploder.addClass("exploder3");
				
				break;
				
			case exploder.hasClass("exploder1"):
				exploder.removeClass("exploder1");
				exploder.addClass("exploder2");
				
				break;
				
			case exploder.hasClass("exploder0"):
				exploder.removeClass("exploder1");
				exploder.addClass("exploder1");
				
				break;
				
			default:
				exploder.addClass("exploder0");
				
				break;
		}
		
		setTimeout(function()
			{
				explosion(exploder);
			},
			50
		);
	};
	
	/* Replay cubescape */
	$("#replay").click(clickReplay)
	
	function clickReplay()
	{
		if (replaying)
		{
			return false;
		}
		
		var draw = $("#draw");
		var erase = $("#erase");
		
		draw.removeClass("buttonDown");
		erase.removeClass("buttonDown");
		
		$(this).addClass("buttonDown");
		
		$(".cube").remove();
		$(".shadow").remove();
		cubes = [];
		
		animateReplay();
		
		return false;
	}
	
	if (order.length > 0)
	{
		var data = cubes;
		
		var label = $('<div id="label">' + meta.title + '<br /><em>by ' + meta.creator + '</em></div>').appendTo("body");
		var createOrSkip = $('<div id="createOrSkip"><ul><li class="button"><div class="buttonInner">	<a href="new.php">Create your own cubescape</a></div></li><li id="skip" class="button"><div class="buttonInner">	<a href="#">Skip the animation</a></div></li></ul></div>').appendTo("body");
		
		$("#skip").click(function()
			{
				function skipPlaceCube(row, col, stack, selectedColour)
				{
					var MAX_CUBE_HEIGHT = 21;
					
					var targetX = row * GRID_SPACING + col * GRID_SPACING - SELECTION_OFFSET_X;
					var targetY = (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y;
			
					var stackHeight = stack * GRID_SPACING;
			
					var shadowHTML = "";
					
					if (selectedColour != "coloursTransparent")
					{
						shadowHTML = '<div class="shadow" style="left: ' + (targetX + stackHeight + GRID_SPACING) + 'px; top: ' + (parseInt(targetY + 6 - stackHeight / 2)) + 'px;"></div>';
					}
			
					return {
						cubeHTML: '<div class="cube cube' + selectedColour + '" style="left: ' + targetX + 'px; top: ' + (targetY - stackHeight) + 'px; z-index: ' + (row * 100 - col) + ';"></div>',
						shadowHTML: shadowHTML
					};
				};
				
				function skipCheckShadows(row, rowNum, canvas)
				{
					var minCol = 0;
					
					for (var col in row)
					{
						if (parseInt(col) < minCol)
						{
							minCol = parseInt(col);
						}
					}
			
					for (var col in row)
					{
						col = parseInt(col);
						
						for (var height = 0; height < row[col].length; height++)
						{
							var unshadowed = true;
							
							/* Items that shadow it */
							for (var i = col - 2, j = height + 2; i >= minCol; j++, i--)
							{
								if (typeof row[i] != "undefined" && row[i].length >= j && !$("#" + row[i][j - 1].id).hasClass("cubecoloursTransparent") && (typeof row[col - 1] == "undefined" || row[col - 1].length < height))
								{
									unshadowed = false;
									
									if ($(".row" + rowNum + "col" + col, canvas).length == 0)
									{
										var rowElement = $('<div class="row row' + rowNum + 'col' + col + '"></div>');
										rowElement.prependTo(canvas).css("zIndex", rowNum * 100 + col + 1)
									}
									
									if ($("vShadow" + row[col][height].id.replace(/cube/, ""), canvas).length == 0)
									{
										var verticalShadow = $('<div class="shadow vShadow vShadow' + row[col][height].id.replace(/cube/, "") + '"></div>');
			
										verticalShadow
											.appendTo($(".row" + rowNum + "col" + col, canvas))
											.css("left", rowNum * GRID_SPACING + col * GRID_SPACING - SELECTION_OFFSET_X)
											.css("top", (rowNum * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - 6 - ((height) * GRID_SPACING))
											.css("opacity", 0.99)
									}
											
									break;
								}
							}
							
							if (unshadowed)
							{
								$(".vShadow" + row[col][height].id.replace(/cube/, ""), canvas).remove();
							}
						}
					}
				};
	
				if (animateReplayTimer != null)
				{
					clearTimeout(animateReplayTimer);
				}
				
				var canvas = $("#canvas");
				$(".cube", canvas).remove();
				$(".row", canvas).remove();
				
				var shadows = $("#shadows").html("");
				
				var cubesHTML = "";
				var shadowsHTML = "";
		
				for (var row = 0; row < data.length; row++)
				{
					if (typeof data[row] != "undefined")
					{
						for (var col in data[row])
						{
							for (var stack = 0; stack < data[row][col].length; stack++)
							{
								col = parseInt(col);
								
								var cubePlacement = skipPlaceCube(row, col, stack, data[row][col][stack].colour);
								cubesHTML += cubePlacement.cubeHTML;
								shadowsHTML += cubePlacement.shadowHTML;
							}
						}
					}
					
					skipCheckShadows(data[row], row, canvas);
				}
console.log(shadows, shadowsHTML);
				
				canvas.append(cubesHTML);
				shadows.html(shadowsHTML);
				
				return false;
			}
		);
		
		$("#replay").click();
	}
	else
	{
		var startArrow = $('<div id="startArrow">Click somewhere around here to start dropping cubes<span id="arrow"></span></div>').appendTo("body");
		
		function arrowUp()
		{
			$("#arrow").animate(
				{
					"marginTop": 15
				},
				750,
				arrowDown
			);
		}
		
		function arrowDown()
		{
			$("#arrow").animate(
				{
					"marginTop": 0
				},
				750,
				arrowUp
			);
		}
		
		arrowDown();
	}
	
	function animateReplay()
	{
		replaying = true;
		
		if (replayMarker >= order.length)
		{
			replaying = false;
			
			replayMarker = 0;
			
			$("#draw a").click();
			
			return;
		}

		if (order[replayMarker].colour == "delete")
		{
			var id = order[replayMarker].id;
			var row = order[replayMarker].row;
			var col = order[replayMarker].col;
			var cube = $("#cube" + id);
			
			$("#vShadow" + id).remove();
			$("#shadow" + id).remove();
			
			for (var i = 0; i < cubes[row][col].length; i++)
			{
				if (cubes[row][col][i].id == "cube" + id)
				{
					cubes[row][col].splice(i, 1);
				
					for (; i < cubes[row][col].length; i++)
					{
						var top = parseInt($("#" + cubes[row][col][i].id).css("top"));
						
						$("#" + cubes[row][col][i].id).css("top", top + GRID_SPACING);

						$("#shadow" + cubes[row][col][i].id.replace(/cube/, ""))
							.css("left", row * GRID_SPACING + col * GRID_SPACING - SELECTION_OFFSET_X + i * GRID_SPACING + GRID_SPACING)
							.css("top", (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y - i * GRID_SPACING + 6 + i * GRID_SPACING / 2)

						$("#vShadow" + cubes[row][col][i].id.replace(/cube/, ""))
							.css("top", (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y - i * GRID_SPACING + 5)
					}
					
					break;
				}
			}

			cube.remove();

			checkShadows(row, true);
		}
		else
		{
			placeCube(order[replayMarker].row, order[replayMarker].col, order[replayMarker].colour, order[replayMarker].id);
		}
		
		replayMarker++;
		
		animateReplayTimer = setTimeout(animateReplay, 25);
	};

	/* Show selection on canvas */
	$(document).mousemove(showSelection)
	
	function showSelection(event)
	{
		if (typeof showTopIndicatorTimer != "undefined")
		{
			clearTimeout(showTopIndicatorTimer);
		}
		
		var GRID_STAGGER = 5;
		var SELECTION_OFFSET_X = 11;
		var SELECTION_OFFSET_Y = 3;
		
		var offset = $("#canvas").offset();
		
		if (event.clientY > offset.top + GRID_SPACING)
		{
			if (document.getElementById("gridSelect") == null)
			{
				$("#canvas").append('<div id="gridSelect"></div>');
				
				if ($("#erase").hasClass("buttonDown"))
				{
					$("#gridSelect").addClass("erase");
				}
			}
			
			if (parseInt(event.clientX / GRID_SPACING) % 2 == 0)
			{
				var row = Math.floor((event.clientY - offset.top) / GRID_SPACING) + Math.floor(event.clientX / (2 * GRID_SPACING));
				var col = -Math.floor((event.clientY - offset.top) / GRID_SPACING) + Math.floor((event.clientX + GRID_SPACING) / (2 * GRID_SPACING));
			}
			else
			{
				var row = Math.floor((event.clientY + GRID_SPACING / 2 - offset.top) / GRID_SPACING) + Math.floor(event.clientX / (2 * GRID_SPACING));
				var col = -Math.floor((event.clientY + GRID_SPACING / 2 - offset.top) / GRID_SPACING) + Math.floor((event.clientX + GRID_SPACING) / (2 * GRID_SPACING));
			}

			$("#gridSelect").css("left", row * GRID_SPACING + col * GRID_SPACING - SELECTION_OFFSET_X);
			
			$("#gridSelect").css("top", (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y);
			
			if (!$("#erase").hasClass("buttonDown") && typeof cubes[row] != "undefined" && typeof cubes[row][col] != "undefined")
			{
				function topIndicatorFlashUp()
				{
					var topIndicator = $("#topIndicator");
					
					if (topIndicator.length > 0)
					{
						topIndicator.animate(
							{
								"opacity": 0.9
							},
							500,
							"linear",
							topIndicatorFlashDown
						)
					}
				}
				
				function topIndicatorFlashDown()
				{
					var topIndicator = $("#topIndicator");
					
					if (topIndicator.length > 0)
					{
						topIndicator.animate(
							{
								"opacity": 0
							},
							500,
							"linear",
							topIndicatorFlashUp
						)
					}
				}

				var topIndicator = $("#topIndicator");
				
				if (topIndicator.length <= 0)
				{
					topIndicator = $('<div id="topIndicator"></div>');
					topIndicator.css("opacity", 0);
				
					setTimeout(topIndicatorFlashUp, 1);
				}

				topIndicator.css("zIndex", $("#" + cubes[row][col][cubes[row][col].length - 1].id).css("zIndex"));
				topIndicator.css("left", row * GRID_SPACING + col * GRID_SPACING - GRID_STAGGER);
				topIndicator.css("top", (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - 1 - cubes[row][col].length * GRID_SPACING);
				
				topIndicator.appendTo("#canvas");
			}
			else
			{
				$("#topIndicator").remove();
			}
			
			/* Trap double clicks */
			$("#gridSelect").mousedown(function()
				{
					return false;
				}
			);
		}
	}

	/* Place block on canvas */	
	$(document).click(clickCanvas);
	
	function clickCanvas(event)
	{
/*
		$("#startArrow").animate(
			{
				"opacity": 0
			},
			250,
			function()
			{
				$(this).remove();
			}
		);
*/

$("#startArrow").remove();
		
		if ($("#draw").hasClass("buttonDown"))
		{
			var offset = $("#canvas").offset();
			
			if (event.clientY > offset.top + SELECTION_OFFSET_Y)
			{
				$(document).unbind("mousemove").mousemove(function()
					{
						$(document).unbind("mousemove").mousemove(showSelection);
					}
				);
				
				if (parseInt(event.clientX / GRID_SPACING) % 2 == 0)
				{
					var row = Math.floor((event.clientY - offset.top) / GRID_SPACING) + Math.floor(event.clientX / (2 * GRID_SPACING));
					var col = -Math.floor((event.clientY - offset.top) / GRID_SPACING) + Math.floor((event.clientX + GRID_SPACING) / (2 * GRID_SPACING));
				}
				else
				{
					var row = Math.floor((event.clientY + GRID_SPACING / 2 - offset.top) / GRID_SPACING) + Math.floor(event.clientX / (2 * GRID_SPACING));
					var col = -Math.floor((event.clientY + GRID_SPACING / 2 - offset.top) / GRID_SPACING) + Math.floor((event.clientX + GRID_SPACING) / (2 * GRID_SPACING));
				}

				placeCube(row, col, selectedColour);

				if (typeof showTopIndicatorTimer != "undefined")
				{
					clearTimeout(showTopIndicatorTimer);
				}
				
				showTopIndicatorTimer = setTimeout(function()
					{
						showSelection(event);
					},
					2000
				);
				
				return false;
			}
		}
	};
	
	function placeCube(row, col, selectedColour, id)
	{
		$("#topIndicator").remove();
		
		var MAX_CUBE_HEIGHT = 21;
		var DROP_TIME = 1;
		var EASING = "linear";
		var REPLAY = true;
		
		if (typeof id == "undefined")
		{
			id = cubeId;
			cubeId++
			DROP_TIME = 750;
			EASING = "easeOutBounce";
			REPLAY = false;
			
			order[order.length] = {"id": id, "row": row, "col": col, "colour": selectedColour};
		}

		var cube = $('<div id="cube' + id + '" class="cube cube' + selectedColour + '"></div>');
		
		cube[0].row = row;
		cube[0].col = col;

		if (typeof cubes[row] == "undefined")
		{
			cubes[row] = [];
		}
		
		if (typeof cubes[row][col] == "undefined")
		{
			cubes[row][col] = [];
		}

		var targetX = row * GRID_SPACING + col * GRID_SPACING - SELECTION_OFFSET_X;
		var targetY = (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - SELECTION_OFFSET_Y;

		var stackHeight = cubes[row][col].length * GRID_SPACING;

		cubes[row][col][cubes[row][col].length] = {id: "cube" + id, colour: selectedColour};
		
		var canvasRows = Math.ceil($("#canvas").height() / GRID_SPACING);

				
		if (selectedColour != "coloursTransparent")
		{
			var shadow = $('<div id="shadow' + id + '" class="shadow"></div>');
			shadow
				.appendTo("#shadows")
				.css("left", targetX + canvasRows * GRID_SPACING + stackHeight)
				.css("top", targetY - (canvasRows * (GRID_SPACING / 2))  - stackHeight / 2 + GRID_SPACING)
				.css("opacity", 0)
				.animate(
					{
						"left": targetX + stackHeight + GRID_SPACING,
						"top": parseInt(targetY + 6 - stackHeight / 2),
						"opacity": 0.99
					},
					DROP_TIME, EASING
				)
		}
		
		cube
			.css("zIndex", row * $("#canvas").width() - col)
			.appendTo("#canvas")
			.css("left", targetX)
			.css("top", targetY - canvasRows * GRID_SPACING)
			.animate(
				{
					"top": targetY - stackHeight
				},
				DROP_TIME, EASING, function(col, height)
					{
						showTopIndicator = true;
						
						checkShadows(row, REPLAY);
					}
			)
	};
	
	function checkShadows(row, replay)
	{
		var DURATION = 1000;
		
		if (replay)
		{
			DURATION = 1;
		}
		
		var canvasRows = Math.ceil($("#canvas").height() / GRID_SPACING);

		for (var col in cubes[row])
		{
			for (var height = 0; height < cubes[row][col].length; height++)
			{
				var unshadowed = true;
				
				/* Items that shadow it */
				for (var i = col - 2, j = height + 2; i > -canvasRows; j++, i--)
				{
					if (typeof cubes[row][i] != "undefined" && cubes[row][i].length >= j && !$("#" + cubes[row][i][j - 1].id).hasClass("cubecoloursTransparent"))
					{
						unshadowed = false;
						
						if (document.getElementById("row" + row + "col" + col) == null)
						{
							var rowElement = $('<div id="row' + row + 'col' + col + '" class="row"></div>');
							rowElement.prependTo($("#canvas")).css("zIndex", row * $("#canvas").width() - col + 1)
						}
						
						if (document.getElementById("vShadow" + cubes[row][col][height].id.replace(/cube/, "")) == null)
						{
							var verticalShadow = $('<div id="vShadow' + cubes[row][col][height].id.replace(/cube/, "") + '" class="shadow vShadow"></div>');
		
							verticalShadow
								.appendTo($("#row" + row + "col" + col))
								.css("left", row * GRID_SPACING + col * GRID_SPACING - SELECTION_OFFSET_X)
								.css("top", (row * (GRID_SPACING / 2)) - (col * (GRID_SPACING / 2)) - 6 - ((height) * GRID_SPACING))
								.css("opacity", 0)
								.animate(
									{
										"opacity": 0.99
									},
									DURATION
								)
						}
								
						break;
					}
				}
				
				if (unshadowed)
				{
					$("#vShadow" + cubes[row][col][height].id.replace(/cube/, "")).remove();
				}
			}
		}
	}
	
	$("#save").click(function()
		{
			alert("Unfortunately we've had to permanently disable the ability to save");
			
			return false;
/*
			var $this = $(this);
			
			var mask = $('<div id="mask"></div>');
			mask.appendTo("body");
			mask.animate(
				{
					"height": $("body").height() - parseInt(mask.css("top"))
				},
				1000,
				"easeOutBounce",
				function()
				{
					$(document).unbind("mousemove")
					$(document).unbind("click");
					$("#replay").unbind("click");
					
					var saveForm = $("#saveForm");
					saveForm
						.addClass("visible")
						.submit(function()
							{
								if ($("#name").get(0).value == "")
								{
									alert("You have to enter your name");

									$("#name").focus();

									return false;
								}
								if ($("#title").get(0).value == "")
								{
									alert("You have to enter a title for your 'scape");

									$("#title").focus();

									return false;
								}
								if (cubes.length < 1)
								{
									alert("You have to drop at least one cube");

									$("#title").focus();

									return false;
								}
							}
						)
						.animate(
							{
								opacity: 1
							},
							1000,
							function()
							{
								var serialisedOrder = "[";
								
								for (var i = 0; i < order.length; i++)
								{
									if (i > 0)
									{
										serialisedOrder += ",";
									}
									
									serialisedOrder += "{";
									serialisedOrder += "id:" + order[i].id;
									serialisedOrder += ",row:" + order[i].row;
									serialisedOrder += ",col:" + order[i].col;
									serialisedOrder += ',colour:"' + order[i].colour + '"';
									serialisedOrder += "}"
								}
								
								serialisedOrder += "]";
								
								$("#order").get(0).value = serialisedOrder;
								
								var serialisedCubes = "[";
								
								for (var row = 0; row < cubes.length; row++)
								{
									if (row > 0)
									{
										serialisedCubes += ", ";
									}
									
									if (typeof cubes[row] != "undefined")
									{
										serialisedCubes += "{";
										
										var first = true;
										
										for (var col in cubes[row])
										{
											if (!first)
											{
												serialisedCubes += ", ";
											}
											
											first = false;
											
											serialisedCubes += '"' + col +'":[';
	
											for (var stack = 0; stack < cubes[row][col].length; stack++)
											{
												if (stack > 0)
												{
													serialisedCubes += ", "
												}
												
												serialisedCubes += '{id:"' + cubes[row][col][stack].id + '"';
												serialisedCubes += ', colour:"' + cubes[row][col][stack].colour + '"';
												serialisedCubes += "}";
											}
											
											serialisedCubes += "]";
										}
										
										serialisedCubes += "}";
									}
								}
								
								serialisedCubes += "]";
								
								$("#cubes").get(0).value = serialisedCubes;
								
								$("#name").focus();
								
								$("#saveForm a").click(function()
									{
										$("#saveForm")
											.css("opacity", 0)
											.removeClass("visible")
											
										mask.animate(
											{
												"height": 0
											},
											500,
											"linear",
											function()
											{
												mask.remove();

												$(document).mousemove(showSelection)
												$(document).click(clickCanvas);
												
												$("#replay").click(clickReplay);
											}
										);
										
										return false;
									}
								);
							}
						);
				}
			);
			
			return false;
*/
		}
	);
}

$(init);
