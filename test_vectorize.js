$(function(){
    var edgeSet = {};

    module("addBlock");

    test("add one block", function() {
	   Vectorize.addBlock(edgeSet, 0,0);
	   equal(edgeSet["0,0 0,1"], 1);
	   equal(edgeSet["0,1 1,1"], 1);
	   equal(edgeSet["1,1 1,0"], 1);
	   equal(edgeSet["1,0 0,0"], 1);
	   var count = 0;
	   for (var edge in edgeSet) count++;
	   equal(count, 4);
	 });

    test("three blocks", function () {
	   Vectorize.addBlock(edgeSet, 1,0);
	   Vectorize.addBlock(edgeSet, 1,1);
	   equal(edgeSet["0,0 0,1"], 1);
	   equal(edgeSet["0,1 1,1"], 1);
	   equal(edgeSet["1,1 1,2"], 1);
	   equal(edgeSet["2,2 2,1"], 1);
	   equal(edgeSet["2,1 2,0"], 1);
	   equal(edgeSet["2,0 1,0"], 1);
	   equal(edgeSet["1,0 0,0"], 1);
	   var count = 0;
	   for (var edge in edgeSet) count++;
	   equal(count, 8);
	 });

    module("findVertices");

    test("six vertices", function () {
	   var vertices = [];
	   var windingN = 0;
	   var paths = 0;
	   function foundVertex(v, direction) {
	     vertices.push(v);
	     direction == "left" ? windingN++ : windingN--;
	   }
	   function pathComplete() {
	     paths++;
	   }

	   Vectorize.findVertices(edgeSet, foundVertex, pathComplete);
	   equal(paths, 1);
	   ok(windingN > 0, "Winding number is positive for the outside boundary.");
	   equal(vertices.length, 6, "Should be six vertices.");

	   function join(v) {return v.join(",");}
	   vertices = vertices.map(join);

	   var i = vertices.indexOf("0,0");
	   ok(i != -1, "0,0 is a vertex. Index: " + i);
	   var expected = ["0,0", "0,1", "1,1", "1,2", "2,2", "2,0"];
	   for (var j = 0; j < 6; j++) {
	     equal(vertices[(i+j)%6], expected[j]);
	   }
	 });

    test("non adjacent", function() {
	   var paths = [];
	   var path = [];
	   function vertexFound(v) {path.push(v.join(","));}
	   function pathComplete() {
	     paths.push(path);
	     path = [];
	   }

	   var edgeSet = {};
	   Vectorize.addBlock(edgeSet, 0,0);
	   Vectorize.addBlock(edgeSet, 3,3);
	   Vectorize.findVertices(edgeSet, vertexFound, pathComplete);

	   equal(paths.length, 2, "There are two paths.");
	   ok(paths[0].indexOf("0,0") != -1 || paths[1].indexOf("0,0") != -1,
	      "0, 0 is contained in one of the paths");

	   if (paths[0].indexOf("0,0") == -1) {
	     path = paths[0];
	     paths[0] = paths[1];
	     paths[1] = path;
	   }

	   ok(paths[1].indexOf("3,3") != -1, "the other path contains 3, 3");

	   path = paths[0];
	   equal(path.length, 4);
	   var i = path.indexOf("0,0");
	   var expected = ["0,0", "0,1", "1,1", "1,0"];
	   for (var j = 0; j < 4; j++)
	     equal(path[(i+j)%4], expected[j]);

	   path = paths[1];
	   equal(path.length, 4);
	   i = path.indexOf("3,3");
	   expected = ["3,3", "3,4", "4,4", "4,3"];
	   for (var j = 0; j < 4; j++)
	     equal(path[(i+j)%4], expected[j]);
	 });

    test("touching corners", function () {
	   var edgeSet = {};
	   Vectorize.addBlock(edgeSet, 0,0);
	   Vectorize.addBlock(edgeSet, 1,1);

	   var paths = [];
	   var path = [];
	   Vectorize.findVertices(edgeSet,
				  function (v) {path.push(v.join(","));},
				  function () {
				    paths.push(path);
				    path = [];
				  });

	   equal(paths.length, 2);
	   equal(paths[0].length, 4);
	   equal(paths[1].length, 4);

	   ok(paths[0].indexOf("0,0") != -1 || paths[1].indexOf("0,0") != -1, "0,0 is in one path");
	   ok(paths[0].indexOf("2,2") != -1 || paths[1].indexOf("2,2") != -1, "2,2 is in one path");

	   for (var i = 0; i < 4; i++) {
	     var v = paths[0][i];
	     if (v != "1,1") ok(paths[1].indexOf(v) == -1, v + " not in other path");
	     else ok(paths[1].indexOf(v) != -1, v + " in both paths");

	     v = paths[1][i];
	     if (v != "1,1") ok(paths[0].indexOf(v) == -1, v + " not in other path");
	     else ok(paths[0].indexOf(v) != -1, v + " in both paths");
	   }
	 });

    test("with hole", function () {
	   var edgeSet = {};
	   Vectorize.addBlock(edgeSet, 0,0);
	   Vectorize.addBlock(edgeSet, 1,0);
	   Vectorize.addBlock(edgeSet, 2,0);
	   Vectorize.addBlock(edgeSet, 0,1);
	   Vectorize.addBlock(edgeSet, 2,1);
	   Vectorize.addBlock(edgeSet, 0,2);
	   Vectorize.addBlock(edgeSet, 1,2);
	   Vectorize.addBlock(edgeSet, 2,2);

	   var paths = [];
	   var path = [];
	   Vectorize.findVertices(edgeSet,
				  function (v) {path.push(v.join(","));},
				  function () {
				    paths.push(path);
				    path = [];
				  });

	   equal(paths.length, 2);
	   equal(paths[0].length, 4);
	   equal(paths[1].length, 4);

	   if (paths[0].indexOf("0,0") == -1) {
	     path = paths[0];
	     paths[0] = paths[1];
	     paths[1] = path;
	   }

	   var j = paths[0].indexOf("0,0");
	   var k = paths[1].indexOf("1,1");
	   var expected0 = ["0,0", "0,3", "3,3", "3,0"];
	   var expected1 = ["1,1", "2,1", "2,2", "1,2"];
	   for (var i = 0; i < 4; i++) {
	     equal(paths[0][(j+i)%4], expected0[i]);
	     equal(paths[1][(j+i)%4], expected1[i]);
	     }
	 });

    test("longer path", function () {
	   var edgeSet = {};
	   Vectorize.addBlock(edgeSet, 0,0);
	   Vectorize.addBlock(edgeSet, 1,0);
	   Vectorize.addBlock(edgeSet, 1,1);
	   Vectorize.addBlock(edgeSet, 0,1);

	   var paths = [];
	   var path = [];
	   Vectorize.findVertices(edgeSet,
				  function (v) {path.push(v.join(","));},
				  function () {
				    paths.push(path);
				    path = [];
				  });

	   equal(paths.length, 1);
	   equal(paths[0].length, 4);

	   var j = paths[0].indexOf("0,0");
	   var expected0 = ["0,0", "0,2", "2,2", "2,0"];
	   for (var i = 0; i < 4; i++) {
	     equal(paths[0][(j+i)%4], expected0[i]);
	     }
	 });

    module("PathGenerator");

    test("basic path", function () {
	   var gen = new Vectorize.PathGenerator();
	   var expected = [];
	   same(gen.path, expected);

	   gen.vertexFound([10, 10]);
	   expected.push(["M", 10, 10]);
	   same(gen.path, expected);

	   gen.vertexFound([10, 50]);
	   expected.push(["L", 10, 50]);
	   same(gen.path, expected);

	   gen.vertexFound([50, 50]);
	   expected.push(["L", 50, 50]);
	   same(gen.path, expected);

	   gen.vertexFound([50, 10]);
	   expected.push(["L", 50, 10]);
	   same(gen.path, expected);

	   gen.closePath();
	   expected.push(["Z"]);
	   same(gen.path, expected);

	   gen.vertexFound([20, 20]);
	   expected.push(["M", 20, 20]);
	   same(gen.path, expected);

	   gen.vertexFound([40, 20]);
	   expected.push(["L", 40, 20]);
	   same(gen.path, expected);

	   gen.vertexFound([40, 40]);
	   expected.push(["L", 40, 40]);
	   same(gen.path, expected);

	   gen.vertexFound([20, 40]);
	   expected.push(["L", 20, 40]);
	   same(gen.path, expected);

	   gen.closePath();
	   expected.push(["Z"]);
	   same(gen.path, expected);
	 });
});