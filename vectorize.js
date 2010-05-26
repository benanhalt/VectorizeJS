var Vectorize = function () {

  var DIRECTIONS = ["1,0", "0,-1", "-1,0", "0,1"];

  function sub(a, b) {
    return [b[0] - a[0], b[1] - a[1]];
  }

  function add(a, b) {
    return [b[0] + a[0], b[1] + a[1]];
  }

  function turnLeft(os) {
    var i = DIRECTIONS.indexOf(os);
    return DIRECTIONS[(i+1) % 4];
  }

  function turnRight(os) {
    var i = DIRECTIONS.indexOf(os);
    return DIRECTIONS[(i+3) % 4];
  }

  function splitToInt(str) {
    return str.split(",").map(function(s){return parseInt(s, 10);});
  }

  function addBlock (edgeSet, x, y) {
    var edges = [
      [[x, y], [x, y+1]],
      [[x, y+1], [x+1, y+1]],
      [[x+1, y+1], [x+1, y]],
      [[x+1, y], [x, y]]
    ];

    for (var j in edges) {
      var edge = edges[j];
      var reversed = edge[1].join(",") + " " + edge[0].join(",");
      if (edgeSet[reversed] == undefined)
	edgeSet[edge[0].join(",") + " " + edge[1].join(",")] = 1;
      else
	delete edgeSet[reversed];
    }
  }

  function findVertices (edges, vertexFound, pathComplete) {
    while(true) {
      var start = "";
      for (start in edges) {break;}
      if (start == "") break;
      delete edges[start];

      var edge = start;
      while(true) {
	var ends = edge.split(" ");
	var v = splitToInt(ends[1]);
	var o = sub(splitToInt(ends[0]), v);
	var os = o.join(",");

	var adjacentEdge;

	adjacentEdge = ends[1] + " " + add(v, o).join(",");
	if (adjacentEdge == start) break;

	if (edges[adjacentEdge] != undefined) {
          edge = adjacentEdge;
          delete edges[edge];
          continue;
	}

	o = splitToInt(turnLeft(os));
	adjacentEdge = ends[1] + " " + add(v, o).join(",");

	if (adjacentEdge == start) {
	  vertexFound(v, "left");
	  break;
	}
	if (edges[adjacentEdge] != undefined) {
	  vertexFound(v, "left");
          edge = adjacentEdge;
          delete edges[edge];
          continue;
	}

	o = splitToInt(turnRight(os));
	adjacentEdge = ends[1] + " " + add(v, o).join(",");

	if (adjacentEdge == start) {
	  vertexFound(v, "right");
	  break;
	}
	if(edges[adjacentEdge] != undefined) {
	  vertexFound(v, "right");
          edge = adjacentEdge;
          delete edges[edge];
          continue;
	}
	break;
      }
      pathComplete();
    }
  }

  function PathBuilder(x, y, sx, sy, swapXY) {
    x = x || 0;
    y = y || 0;
    sx = sx || 1;
    sy = sy || 1;
    swapXY = swapXY || false;

    var path = [];
    var start = true;

    this.vertexFound = function(v) {
      if (swapXY) {
	var t = v[0];
	v[0] = v[1];
	v[1] = t;
      }
      if (start) {
	path.push(["M", x + sx*v[0], y + sy*v[1]]);
	start = false;
      }
      else
	path.push(["L", x + sx*v[0], y + sy*v[1]]);
    };

    this.closePath = function () {
      path.push(["Z"]);
      start = true;
    };

    this.path = path;
  }

  PathBuilder.prototype.pathToString = function() {
    return this.path.map(function (a) {return a.join(" ");}).join(" ");
  };

  function processRaster(data, r, c, createBuilder) {
    createBuilder = createBuilder || function () {return new PathBuilder();};

    var edgeSets = {};
    var i = 0;
    for (var y = 0; y < r; y++) {
      for (var x = 0; x < c; x++) {
	var v = data[i++];
	if (edgeSets[v] == undefined) edgeSets[v] = {};
	addBlock(edgeSets[v], x, y);
      }
    }

    var paths = {};
    for (v in edgeSets) {
      var gen = paths[v] = createBuilder();
      findVertices(edgeSets[v], gen.vertexFound, gen.closePath);
    }
    return paths;
  };

  return {
    addBlock: addBlock,
    findVertices: findVertices,
    PathBuilder: PathBuilder,
    processRaster: processRaster
  };
} ();
