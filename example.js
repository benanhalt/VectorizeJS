$(function(){
    // Raster dimensions.
    var rows = 5;
    var cols = 5;

    // Build the input table.
    function setupTable() {
      var table = $('table');

      for (var r = 0; r < rows; r++) {
	var row = $('<tr>');
	table.append(row);

	for (var c = 0; c < cols; c++) {
	  var cell = $('<td>');
	  var input = $('<input type="text" size="2">');
	  input.attr('value', '1');
	  input.attr('id', 'cell-' + r + '-' + c);
	  row.append(cell);
	  cell.append(input);
	}
      }
    }

    // Gets all the values from the input table.
    function getData() {
      var data = [];

      for (var r = 0; r < rows; r++) {
	for (var c = 0; c < cols; c++) {
	  var v = $('#cell-' + r + '-' + c).attr('value');
	  data.push(v);
	}
      }
      return data;
    }

    // Setup the Rafael canvas.
    var mapContainer = $('#map-container');
    var width = parseInt(mapContainer.css('width'), 10);
    var height = parseInt(mapContainer.css('height'), 10);
    var paper = Raphael("map-container", width, height);

    // Store all the paths added to the canvas so they can be easily deleted.
    var rPaths = paper.set();

    // The main function that does the vectorization.
    function vectorize() {
      // Clear the canvas.
      rPaths.remove();

      var data = getData();

      // Want to build paths that are scaled to the canvas using
      // a custom PathBuilder with the scaling values set appropriately.
      function newPathBuilder() {
	return new Vectorize.PathBuilder(0, 0, width/rows, height/cols);
      }

      // Call vectorize.
      var paths = Vectorize.processRaster(data, rows, cols, "", newPathBuilder);

      // Draw the paths.
      for (var v in paths) {
	var color = Raphael.getColor();  // Ask Raphael for a new color.

	var rPath = paper.path(paths[v].path); // Add the path to the canvas.

	// Set the color, etc.
	rPath.attr({'stroke': color, 'stroke-opacity': 1.0, 'fill': color, 'fill-opacity': 0.5});

	// Save a ref to the drawn path, so we can clear them later.
	rPaths.push(rPath);
      }
    }

    // Setup the table and attach the vectorize function to the
    // form submit button.
    setupTable();
    $('form').submit(function() {vectorize(); return false;});
});
