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
	   var orientation = 0;
	   var paths = 0;
	   function foundVertex(v, direction) {
	     vertices.push(v);
	     direction == "left" ? orientation++ : orientation--;
	   }
	   function pathComplete() {
	     paths++;
	   }

	   Vectorize.findVertices(edgeSet, foundVertex, pathComplete);
	   equal(paths, 1);
	   ok(orientation > 0, "Orientation is positive for the outside boundary.");
	   equal(vertices.length, 6, "Should be six vertices.");

	   function join(v) {return v.join(",");}
	   vertices = vertices.map(join);

	   var i = vertices.indexOf("0,0");
	   ok(i != -1, "0,0 is a vertex. Index: " + i);
	   var expected = ["0,0", "0,1", "1,1", "1,2", "2,2", "2,0"];
	   for (var j = 0; j < 6; j++) {
	     equal(expected[j], vertices[(i+j)%6]);
	   }
	 });
});