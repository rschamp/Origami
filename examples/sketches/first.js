
var cp = new CreasePattern();

var j = 0;
var xstart = -0.1;
var ystart = -0.1;
do{
	var x = xstart + j*0.04;
	var y = ystart;
	var yoff = 0.05*Math.sin(j*0.4);
	var one;
	var mod = 1;
	var i = 0
	do{
		one = new XY(x + mod*.1, y + yoff);
		y += 0.1;
		mod = (i%2);
		var two = new XY(x + mod*.1, y + yoff);
		var crease = cp.crease(one, two);
		if(crease != undefined) {
			if(j%2 == 0) crease.mountain();
			else crease.valley();
		}
		one = two;
		i++;
	} while(y < 1);
	j++;
} while(x < 1);

new OrigamiPaper("canvas", cp);
