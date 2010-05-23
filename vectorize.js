var Vectorize = function () {

  var DIRECTIONS = ["1,0", "0,-1", "-1,0", "0,1"];

  function getEdges(blocks) {
    var edgeSet = {};
    for (var i in blocks) {
      var b = blocks[i];
      addBlock(edgeSet, b[0], b[1]);
    }
    return edgeSet;
  }

  function addBlock(edgeSet, x, y) {
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

  function fromEdges(edges) {
    var boundaries = [];

    while(true) {
      var start = "";
      for (start in edges) {break;}
      if (start == "") break;
      delete edges[start];

      var boundary = [];
      //    boundary.orientation = 0;
      boundaries[boundaries.length] = boundary;

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

	boundary[boundary.length] = ends[1];

	o = splitToInt(turnLeft(os));
	adjacentEdge = ends[1] + " " + add(v, o).join(",");
	if (edges[adjacentEdge] != undefined) {
	  //      boundary.orientation += 1;
          edge = adjacentEdge;
          delete edges[edge];
          continue;
	}

	o = splitToInt(turnRight(os));
	adjacentEdge = ends[1] + " " + add(v, o).join(",");
	if(edges[adjacentEdge] != undefined) {
	  //      boundary.orientation -= 1;
          edge = adjacentEdge;
          delete edges[edge];
          continue;
	}
	break;
      }
    }
    return boundaries;
  }
} ();