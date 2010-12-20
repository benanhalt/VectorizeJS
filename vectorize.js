// The Vectorize module provides the ability to turn a 2D raster
// into a set of vector paths.
//
// Provided functions:
// - processRaster(data, r, c, ignore, createBuilder)
// - addBlock (edgeSet, x, y)
// - findVertices (edges, vertexFound, pathComplete)
// - PathBuilder(x, y, sx, sy, swapXY)
//
// See below for detailed descriptions of each.
//
// Example: (generated using Firebug)
//
// >>> var result = Vectorize.processRaster("111122122", 3, 3)
// undefined
//
// >>> result
// Object { 1={...}, 2={...}}
//
// >>> result["1"]
// Object { path=}
//
// >>> result["1"].path
// [["M", 0, 3], ["L", 1, 3], ["L", 1, 1], ["L", 3, 1], ["L", 3, 0], ["L", 0, 0], ["Z"]]
//
// >>> result["2"].path
// [["M", 1, 3], ["L", 3, 3], ["L", 3, 1], ["L", 1, 1], ["Z"]]
//

var Vectorize = function () {

  /**************** Private functions and constants *************************/

  // Strings representing unit vectors in each direction:
  // [right, up, left, down]
  // in order such that each represents a left turn of pi/2
  // from the previous.
  var DIRECTIONS = ["1,0", "0,-1", "-1,0", "0,1"];

  // Subtract vector a from vector b.
  function sub(a, b) {
    return [b[0] - a[0], b[1] - a[1]];
  }

  // Add vectors a and b.
  function add(a, b) {
    return [b[0] + a[0], b[1] + a[1]];
  }

  // Given a unit vector, os, return the unit vector
  // obtained by turning pi/2 to the left.
  function turnLeft(os) {
    var i = DIRECTIONS.indexOf(os);
    return DIRECTIONS[(i+1) % 4];
  }

  // Given a unit vector, os, return the unit vector
  // obtained by turning pi/2 to the right.
  function turnRight(os) {
    var i = DIRECTIONS.indexOf(os);
    return DIRECTIONS[(i+3) % 4];
  }

  // Utility function to convert string repr of a vector into
  // a pair of ints.
  function splitToInt(str) {
    return str.split(",").map(function(s){return parseInt(s, 10);});
  }

  /************************** Public Interface ****************************/

  // Add the edges of the block located at (x, y) to edgeSet,
  // removing duplicate edges.
  function addBlock (edgeSet, x, y) {
    // Determine the edges of (x, y).
    var edges = [
      [[x, y], [x, y+1]],
      [[x, y+1], [x+1, y+1]],
      [[x+1, y+1], [x+1, y]],
      [[x+1, y], [x, y]]
    ];

    for (var j in edges) {
      var edge = edges[j];

      // If this edge is shared with an already added block,
      // edgeSet will contain the reversed version.
      var reversed = edge[1].join(",") + " " + edge[0].join(",");

      if (edgeSet[reversed] == undefined)
	// Add edge to edgeSet.
	edgeSet[edge[0].join(",") + " " + edge[1].join(",")] = 1;
      else
	// Edge borders previously added block. Remove the
	// existing edge from edgeSet.
	delete edgeSet[reversed];
    }
  }

  // Given a set of edges (adjacent unit vectors) representing a shape,
  // find all the vertices making up each path that defines the shape.
  // As each vertex is found, vertexFound will be called with the location
  // and change in direction. When the path returns to it's start, pathComplete
  // will be called and begin finding vertices for the next path, if any.
  function findVertices (edges, vertexFound, pathComplete) {
    // Outer loop is over paths which make up the shape.
    while(true) {
      // Pick one edge from edges to begin.
      var start = "";
      for (start in edges) {break;}
      if (start == "") break;  // If there are no more edges, we are done.
      delete edges[start];

      // Inner loop is over edges making up the path that
      // contains the starting edge.
      var edge = start;
      while(true) {
	var ends = edge.split(" ");  // The endpoints of edge.
	var h = splitToInt(ends[1]); // The head edge vect. as pair of ints.
	var t = splitToInt(ends[0]); // The tail.
	var o = sub(t, h); // Unit vector in direction of edge.
	var os = o.join(","); // Direction of the edge as a string.

	// The adjacent edge will either be straight ahead,
	// to the left or to the right.
	var adjacentEdge;

	// Try straight ahead.
	adjacentEdge = ends[1] + " " + add(h, o).join(",");
	if (adjacentEdge == start) break;  // Got back to the beginning.

	if (edges[adjacentEdge] != undefined) {
	  // The potential adjacent edge is in part of the path.
	  // Make it the current edge and remove from the set of edges.
          edge = adjacentEdge;
          delete edges[edge];
          continue; // Done with this edge.
	}

	// Try a turn to the left.
	o = splitToInt(turnLeft(os));
	adjacentEdge = ends[1] + " " + add(h, o).join(",");

	if (adjacentEdge == start) {
	  // Got back to the beginning and found a vertex to boot.
	  vertexFound(h, "left");
	  break;
	}
	if (edges[adjacentEdge] != undefined) {
	  // The potential adjacent edge is part of the path.
	  // Since there was a turn from the previous edge,
	  // a vertex is located here.
	  vertexFound(h, "left");
          edge = adjacentEdge;
          delete edges[edge];
          continue; // Done with this edge.
	}

	// Try a turn to the right.
	o = splitToInt(turnRight(os));
	adjacentEdge = ends[1] + " " + add(h, o).join(",");

	if (adjacentEdge == start) {
	  // Got back to the beginning and found a vertex to boot.
	  vertexFound(h, "right");
	  break;
	}
	if(edges[adjacentEdge] != undefined) {
	  // The potential adjacent edge is part of the path.
	  // Since there was a turn from the previous edge,
	  // a vertex is located here.
	  vertexFound(h, "right");
          edge = adjacentEdge;
          delete edges[edge];
          continue; // Done with this edge.
	}
	// This point should never be encountered.
	// For now, the behaviour is left undefined.
	break;
      }
      // When the inner loop completes, one of the paths representing
      // the shape has been completed.
      pathComplete();
    }
    // When the outer loop completes, we are done.
  }

  // The PathBuilder class provides vertexFound and pathComplete
  // methods suitable for passing to the findVertices function.  As
  // vertices and paths are found it will accumulate the results.
  // After the findVertices function completes, a PathBuilder instance
  // provides the accumulated results as an SVG style path.
  // The arguments (x, y) allow the locations of the vertices to be
  // translated.  The args (sx, sy) provide for scaling, and setting
  // swapXY will reflect the coordinates across the line x=y.
  function PathBuilder(x, y, sx, sy, swapXY) {
    // Set reasonable defaults.
    x = x || 0;
    y = y || 0;
    sx = sx || 1;
    sy = sy || 1;
    swapXY = swapXY || false;

    var path = [];  // Accumulates the path data.
    var start = true;

    // This method is intended to be called by findVertices. It
    // ignores the direction of the turn.
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

    // This method is intended to be called by findvertices when
    // a closed portion of a path is completed.
    this.closePath = function () {
      path.push(["Z"]);
      start = true;
    };

    // Make the local var path visible as an object property.
    this.path = path;
  }

  // Returns the accumulated path data as a string.
  PathBuilder.prototype.pathToString = function() {
    return this.path.map(function (a) {return a.join(" ");}).join(" ");
  };

  // This function provides a top level interface for converting raster data
  // to a set of paths.  Given the 2D raster, data, with rows, r, and columns, c,
  // it returns a dictionary of PathBuilder objects keyed by the value each
  // represents.  If the argument ignore is provided, the path for that value will
  // not be computed. If provided, the createBuilder argument should be a function
  // which returns a PathBuilder-like object providing vertexFound and closePath
  // methods.  If createBuilder is not provided, PathBuilder with default arguments
  // is used.
  function processRaster(data, r, c, ignore, createBuilder) {
    // Defualt path builder.
    createBuilder = createBuilder || function () {return new PathBuilder();};

    var edgeSets = {};  // Need to store separate edge sets for each value in the raster.

    // Loop over each cell in the raster.
    var i = 0;
    for (var y = 0; y < r; y++) {
      for (var x = 0; x < c; x++) {
	var v = data[i++];
	if (v == ignore) continue;
	if (edgeSets[v] == undefined) edgeSets[v] = {};
	addBlock(edgeSets[v], x, y);  // Add a block to the appropriate edge set.
      }
    }

    var paths = {}; // Maps each value to the corresponding path.
    for (v in edgeSets) {
      // Create a path builder object for the value.
      var gen = paths[v] = createBuilder();

      // Analyze the edges for that value to produce the paths.
      findVertices(edgeSets[v], gen.vertexFound, gen.closePath);
    }

    // Return the dict of path builder instances.
    return paths;
  };

  // Expose the public interface of the Vectorize module.
  return {
    addBlock: addBlock,
    findVertices: findVertices,
    PathBuilder: PathBuilder,
    processRaster: processRaster
  };
} ();
