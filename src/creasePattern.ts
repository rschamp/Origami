// creasePattern.js
// for the purposes of performing origami operations on a planar graph
// MIT open source license, Robby Kraft

// overview
// 1st order operations: crease pattern methods that don't require any arguments, or only 1st order types
// 2nd order operations: crease pattern methods that require knowledge of methods in the geometry module

/// <reference path="planarGraph.ts" />

"use strict";

//////////////////////////// TYPE CHECKING //////////////////////////// 
// function isValidPoint(point:XY):boolean{return(point!==undefined&&!isNaN(point.x)&&!isNaN(point.y));}
// function isValidNumber(n:number):boolean{return(n!==undefined&&!isNaN(n)&&!isNaN(n));}
/////////////////////////////// FUNCTION INPUT INTERFACE /////////////////////////////// 
function gimme1XY(a:any, b?:any):XY{
	// input is 1 XY, or 2 numbers
	// if(a instanceof XY){ return a; }
	if(isValidPoint(a)){ return new XY(a.x, a.y); }
	if(isValidNumber(b)){ return new XY(a, b); }
	if(a.constructor === Array){ return new XY(a[0], a[1]); }
}
function gimme2XY(a:any, b:any, c?:any, d?:any):[XY,XY]{
	// input is 2 XY, or 4 numbers
	if(a instanceof XY && b instanceof XY){ return [a,b]; }
	if(isValidPoint(b)){ return [new XY(a.x,a.y), new XY(b.x,b.y)]; }
	if(isValidNumber(d)){ return [new XY(a, b), new XY(c, d)]; }
}
function gimme1Edge(a:any, b?:any, c?:any, d?:any):Edge{
	// input is 1 edge, 2 XY, or 4 numbers
	if(a instanceof Edge){ return a; }
	if(a.nodes !== undefined){ return new Edge(a.nodes[0], a.nodes[1]); }
	if(isValidPoint(b) ){ return new Edge(a,b); }
	if(isValidNumber(d)){ return new Edge(a,b,c,d); }
}
function gimme1Ray(a:any, b?:any, c?:any, d?:any):Ray{
	// input is 1 ray, 2 XY, or 4 numbers
	if(a instanceof Ray){ return a; }
	if(isValidPoint(b) ){ return new Ray(a,b); }
	if(isValidNumber(d)){ return new Ray(new XY(a,b), new XY(c,d)); }
}
function gimme1Line(a:any, b?:any, c?:any, d?:any):Line{
	// input is 1 line
	if(a instanceof Line){ return a; }
	// input is 2 XY
	if(isValidPoint(b) ){ return new Line(a,b); }
	// input is 4 numbers
	if(isValidNumber(d)){ return new Line(a,b,c,d); }
	// input is 1 line-like object with points in a nodes[] array
	if(a.nodes instanceof Array && 
	        a.nodes.length > 0 &&
	        isValidPoint(a.nodes[1])){
		return new Line(a.nodes[0].x,a.nodes[0].y,a.nodes[1].x,a.nodes[1].y);
	}
}

class CPPoint extends XY{
	cp:CreasePattern;
	constructor(cp:CreasePattern, point:XY){
		super(point.x, point.y);
		this.cp = cp;
	}
	nearest(){ return this.cp.nearest(this); }
}
abstract class CreaseLineType{
	cp:CreasePattern;
	crease(){ }
	// creaseAndRepeat(){ }
	// creaseAndStop(){ }
}
class CPLine extends Line implements CreaseLineType{
	cp:CreasePattern;
	constructor(cp:CreasePattern, line:Line){
		super(line.point, line.direction);
		this.cp = cp;
	}
	crease(){ return this.cp.crease(this); }
	// creaseAndRepeat(){ this.cp.creaseRayRepeat(this); }
	// creaseAndStop(){ this.cp.creaseAndStop(this); }
}
class CPRay extends Ray implements CreaseLineType{
	cp:CreasePattern;
	constructor(cp:CreasePattern, ray:Ray){
		super(ray.origin, ray.direction);
		this.cp = cp;
	}
	crease(){ return this.cp.crease(this); }
	creaseAndRepeat(){ return this.cp.creaseRayRepeat(this); }
	creaseAndStop(){ return this.cp.creaseAndStop(this); }
}
class CPEdge extends Edge implements CreaseLineType{
	cp:CreasePattern;
	madeBy:Fold;
	constructor(cp:CreasePattern, edge:Edge){
		super(edge.nodes[0], edge.nodes[1]);
		this.cp = cp;
	}
	crease(){ return this.cp.crease(this); }
	// creaseAndRepeat(){ this.cp.creaseRayRepeat(this); }
	// creaseAndStop(){ this.cp.creaseAndStop(this); }
}
class CPPolyline extends Polyline{
	cp:CreasePattern;
	constructor(cp:CreasePattern, polyline:Polyline){
		super();
		this.cp = cp;
		this.nodes = polyline.nodes.map(function(p){return new XY(p.x,p.y);},this);
	}
	crease(){ return this.cp.creasePolyline(this); }
}
// class RabbitEar{
// 	face:CreaseFace;
// 	edges:Crease[];
// }

//////////////////////////////////////////////////////////////////////////
// CREASE PATTERN
enum CreaseDirection{
	mark,
	border,
	mountain,
	valley
}

class Fold{
	func = undefined;
	args = [];
	constructor(foldFunction, argumentArray){
		this.func = foldFunction;
		this.args = argumentArray;
	}
}

enum MadeByType{
	ray,
	doubleRay,
	endpoints,
	axiom1,
	axiom2,
	axiom3,
	axiom4,
	axiom5,
	axiom6,
	axiom7
}

class MadeBy{
	type:MadeByType;
	rayOrigin:CreaseNode;  // if it's a ray, there will be 1 endPoint
	endPoints:CreaseNode[];  // if it's a point 2 point fold, no rayOrigin and 2 endPoints
	intersections:Crease[];  // 1:1 with endPoints
	constructor(){
		this.endPoints = [];
		this.intersections = [];
	}
}

// crease pattern change callback, hook directly into cp.paperjs.js init()
enum ChangeType{
	position,
	newLine
}

class FoldSequence{
	// uses edge and node indices
	// because the actual objects will go away, or don't yet exist at the beginning
	// nope nopE! that't won't work. if you "implement" the fold sequence on another sized
	// sheet of paper, the fold won't execute the same way, different node indices will get applied.
}

class CreaseSector extends PlanarSector{
	bisect():CPRay{
		var vectors = this.vectors();
		var angles = vectors.map(function(el){ return Math.atan2(el.y, el.x); });
		while(angles[0] < 0){ angles[0] += Math.PI*2; }
		while(angles[1] < 0){ angles[1] += Math.PI*2; }
		var interior = counterClockwiseInteriorAngleRadians(angles[0], angles[1]);
		var bisected = angles[0] + interior*0.5;
		var ray = new Ray(new XY(this.origin.x, this.origin.y), new XY(Math.cos(bisected), Math.sin(bisected)));
		return new CPRay(<CreasePattern>this.origin.graph, ray);
	}
	/** This will search for an angle which if an additional crease is made will satisfy Kawasaki's theorem */
	kawasakiCollapse():CPRay{
		var junction = this.origin.junction();
		if(junction.edges.length % 2 == 0){ return; }
		// find this interior angle among the other interior angles
		var foundIndex = undefined;
		for(var i = 0; i < junction.sectors.length; i++){
			if(this.equivalent(junction.sectors[i])){ foundIndex = i; }
		}
		if(foundIndex == undefined){ return; }
		var sumEven = 0;
		var sumOdd = 0;
		// iterate over sectors not including this one, add them to their sums
		for(var i = 0; i < junction.sectors.length-1; i++){
			var index = (i+foundIndex+1) % junction.sectors.length;
			if(i % 2 == 0){ sumEven += junction.sectors[index].angle(); } 
			else { sumOdd += junction.sectors[index].angle(); }
		}
		var dEven = Math.PI - sumEven;
		// var dOdd = Math.PI - sumOdd;
		var vec0 = this.edges[0].vector(this.origin);
		var angle0 = Math.atan2(vec0.y, vec0.x);
		// var angle1 = this.edges[1].absoluteAngle(this.origin);
		var newA = angle0 + dEven;
		var solution = new Ray(new XY(this.origin.x, this.origin.y), new XY(Math.cos(newA), Math.sin(newA)));
		if( this.contains( solution.origin.add(solution.direction) ) ){
			return new CPRay(<CreasePattern>this.origin.graph, solution);
		}
	}
}
class CreaseJunction extends PlanarJunction{

	origin:CreaseNode;
	// sectors and edges are sorted clockwise
	sectors:CreaseSector[];
	edges:Crease[];

	flatFoldable(epsilon?:number):boolean{ return this.kawasaki(epsilon) && this.maekawa(); }

	alternateAngleSum():[number,number]{
		// only computes if number of interior angles are even
		if(this.sectors.length % 2 != 0){ return undefined; }
		var sums:[number, number] = [0,0];
		this.sectors.forEach(function(el,i){ sums[i%2] += el.angle(); });
		return sums;
	}
	maekawa():boolean{
		if(this.origin.isBoundary()){ return true; }
		var m = this.edges.filter(function(edge){return edge.orientation===CreaseDirection.mountain;},this).length;
		var v = this.edges.filter(function(edge){return edge.orientation===CreaseDirection.valley;},this).length;
		return Math.abs(m-v)==2;
	}
	kawasaki(epsilon?:number):boolean{
		// todo: adjust this epsilon
		if(epsilon === undefined){ epsilon = 0.0001; }
		if(this.origin.isBoundary()){ return true; }
		var alternating = this.alternateAngleSum();
		if(alternating == undefined){ return false; }
		return Math.abs(alternating[0] - alternating[1]) < epsilon;
	}
	// 0.0 is equivalent to 100% valid
	// pi is equivalent to 100% wrong
	kawasakiRating():number{
		var alternating = this.alternateAngleSum();
		return Math.abs(alternating[0] - alternating[1]);
	}
	kawasakiSolution():[{'difference':number,'sectors':CreaseSector[]},
	                    {'difference':number,'sectors':CreaseSector[]}]{
		var alternating = <[{'difference':number,'sectors':CreaseSector[]},{'difference':number,'sectors':CreaseSector[]}]>
			this.alternateAngleSum().map(function(el){
				return {'difference':(Math.PI - el), 'sectors':[]};
			});
		this.sectors.forEach(function(el,i){ alternating[i%2].sectors.push(el); });
		return alternating;
	}
	kawasakiCollapse(sector:PlanarSector):CPRay{
		// sector must be one of the Joints in this Junction
		if(this.edges.length % 2 == 0){ return; }
		// find this interior angle among the other interior angles
		var foundIndex = undefined;
		for(var i = 0; i < this.sectors.length; i++){
			if(sector.equivalent(this.sectors[i])){ foundIndex = i; }
		}
		if(foundIndex == undefined){ return undefined; }
		var sumEven = 0;
		var sumOdd = 0;
		for(var i = 0; i < this.sectors.length-1; i++){
			var index = (i+foundIndex+1) % this.sectors.length;
			if(i % 2 == 0){ sumEven += this.sectors[index].angle(); } 
			else { sumOdd += this.sectors[index].angle(); }
		}
		var dEven = Math.PI - sumEven;
		// var dOdd = Math.PI - sumOdd;
		var vec0 = sector.edges[0].vector(sector.origin);
		var angle0 = Math.atan2(vec0.y, vec0.x);
		// var angle1 = sector.edges[1].absoluteAngle(sector.origin);
		var newA = angle0 - dEven;
		var solution = new Ray(new XY(this.origin.x, this.origin.y), new XY(Math.cos(newA), Math.sin(newA)));
		if( sector.contains( solution.origin.add(solution.direction) ) ){
			return new CPRay(<CreasePattern>this.origin.graph, solution);
		}
		// return new XY(Math.cos(newA), Math.sin(newA));
	}
}
class CreaseNode extends PlanarNode{
	graph:CreasePattern;

	isBoundary():boolean{
		return this.graph.boundary.liesOnEdge(this);
	}
	alternateAngleSum():[number,number]{
		return (<CreaseJunction>this.junction()).alternateAngleSum();
	}
	kawasakiRating():number{
		return (<CreaseJunction>this.junction()).kawasakiRating();
	}
	flatFoldable(epsilon?:number):boolean{
		if(this.isBoundary()){ return true; }
		return (<CreaseJunction>this.junction()).flatFoldable(epsilon);
	}
	kawasakiCollapse(a:Crease, b:Crease):CPRay{
		var junction = <CreaseJunction>this.junction();
		var sector = <CreaseSector>junction.sectorWithEdges(a,b);
		if(sector !== undefined){
			return junction.kawasakiCollapse(sector);
		}
	}
	// AXIOM 1
	// creaseLineThrough(point:XY):Crease{return this.graph.creaseThroughPoints(this, point);}
	// AXIOM 2
	// creaseToPoint(point:XY):Crease{return this.graph.creasePointToPoint(this, point);}
}
class Crease extends PlanarEdge{

	graph:CreasePattern;
	orientation:CreaseDirection;
	// how it was made
	newMadeBy:MadeBy;
	madeBy:Fold;

	constructor(graph:CreasePattern, node1:CreaseNode, node2:CreaseNode){
		super(graph, node1, node2);
		this.orientation = CreaseDirection.mark;
		this.newMadeBy = new MadeBy();
		this.newMadeBy.endPoints = [node1, node2];
	};
	mark()    { this.orientation = CreaseDirection.mark; return this;}
	mountain(){ this.orientation = CreaseDirection.mountain; return this;}
	valley()  { this.orientation = CreaseDirection.valley; return this;}
	border()  { this.orientation = CreaseDirection.border; return this;}
	// AXIOM 3
	creaseToEdge(edge:Crease):Crease[]{return this.graph.creaseEdgeToEdge(this, edge);}
}
class CreaseFace extends PlanarFace{
	rabbitEar():Crease[]{
		var sectors = this.sectors();
		if(sectors.length !== 3){ return []; }
		var rays:Ray[] = sectors.map(function(el){ return el.bisect(); });
		// calculate intersection of each pairs of rays
		var incenter = rays
			.map(function(el:Ray, i){
				var nextEl:Ray = rays[(i+1)%rays.length];
				return el.intersection(nextEl);
			})
			// average each point (sum, then divide by total)
			.reduce(function(prev, current){ return prev.add(current);})
			.scale(1.0/rays.length);
		var incenterNode = <CreaseNode>(<CreasePattern>this.graph).newPlanarNode(incenter.x, incenter.y);

		return this.nodes.map(function(el){
			return (<CreasePattern>this.graph).newCreaseBetweenNodes(<CreaseNode>el, incenterNode);
		}, this);
	}
}

class CreasePattern extends PlanarGraph{

	nodes:CreaseNode[];
	edges:Crease[];
	// faces:CreaseFace[];
	junctions:CreaseJunction[];
	sectors:CreaseSector[];
	// for now boundaries are limited to convex polygons. an update simply requires switching this out.
	boundary:ConvexPolygon;

	symmetryLine:Line;

	// this will store the global fold sequence
	foldSequence:FoldSequence;

	// when subclassed, base types are overwritten
	nodeType = CreaseNode;
	edgeType = Crease;
	faceType = CreaseFace;
	sectorType = CreaseSector;
	junctionType = CreaseJunction;

	didChange:(event:object)=>void;

	constructor(){
		super();
		this.boundary = new ConvexPolygon();
		this.symmetryLine = undefined;
		this.square();
	}

	///////////////////////////////////////////////////////////////
	// CLEAN  /  REMOVE PARTS

	clear():CreasePattern{
		this.nodes = [];
		this.edges = [];
		this.faces = [];
		this.sectors = [];
		this.junctions = [];
		this.symmetryLine = undefined;
		this.cleanBoundary();
		this.clean();
		return this;
	}

	cleanBoundary(){
		// remove edges marked "border", remove any now-isolated nodes
		this.edges = this.edges.filter(function(el){ return el.orientation !== CreaseDirection.border; });
		this.cleanAllNodes();
		// based on boundary polygon, redraw crease lines to match, mark them as .border()
		var boundaryNodes = this.boundary.nodes().map(function(node){ return this.newPlanarNode(node.x, node.y); },this);
		boundaryNodes.forEach(function(node, i){
			var nextNode = boundaryNodes[ (i+1)%boundaryNodes.length ];
			(<Crease>this.newPlanarEdgeBetweenNodes(node, nextNode)).border();
		},this);
		this.cleanDuplicateNodes();
	}

	//////////////////////////////////////////////
	// BOUNDARY
	contains(a:any, b?:any):boolean{
		var p = gimme1XY(a, b);
		if(p == undefined){ return false; }
		return this.boundary.contains(p);
	}
	square(width?:number):CreasePattern{
		if(width == undefined){ width = 1.0; }
		else if(width < 0){ width = Math.abs(width); }
		return this.setBoundary([[0,0], [width,0], [width,width], [0,width]], true);
	}
	rectangle(width:number, height:number):CreasePattern{
		if(width == undefined || height == undefined){ return this; }
		width = Math.abs(width);
		height = Math.abs(height);
		return this.setBoundary([[0,0], [width,0], [width,height], [0,height]], true);
	}
	polygon(sides:number):CreasePattern{
		if(sides < 3){ return this; }
		return this.setBoundary(new ConvexPolygon().regularPolygon(sides).nodes());
	}
	noBoundary():CreasePattern{
		this.boundary.edges = [];
		this.cleanBoundary();
		this.clean();
		return this;
	}
	setBoundary(pointArray:any[], pointsSorted?:boolean):CreasePattern{
		var points = pointArray.map(function(p){ return gimme1XY(p); },this);
		// check if the first point is duplicated again at the end of the array
		if( points[0].equivalent(points[points.length-1]) ){ points.pop(); }
		if(pointsSorted === true){ this.boundary.setEdgesFromPoints(points); } 
		else{ this.boundary.convexHull(points); }
		this.cleanBoundary();
		this.clean();
		return this;
	}
	setMinimumRectBoundary():CreasePattern{
		var bounds = this.bounds();
		return this.setBoundary( [
			[bounds.origin.x, bounds.origin.y],
			[bounds.origin.x+bounds.size.width, bounds.origin.y],
			[bounds.origin.x+bounds.size.width, bounds.origin.y+bounds.size.height],
			[bounds.origin.x, bounds.origin.y+bounds.size.height]
		]);
	}

	///////////////////////////////////////////////////////////////
	// SYMMETRY
	
	noSymmetry():CreasePattern{
		this.symmetryLine = undefined;
		return this;
	}
	bookSymmetry():CreasePattern{
		var center = this.boundary.center();
		this.symmetryLine = new Line(center, new XY(0, 1));
		return this;
	}
	diagonalSymmetry():CreasePattern{
		var center = this.boundary.center();
		this.symmetryLine = new Line(center, new XY(0.7071, 0.7071));
		return this;
	}
	setSymmetryLine(a:any, b?:any, c?:any, d?:any):CreasePattern{
		var edge = gimme1Edge(a,b,c,d);
		this.symmetryLine = new Line(edge.nodes[0], edge.nodes[1].subtract(edge.nodes[1]));
		return this;
	}

	///////////////////////////////////////////////////////////////
	// ADD PARTS

	// creaseThroughLayers(point:CPPoint, vector:CPVector):Crease[]{
	// 	return this.creaseRayRepeat(new Ray(point.x, point.y, vector.x, vector.y));
	// }

	// foldInHalf():Crease{ return; }

	point(a:any, b?:any):CPPoint{ return new CPPoint(this, gimme1XY(a,b)); }
	line(a:any, b?:any, c?:any, d?:any):CPLine{ return new CPLine(this, gimme1Line(a,b,c,d)); }
	ray(a:any, b?:any, c?:any, d?:any):CPRay{ return new CPRay(this, gimme1Ray(a,b,c,d)); }
	edge(a:any, b?:any, c?:any, d?:any):CPEdge{ return new CPEdge(this, gimme1Edge(a,b,c,d)); }
	
	newCreaseBetweenNodes(a:CreaseNode, b:CreaseNode):Crease{
		this.unclean = true;
		return <Crease>this.newEdge(a, b);
	}

	private newCrease(a_x:number, a_y:number, b_x:number, b_y:number):Crease{
		// this is a private function expecting all boundary conditions satisfied
		// use this.crease() instead
		this.creaseSymmetry(a_x, a_y, b_x, b_y);
		var newCrease = <Crease>this.newPlanarEdge(a_x, a_y, b_x, b_y);
		if(this.didChange !== undefined){ this.didChange(undefined); }
		return newCrease;
	}

	private creaseSymmetry(ax:number, ay:number, bx:number, by:number):Crease{
		if(this.symmetryLine === undefined){ return undefined; }
		// todo, improve this whole situation
		var ra = new XY(ax, ay).reflect(this.symmetryLine);
		var rb = new XY(bx, by).reflect(this.symmetryLine);
		return <Crease>this.newPlanarEdge(ra.x, ra.y, rb.x, rb.y);
	}

	/** Create a crease that is a line segment, and will crop if it extends beyond boundary
	 * @arg 1 Edge, Ray, or Line, or 2 XY points or 4 numbers indicating endpoints of an edge
	 * @returns {Crease} pointer to the Crease
	 */
	crease(a:any, b?:any, c?:any, d?:any):Crease{
		if(a instanceof Line){ return this.creaseLine(a); }
		if(a instanceof Edge){ return this.creaseEdge(a); }
		if(a instanceof Ray){ return this.creaseRay(a); }
		var e = gimme1Edge(a,b,c,d);
		if(e === undefined){ return; }
		var edge = this.boundary.clipEdge(e);
		if(edge === undefined){ return; }
		return this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
	}
	/** Create a crease 
	 * @arg 4 numbers, 2 XY points, or 1 Edge, Ray, or Line
	 * @returns {Crease} pointer to the Crease
	 */
	creaseAndStop(a:any, b?:any, c?:any, d?:any):Crease{
		if(a instanceof Line){
			var endpoints = a.rays().map(function(ray){
				return ray.intersectionsWithEdges(this.edges).shift()
			},this).filter(function(el){return el!=undefined;},this);
			// todo: split this out into length == 0 (below), and length == 1 (redo it with 1 ray)
			if(endpoints.length < 2){ return this.creaseLine(a); }
			return this.creaseEdge(endpoints[0], endpoints[1]);
		}
		if(a instanceof Ray){
			// todo: implicit epsilon
			var intersections = a.intersectionsWithEdges(this.edges).filter(function(point){return !point.equivalent(a.origin);});
			var intersection = intersections.shift();
			if(intersection == undefined){ return this.creaseRay(a); }
			return this.creaseEdge(a.origin, intersection);
		}
		// too much is inferred here, but point 0 of the edge is treated as the ray origin and the entire edge is creased so long as it doesn't cross over other edges, if it does it retains the side with the origin
		var e = gimme1Edge(a,b,c,d);
		var point0Ray = new Ray(e.nodes[0],new XY(e.nodes[1].x-e.nodes[0].x,e.nodes[1].y-e.nodes[0].y));
		var edgeDetail = point0Ray.clipWithEdgesDetails(this.edges).shift();
		if(edgeDetail == undefined){ return; }
		if(edgeDetail['edge'].length() < e.length()){
			return this.creaseEdge(edgeDetail['edge']);
		}
		return this.creaseEdge(e);
	}

	creaseAndReflect(a:any, b?:any, c?:any, d?:any):Crease[]{
		if(a instanceof Line){
			return a.rays().map(function(ray){
				return this.creaseRayRepeat(ray);
			},this).reduce(function(prev,curr){
				return prev.concat(curr);
			},[]);
		}
		if(a instanceof Ray){
			return this.creaseRayRepeat(a);
		}
		return undefined;
	}

	creaseLine(a:any, b?:any, c?:any, d?:any):Crease{
		var line = gimme1Line(a,b,c,d);
		if(line === undefined){ return; }
		var edge = this.boundary.clipLine(line);
		if(edge === undefined){ return; }
		return this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
	}
	creaseRay(a:any, b?:any, c?:any, d?:any):Crease{
		var ray = gimme1Ray(a,b,c,d);
		if(ray === undefined) { return; }
		var edge = this.boundary.clipRay(ray);
		if(edge === undefined) { return; }
		var newCrease = this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
		// if(pointsSimilar(origin, newCrease.nodes[0])){ newCrease.newMadeBy.rayOrigin = <CreaseNode>newCrease.nodes[0]; }
		// if(pointsSimilar(origin, newCrease.nodes[1])){ newCrease.newMadeBy.rayOrigin = <CreaseNode>newCrease.nodes[1]; }
		return newCrease;
	}
	creaseEdge(a:any, b?:any, c?:any, d?:any):Crease{
		var e = gimme1Edge(a,b,c,d);
		if(e === undefined){ return; }
		var edge = this.boundary.clipEdge(e);
		if(edge === undefined){ return; }
		return this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
	}

	// creaseRayUntilMark
	creaseRayUntilIntersection(ray:Ray, target?:XY):Crease{
		var clips = ray.clipWithEdgesDetails(this.edges);
		if(clips.length > 0){
			// if target exists, and target is closer than shortest edge, return crease to target
			if(target !== undefined){
				var targetEdge = new Edge(ray.origin.x, ray.origin.y, target.x, target.y);
				if(clips[0].edge.length() > targetEdge.length()){ return this.crease(targetEdge); }
			}
			// return crease to edge
			return this.crease(clips[0].edge);
		}
		return undefined;
	}

	creaseLineRepeat(a:any, b?:any, c?:any, d?:any):Crease[]{
		var ray = gimme1Ray(a,b,c,d);
		return this.creaseRayRepeat(ray)
		           .concat(this.creaseRayRepeat( ray.flip() ));
	}

	creaseRayRepeat(ray:Ray, target?:XY):Crease[]{
		return new Polyline()
			.rayReflectRepeat(ray, this.edges, target)
			.edges()
			.map(function(edge:Edge){
				return this.crease(edge);
			},this)
			.filter(function(el){ return el != undefined; });
	}

	creasePolyline(polyline:Polyline):Crease[]{
		return polyline.edges()
			.map(function(edge:Edge){
				return this.crease(edge);
			},this)
			.filter(function(el){ return el != undefined; });
	}

	// AXIOM 1
	creaseThroughPoints(a:any, b?:any, c?:any, d?:any):Crease{
		var inputEdge = gimme1Edge(a,b,c,d);
		if(inputEdge === undefined){ return; }
		var edge = this.boundary.clipLine( inputEdge.infiniteLine() );
		if(edge === undefined){ return; }
		var newCrease = this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
		// newCrease.madeBy = new Fold(this.creaseThroughPoints, [new XY(a.x,a.y), new XY(b.x,b.y)]);
		return newCrease;
	}
	// AXIOM 2
	creasePointToPoint(a:any, b:any, c?:any, d?:any):Crease{
		var e = gimme1Edge(a,b,c,d);
		if(e === undefined){ return; }
		var edge = this.boundary.clipLine( e.perpendicularBisector() );
		if(edge === undefined){ return; }
		var newCrease = this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
		// newCrease.madeBy = new Fold(this.creasePointToPoint, [new XY(p[0].x,p[0].y), new XY(p[1].x,p[1].y)]);
		return newCrease
	}
	// AXIOM 3
	creaseEdgeToEdge(one:Crease, two:Crease):Crease[]{
		var a:Line = gimme1Edge(one).infiniteLine();
		var b:Line = gimme1Edge(two).infiniteLine();
		return a.bisect(b)
			.map(function(line:Line){ return this.boundary.clipLine( line ); },this)
			.filter(function(edge:Edge){ return edge !== undefined; },this)
			.map(function(edge:Edge){
				return this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
			},this);
	}
	// AXIOM 4
	creasePerpendicularThroughPoint(line:Crease, point:XY):Crease{
		var edge = this.boundary.clipLine( new Line(point, line.vector().rotate90()) );
		if(edge === undefined){ return; }
		var newCrease = this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
		// crease.madeBy = new Fold(this.creasePerpendicularThroughPoint, [new XY(line.nodes[0].x, line.nodes[0].y), new XY(line.nodes[1].x, line.nodes[1].y), new XY(point.x, point.y)]);
		return newCrease;
	}
	// AXIOM 5
	creasePointToLine(origin:XY, point:XY, line:Crease):Crease[]{
		var radius = Math.sqrt( Math.pow(origin.x-point.x,2) + Math.pow(origin.y-point.y,2) );
		var intersections = new Circle(origin.x, origin.y, radius).intersection(new Edge(line));
		// return (radius*radius) * dr_squared > (D*D)  // check if there are any intersections
		var creases = [];
		for(var i = 0; i < intersections.length; i++){
			creases.push( this.creasePointToPoint(point, intersections[i]) );
		}
		return creases;
	}
	// AXIOM 7
	creasePerpendicularPointOntoLine(point:XY, ontoLine:Crease, perp:Crease):Crease{
		var newLine = new Line(point, new XY(perp.nodes[1].x-perp.nodes[0].x, perp.nodes[1].y-perp.nodes[0].y));
		var intersection = newLine.intersection( ontoLine.infiniteLine() );
		if(intersection === undefined){ return; }
		var edge = this.boundary.clipLine( new Edge(point, intersection).perpendicularBisector() );
		if(edge === undefined){ return; }
		return this.newCrease(edge.nodes[0].x, edge.nodes[0].y, edge.nodes[1].x, edge.nodes[1].y);
	}

	pleat(count:number, one:Crease, two:Crease):Crease[]{
		var a = new Edge(one.nodes[0].x, one.nodes[0].y, one.nodes[1].x, one.nodes[1].y);
		var b = new Edge(two.nodes[0].x, two.nodes[0].y, two.nodes[1].x, two.nodes[1].y);
		return a.infiniteLine()
			.subsect(b.infiniteLine(), count)
			.map(function(line){
					return this.boundary.clipLine( line );
				},this)
			.filter(function(el){ return el != undefined; },this)
			.map(function(el){
				return this.newCrease(el.nodes[0].x, el.nodes[0].y, el.nodes[1].x, el.nodes[1].y);
			},this);
	}

	glitchPleat(one:Crease, two:Crease, count:number):Crease[]{
		var a = new Edge(one.nodes[0].x, one.nodes[0].y, one.nodes[1].x, one.nodes[1].y);
		var b = new Edge(two.nodes[0].x, two.nodes[0].y, two.nodes[1].x, two.nodes[1].y);
		var u = a.nodes[0].subtract(a.nodes[1]);
		var v = b.nodes[0].subtract(b.nodes[1]);
		return Array.apply(null, Array(count-1))
			.map(function(el,i){ return (i+1)/count; },this)
			.map(function(el){
				var origin = a.nodes[0].lerp(b.nodes[0], el);
				var vector = u.lerp(v, el);
				return this.boundary.clipLine( new Line(origin, vector) ); 
			},this)
			.filter(function(el){ return el !== undefined; },this)
			.map(function(el){ return this.newCrease(el.nodes[0].x, el.nodes[0].y, el.nodes[1].x, el.nodes[1].y) },this);
	}

	availableAxiomFolds():Edge[]{
		var edges = [];
		edges = edges.concat(this.availableAxiom1Folds());
		edges = edges.concat(this.availableAxiom2Folds());
		edges = edges.concat(this.availableAxiom3Folds());
		return edges;
	}
	// availableAxiom1Folds():Edge[]{
	availableAxiom1Folds():Crease[]{
		var edges = [];
		for(var n0 = 0; n0 < this.nodes.length-1; n0++){
			for(var n1 = n0+1; n1 < this.nodes.length; n1++){
				var inputEdge = new Edge(this.nodes[n0], this.nodes[n1]);
				var edge = this.boundary.clipLine( inputEdge.infiniteLine() );
				if(edge !== undefined){
					var cpedge = new CPEdge(this, edge);
					cpedge.madeBy = new Fold(this.creaseThroughPoints, [new XY(this.nodes[n0].x,this.nodes[n0].y), new XY(this.nodes[n1].x,this.nodes[n1].y)]);
					edges.push(cpedge);
				}
			}
		}
		// this.cleanDuplicateNodes();
		return edges;
	}
	// availableAxiom2Folds():Edge[]{
	availableAxiom2Folds():Crease[]{
		var edges = [];
		for(var n0 = 0; n0 < this.nodes.length-1; n0++){
			for(var n1 = n0+1; n1 < this.nodes.length; n1++){
				var inputEdge = new Edge(this.nodes[n0], this.nodes[n1]);
				var edge = this.boundary.clipLine( inputEdge.perpendicularBisector() );
				if(edge !== undefined){
					var cpedge = new CPEdge(this, edge);
					cpedge.madeBy = new Fold(this.creasePointToPoint, [new XY(this.nodes[n0].x,this.nodes[n0].y), new XY(this.nodes[n1].x,this.nodes[n1].y)]);
					edges.push(cpedge);
				}
			}
		}
		// this.cleanDuplicateNodes();
		return edges;
	}
	// availableAxiom3Folds():Edge[]{
	availableAxiom3Folds():Crease[]{
		var edges = [];
		for(var e0 = 0; e0 < this.edges.length-1; e0++){
			for(var e1 = e0+1; e1 < this.edges.length; e1++){
				var a:Line = this.edges[e0].infiniteLine();
				var b:Line = this.edges[e1].infiniteLine();
				var pair = a.bisect(b).map(function(line:Line){
					return this.boundary.clipLine( line );
				},this).filter(function(el){ return el !== undefined; },this);
				var p = pair.map(function(edge){
					var cpedge = new CPEdge(this, edge);
					cpedge.madeBy = new Fold(this.creaseEdgeToEdge, [this.edges[e0].copy(), this.edges[e1].copy()]);
					return cpedge;
				},this);
				edges = edges.concat(p);
			}
		}
		// this.cleanDuplicateNodes();
		return edges;
	}

	availableAxiom4Folds():Crease[]{
		var edges = [];
		for(var e = 0; e < this.edges.length; e++){
			for(var n = 0; n < this.nodes.length; n++){
				var point = new XY(this.nodes[n].x, this.nodes[n].y);
				var edge = this.boundary.clipLine( new Line(point, this.edges[e].vector().rotate90()) );
				if(edge != undefined){
					var cpedge = new CPEdge(this, edge);
					cpedge.madeBy = new Fold(this.creasePerpendicularThroughPoint, [point, new Edge(this.edges[e].nodes[0].copy(), this.edges[e].nodes[1].copy())]);
					edges.push(cpedge);
				}
			}
		}
		return edges;
	}

	// precision is an epsilon value: 0.00001
	/*
	wiggle(precision):XY[]{
		if (precision === undefined){ precision = EPSILON; }

		var lengths = this.edges.forEach(function(crease, i){
			return crease.length();
		});
		// prevent too much deviation from length
		
		var dup = this.copy();

		var forces = [];
		for(var i = 0; i < dup.nodes.length; i++){ forces.push(new XY(0,0)); }

		var nodesAttempted:number = 0;
		// var shuffleNodes = shuffle(dup.nodes);
		for(var i = 0; i < dup.nodes.length; i++){
			var rating = dup.nodes[i].kawasakiRating();

			var edgeLengths = dup.edges.forEach(function(el){ return el.length(); });

			if(rating > precision){
				nodesAttempted++;
				// guess some numbers.
				var guesses = []; // {xy:__(XY)__, rating:__(number)__};
				for(var n = 0; n < 12; n++){
					// maybe store angle so that we can keep track of it between rounds
					var randomAngle = Math.PI*2 / 12 * n; // wrap around to make sure it's random
					var radius = Math.random() * rating;
					var move = new XY( 0.05*radius * Math.cos(randomAngle), 
					                   0.05*radius * Math.sin(randomAngle));
					dup.nodes[i].x += move.x;
					dup.nodes[i].y += move.y;
					var newRating = dup.nodes[i].kawasakiRating();
					var adjNodes = dup.nodes[i].adjacentNodes();
					// var numRatings = 1;  // begin with this node. add the adjacent nodes
					var adjRating = 0;
					for(var adj = 0; adj < adjNodes.length; adj++){
						adjRating += dup.nodes[i].kawasakiRating();
						// numRatings += 1;
					}
					guesses.push( {xy:move, rating:newRating+adjRating} );
					// guesses.push( {xy:move, rating:(newRating+adjRating)/numRatings} );
					// undo change
					dup.nodes[i].x -= move.x;
					dup.nodes[i].y -= move.y;
				}
				var sortedGuesses = guesses.sort(function(a,b) {return a.rating - b.rating;} );
				// if(sortedGuesses[0].rating < rating){
				forces[i].x += sortedGuesses[0].xy.x;
				forces[i].y += sortedGuesses[0].xy.y;
					// dup.nodes[i].x += sortedGuesses[0].xy.x;
					// dup.nodes[i].y += sortedGuesses[0].xy.y;
					// perform quick intersection test, does any line associated with this node intersect with other lines? if so, undo change.
				// }
			}
		}
		// for(var i = 0; i < forces.length; i++){
		// 	dup.nodes[i].x += forces[i].x;
		// 	dup.nodes[i].y += forces[i].y;
		// }

		// for(var i = 0; i < this.nodes.length; i++){ 
		// 	this.nodes[i].x = dup.nodes[i].x;
		// 	this.nodes[i].y = dup.nodes[i].y;
		// }

		// console.log(forces);
		return forces;
		// return dup;
	}
	*/

	// number of nodes tried to wiggle (ignores those correct within epsilon range)
	wiggle(epsilon?:number):number{
		if(epsilon === undefined){ epsilon = 0.00001; }

		var lengths = this.edges.forEach(function(crease, i){
			return crease.length();
		});
		// prevent too much deviation from length

		var nodesAttempted:number = 0;
		// var dup = this.copy();
		// var shuffleNodes = shuffle(this.nodes);
		for(var i = 0; i < this.nodes.length; i++){
			var rating = this.nodes[i].kawasakiRating();
			if(rating > epsilon){
				nodesAttempted++;
				// guess some numbers.
				var guesses = []; // {xy:__(XY)__, rating:__(number)__};
				for(var n = 0; n < 12; n++){
					// maybe store angle so that we can keep track of it between rounds
					var randomAngle = Math.random()*Math.PI*20; // wrap around to make sure it's random
					var radius = Math.random() * rating;
					var move = new XY( 0.05*radius * Math.cos(randomAngle), 
					                   0.05*radius * Math.sin(randomAngle));
					this.nodes[i].x += move.x;
					this.nodes[i].y += move.y;
					var newRating = this.nodes[i].kawasakiRating();
					var adjNodes = this.nodes[i].adjacentNodes();
					// var numRatings = 1;  // begin with this node. add the adjacent nodes
					var adjRating = 0;
					for(var adj = 0; adj < adjNodes.length; adj++){
						adjRating += this.nodes[i].kawasakiRating();
						// numRatings += 1;
					}
					guesses.push( {xy:move, rating:newRating+adjRating} );
					// guesses.push( {xy:move, rating:(newRating+adjRating)/numRatings} );
					// undo change
					this.nodes[i].x -= move.x;
					this.nodes[i].y -= move.y;
				}
				var sortedGuesses = guesses.sort(function(a,b) {return a.rating - b.rating;} );
				// if(sortedGuesses[0].rating < rating){
					this.nodes[i].x += sortedGuesses[0].xy.x;
					this.nodes[i].y += sortedGuesses[0].xy.y;
					// perform quick intersection test, does any line associated with this node intersect with other lines? if so, undo change.
				// }
			}
		}
		return nodesAttempted;
	}

	flatFoldable():boolean{
		return this.nodes.map(function(el){return el.flatFoldable()})
		                 .reduce(function(prev,cur){return prev && cur;});
	}

	//////////////////////////////////////////////
	// GET PARTS
	bounds():Rect{ return this.boundary.minimumRect(); }

	bottomEdge():Crease{
		return this.edges
			.filter(function(el){return el.orientation === CreaseDirection.border})
			.sort(function(a,b){return (b.nodes[0].y+b.nodes[1].y)-(a.nodes[0].y+a.nodes[1].y);})
			.shift();
	}
	topEdge():Crease{
		return this.edges
			.filter(function(el){return el.orientation === CreaseDirection.border})
			.sort(function(a,b){ return (a.nodes[0].y+a.nodes[1].y)-(b.nodes[0].y+b.nodes[1].y);})
			.shift();
	}
	rightEdge():Crease{
		return this.edges
			.filter(function(el){return el.orientation === CreaseDirection.border})
			.sort(function(a,b){ return (b.nodes[0].x+b.nodes[1].x)-(a.nodes[0].x+a.nodes[1].x);})
			.shift();
	}
	leftEdge():Crease{
		return this.edges
			.filter(function(el){return el.orientation === CreaseDirection.border})
			.sort(function(a,b){return (a.nodes[0].x+a.nodes[1].x)-(b.nodes[0].x+b.nodes[1].x);})
			.shift();
	}

	////////////////////////////////////////////////////////////////
	///
	////////////////////////////////////////////////////////////////

	overlapRelationMatrix():boolean[][]{
		// boolean relationship for entry matrix[A][B] can be read as:
		//  is face A "on top of" face B?
		this.clean();
		// if(face == undefined){
		// 	var bounds = this.bounds();
		// 	face = this.nearest(bounds.size.width * 0.5, bounds.size.height*0.5).face;
		// }
		// if(face === undefined){ return; }
		// var tree = face.adjacentFaceTree();
		// console.log(tree);

		var matrix = Array.apply(null, Array(this.faces.length)).map(function(e){
			return Array.apply(null, Array(this.faces.length))
		},this);
		var adj = this.faces.map(function(face){return face.edgeAdjacentFaces();},this);
		adj.forEach(function(adjFaces, i){
			var face = this.faces[i];
			adjFaces.filter(function(adjFace){ return matrix[face.index][adjFace.index] == undefined; },this)
				.forEach(function(adjFace){
					// only works for convex faces
					var thisEdge = face.commonEdges(adjFace).shift();
					switch(thisEdge.orientation){
						case CreaseDirection.mountain: matrix[face.index][adjFace.index] = true; break;
						case CreaseDirection.valley: matrix[face.index][adjFace.index] = false; break;
					}
				},this);
		},this);

		console.log(matrix);

		return undefined;
	}

	removeAllMarks():CreasePattern{
		for(var i = this.edges.length-1; i >= 0; i--){
			if(this.edges[i].orientation === CreaseDirection.mark){
				this.removeEdge(this.edges[i]);
			}
		}
		this.clean();
		return this;
	}

	fold(face?:PlanarFace):object{
		this.clean();
		var copyCP = this.copy().removeAllMarks();
		if(face == undefined){
			var bounds = copyCP.bounds();
			face = copyCP.nearest(bounds.origin.x + bounds.size.width * 0.5,
			                      bounds.origin.y + bounds.size.height*0.5).face;
		} else{
			var centroid = face.centroid();
			face = copyCP.nearest(centroid.x, centroid.y).face;
		}
		if(face === undefined){ return; }
		var tree = face.adjacentFaceTree();
		var faces:{'face':PlanarFace, 'matrix':Matrix}[] = [];
		tree['matrix'] = new Matrix();
		faces.push({'face':tree.obj, 'matrix':tree['matrix']});
		function recurse(node){
			node.children.forEach(function(child){
				var local = child.obj.commonEdges(child.parent.obj).shift().reflectionMatrix();
				child['matrix'] = child.parent['matrix'].mult(local);
				faces.push({'face':child.obj, 'matrix':child['matrix']});
				recurse(child);
			},this);
		}
		recurse(tree);
		var nodeTransformed = Array.apply(false, Array(copyCP.nodes.length))
		faces.forEach(function(el:{'face':PlanarFace, 'matrix':Matrix}){
			el.face.nodes
				.filter(function(node){ return !nodeTransformed[node.index]; },this)
				.forEach(function(node:PlanarNode){
					node.transform(el.matrix);
					nodeTransformed[node.index] = true;
				},this);
		},this);
		return copyCP.exportFoldFile();
	}

	foldSVG(face?:PlanarFace):string{
		this.clean();
		var copyCP = this.copy().removeAllMarks();
		if(face == undefined){
			var bounds = copyCP.bounds();
			face = copyCP.nearest(bounds.origin.x + bounds.size.width * 0.5,
			                      bounds.origin.y + bounds.size.height*0.5).face;
		}
		if(face === undefined){ return; }
		var tree = face.adjacentFaceTree();
		var faces:{'face':PlanarFace, 'matrix':Matrix}[] = [];
		tree['matrix'] = new Matrix();
		faces.push({'face':tree.obj, 'matrix':tree['matrix']});
		function recurse(node){
			node.children.forEach(function(child){
				var local = child.obj.commonEdges(child.parent.obj).shift().reflectionMatrix();
				child['matrix'] = child.parent['matrix'].mult(local);
				faces.push({'face':child.obj, 'matrix':child['matrix']});
				recurse(child);
			},this);
		}
		recurse(tree);
		var nodeTransformed = Array.apply(false, Array(copyCP.nodes.length))
		faces.forEach(function(el:{'face':PlanarFace, 'matrix':Matrix}){
			el.face.nodes
				.filter(function(node){ return !nodeTransformed[node.index]; },this)
				.forEach(function(node:PlanarNode){
					node.transform(el.matrix);
					nodeTransformed[node.index] = true;
				},this);
		},this);
		return copyCP.exportSVG();
	}

	///////////////////////////////////////////////////////////////
	// FILE FORMATS

	export(fileType):any{
		switch(fileType.toLowerCase()){
			case "fold": return this.exportFoldFile();
			case "svg": return this.exportSVG();
		}
	}

	exportFoldFile():object{
		// this.clean();
		this.nodeArrayDidChange();
		this.edgeArrayDidChange();

		var file = {};
		file["file_spec"] = 1;
		file["file_creator"] = "crease pattern Javascript library by Robby Kraft";
		file["file_author"] = "";
		file["file_classes"] = ["singleModel"];
		file["vertices_coords"] = this.nodes.map(function(node){
			return [cleanNumber(node.x, 12),cleanNumber(node.y, 12)];
		},this);
		file["faces_vertices"] = this.faces.map(function(face){
			return face.nodes.map(function(node){ return node.index; },this);
		},this);
		file["edges_vertices"] = this.edges.map(function(edge){
			return edge.nodes.map(function(node){ return node.index; },this);
		},this);
		file["edges_assignment"] = this.edges.map(function(edge){
			switch(edge.orientation){
				case CreaseDirection.border: return "B";
				case CreaseDirection.mountain: return "M";
				case CreaseDirection.valley: return "V";
				case CreaseDirection.mark: return "F";
				default: return "U";
			}
		},this);
		return file;
	}

	importFoldFile(file:object, epsilon?:number):CreasePattern{
		if(file === undefined || 
		   file["vertices_coords"] === undefined ||
		   file["edges_vertices"] === undefined){ return undefined; }

		// this library only supports 2D
		// if file is 3D, we need to alert the user
		if(file["frame_attributes"] !== undefined && file["frame_attributes"].contains("3D")){
			console.log("importFoldFile(): FOLD file marked as '3D', this library only supports 2D. attempting import anyway, expect a possible distortion due to orthogonal projection.");
			// return false;
		}

		// file["file_spec"]
		// file["file_creator"]
		// file["file_author"]
		// file["file_title"]
		// file["file_description"]
		// file["file_classes"]

		this.noBoundary();
		this.clear();

		file["vertices_coords"].forEach(function(el){
			// if z value is found, it should alert the user
			this.newPlanarNode( (el[0] || 0), (el[1] || 0));
		},this);
		this.nodeArrayDidChange();

		file["edges_vertices"]
			.map(function(el:[number, number]):[CreaseNode, CreaseNode]{
				return <[CreaseNode, CreaseNode]>el.map(function(index){ return this.nodes[index]; },this);
			},this)
			.filter(function(el){ return el[0] !== undefined && el[1] !== undefined; },this)
			.forEach(function(nodes){
				this.newPlanarEdgeBetweenNodes(nodes[0], nodes[1]);
			},this);
		this.edgeArrayDidChange();

		var assignmentDictionary = { "B": CreaseDirection.border, "M": CreaseDirection.mountain, "V": CreaseDirection.valley, "F": CreaseDirection.mark, "U": CreaseDirection.mark };
		file["edges_assignment"]
			.map(function(assignment){ return assignmentDictionary[assignment]; })
			.forEach(function(orientation, i){ this.edges[i].orientation = orientation; },this);

		this.faces = file["faces_vertices"]
			.map(function(faceNodeArray, fi){
				var face = new CreaseFace(this);
				face.nodes = faceNodeArray.map(function(nodeIndex){ return this.nodes[nodeIndex]; },this);
				face.edges = face.nodes.map(function(node,ei){
					var nextNode = face.nodes[ (ei+1)%face.nodes.length ];
					return this.getEdgeConnectingNodes(node, nextNode);
				},this);
				return face;
			},this)
		this.faceArrayDidChange();

		var boundaryPoints = this.edges
			.filter(function(el){ return el.orientation === CreaseDirection.border; },this)
			.map(function(el){
				return [
					new XY(el.nodes[0].x, el.nodes[0].y), 
					new XY(el.nodes[1].x, el.nodes[1].y)
				]
			},this)
		this.setBoundary([].concat.apply([],boundaryPoints));
		this.clean(epsilon);
		return this;
	}

	exportSVG(size?:number):string{
		if(size === undefined || size <= 0){ size = 600; }
		var bounds = this.bounds();
		var width = bounds.size.width;
		var height = bounds.size.height;
		var scale = size / (width);
		var origins = [bounds.origin.x, bounds.origin.y];
		var widthScaled = cleanNumber(width*scale).toString();
		var heightScaled = cleanNumber(height*scale).toString();
		var dashW = cleanNumber(width * scale * 0.0025 * 4).toString();
		// var dashWOff = ((width)*scale * 0.0025 * 6 * 0.5).toFixed(1);
		var dashWOff = dashW;
		var strokeWidthNum = width * scale * 0.0025 * 2
		var strokeWidth = strokeWidthNum < 0.5 ? 0.5 : cleanNumber(strokeWidthNum).toString();
		if(strokeWidth == 0){ strokeWidth = 0.5; }

		var valleyStyle = "stroke=\"#4379FF\" stroke-linecap=\"round\" stroke-dasharray=\"" + dashW + "," + dashWOff + "\" ";
		var mountainStyle = "stroke=\"#EE1032\" ";
		var noStyle = "stroke=\"#000000\" ";

		var blob = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- generated by crease pattern Javascript library by Robby Kraft  -->\n<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" width=\"" +widthScaled+ "px\" height=\"" +heightScaled+ "px\" viewBox=\"0 0 " +widthScaled+ " " +heightScaled+ "\">\n";

		var orientationList = [CreaseDirection.mark, CreaseDirection.valley, CreaseDirection.mountain, CreaseDirection.border];
		var styles = [noStyle, valleyStyle, mountainStyle, noStyle];
		var gNames = ["marks", "valley", "mountain", "boundary"];
		var sortedCreases = orientationList.map(function(orient){ return this.edges.filter(function(e){return e.orientation==orient;},this)},this);
		// add a category for anything that slipped by the crease orientation
		sortedCreases.unshift( this.edges.filter(function(e){
			// matching this crease's orientation against list of orientations comes up with no matches
			return orientationList.filter(function(el){return el==e.orientation;},this).length==0;
		},this) );
		gNames.unshift("other")
		styles.unshift(noStyle);

		sortedCreases.forEach(function(creases,i){
			if(creases.length == 0){ return; }
			blob += "<g id=\"" + gNames[i] + "\">\n";
			var style = styles[i];
			creases.forEach(function(crease){
				var p = crease.nodes
					.map(function(el){ return [el.x, el.y]; },this)
					.reduce(function(prev,curr){ return prev.concat(curr); },[])
 					.map(function(el,i){ return (el - origins[i%2]) * scale; },this)
					.map(function(number){ return cleanNumber(number, 12).toString(); },this);
				blob += "\t<line " + style + "stroke-width=\"" + strokeWidth + "\" x1=\"" +p[0]+ "\" y1=\"" +p[1]+ "\" x2=\"" +p[2]+ "\" y2=\"" +p[3]+ "\"/>\n";
			},this);
			blob += "</g>\n";
		},this);

		blob += "</svg>\n";
		return blob;
	}

	exportSVGMin(size:number):string{
		if(size === undefined || size <= 0){ size = 600; }
		var bounds = this.bounds();
		var width = bounds.size.width;
		var height = bounds.size.height;
		var padX = bounds.origin.x;
		var padY = bounds.origin.y;
		var scale = size / (width+padX*2);
		var strokeWidth = (width*scale * 0.0025).toFixed(1);
		if(strokeWidth === "0" || strokeWidth === "0.0"){ strokeWidth = "0.5"; }
		var polylines = this.polylines();
		var blob = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- generated by crease pattern Javascript library by Robby Kraft  -->\n<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" width=\"" +((width+padX*2)*scale)+ "px\" height=\"" +((height+padY*2)*scale)+ "px\" viewBox=\"0 0 " +((width+padX*2)*scale)+ " " +((height+padY*2)*scale)+ "\">\n<g>\n";

		for(var i = 0; i < polylines.length; i++){
			if(polylines[i].nodes.length >= 0){
				blob += "<polyline fill=\"none\" stroke-width=\"" + strokeWidth + "\" stroke=\"#000000\" points=\"";
				for(var j = 0; j < polylines[i].nodes.length; j++){
					var point = polylines[i].nodes[j];
					blob += cleanNumber(scale*point.x, 12).toString() + "," + cleanNumber(scale*point.y, 12).toString() + " ";
				}
				blob += "\"/>\n";
			}
		}
		blob = blob + "</g>\n</svg>\n";
		return blob;
	}

	kiteBase():CreasePattern{
		return this.importFoldFile({"vertices_coords":[[0,0],[1,0],[1,1],[0,1],[0.4142135623730955,0],[1,0.5857864376269045]],"faces_vertices":[[2,3,5],[3,0,4],[3,1,5],[1,3,4]],"edges_vertices":[[2,3],[3,0],[3,1],[3,4],[0,4],[4,1],[3,5],[1,5],[5,2]],"edges_assignment":["B","B","V","M","B","B","M","B","B"]});
	}
	fishBase():CreasePattern{
		return this.importFoldFile({"vertices_coords":[[0,0],[1,0],[1,1],[0,1],[0.292893218813,0.292893218813],[0.707106781187,0.707106781187],[0.292893218813,0],[1,0.707106781187]],"faces_vertices":[[2,3,5],[3,0,4],[3,1,5],[1,3,4],[4,0,6],[1,4,6],[5,1,7],[2,5,7]],"edges_vertices":[[2,3],[3,0],[3,1],[0,4],[1,4],[3,4],[1,5],[2,5],[3,5],[4,6],[0,6],[6,1],[5,7],[1,7],[7,2]],"edges_assignment":["B","B","V","M","M","M","M","M","M","V","B","B","V","B","B"]});
	}
	birdBase():CreasePattern{
		return this.importFoldFile({"vertices_coords":[[0,0],[1,0],[1,1],[0,1],[0.5,0.5],[0.207106781187,0.5],[0.5,0.207106781187],[0.792893218813,0.5],[0.5,0.792893218813],[0.353553390593,0.646446609407],[0.646446609407,0.646446609407],[0.646446609407,0.353553390593],[0.353553390593,0.353553390593],[0,0.5],[0.5,0],[1,0.5],[0.5,1]],"faces_vertices":[[3,5,9],[5,3,13],[0,5,13],[5,0,12],[4,5,12],[5,4,9],[0,6,12],[6,0,14],[1,6,14],[6,1,11],[4,6,11],[6,4,12],[1,7,11],[7,1,15],[2,7,15],[7,2,10],[4,7,10],[7,4,11],[2,8,10],[8,2,16],[3,8,16],[8,3,9],[4,8,9],[8,4,10]],"edges_vertices":[[3,5],[0,5],[4,5],[0,6],[1,6],[4,6],[1,7],[2,7],[4,7],[2,8],[3,8],[4,8],[5,9],[9,8],[9,4],[3,9],[8,10],[10,7],[4,10],[10,2],[7,11],[11,6],[4,11],[11,1],[6,12],[12,5],[0,12],[12,4],[5,13],[0,13],[13,3],[6,14],[0,14],[14,1],[7,15],[1,15],[15,2],[8,16],[3,16],[16,2]],"edges_assignment":["M","M","M","M","M","M","M","M","M","M","M","M","F","F","V","V","F","F","V","V","F","F","M","M","F","F","V","V","V","B","B","V","B","B","V","B","B","V","B","B"]});
	}
	frogBase():CreasePattern{
		return this.importFoldFile({"vertices_coords":[[0,0],[1,0],[1,1],[0,1],[0.5,0.5],[0,0.5],[0.5,0],[1,0.5],[0.5,1],[0.146446609407,0.353553390593],[0.353553390593,0.146446609407],[0.646446609407,0.146446609407],[0.853553390593,0.353553390593],[0.853553390593,0.646446609407],[0.646446609407,0.853553390593],[0.353553390593,0.853553390593],[0.146446609407,0.646446609407],[0,0.353553390593],[0,0.646446609407],[0.353553390593,0],[0.646446609407,0],[1,0.353553390593],[1,0.646446609407],[0.646446609407,1],[0.353553390593,1]],"faces_vertices":[[0,4,9],[4,0,10],[4,2,14],[2,4,13],[3,4,15],[4,3,16],[4,1,12],[1,4,11],[4,5,9],[5,4,16],[4,6,11],[6,4,10],[4,7,13],[7,4,12],[4,8,15],[8,4,14],[0,9,17],[9,5,17],[10,0,19],[6,10,19],[1,11,20],[11,6,20],[12,1,21],[7,12,21],[2,13,22],[13,7,22],[14,2,23],[8,14,23],[3,15,24],[15,8,24],[16,3,18],[5,16,18]],"edges_vertices":[[0,4],[4,2],[3,4],[4,1],[4,5],[4,6],[4,7],[4,8],[0,9],[4,9],[5,9],[4,10],[0,10],[6,10],[1,11],[4,11],[6,11],[4,12],[1,12],[7,12],[2,13],[4,13],[7,13],[4,14],[2,14],[8,14],[3,15],[4,15],[8,15],[4,16],[3,16],[5,16],[9,17],[0,17],[17,5],[16,18],[5,18],[18,3],[10,19],[0,19],[19,6],[11,20],[6,20],[20,1],[12,21],[1,21],[21,7],[13,22],[7,22],[22,2],[14,23],[8,23],[23,2],[15,24],[3,24],[24,8]],"edges_assignment":["V","V","V","M","V","V","V","V","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","M","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B","V","B","B"]});
	}

	/** This will deep-copy the contents of this graph and return it as a new object
	 * @returns {CreasePattern} 
	 */
	copy():CreasePattern{
		this.nodeArrayDidChange();
		this.edgeArrayDidChange();
		this.faceArrayDidChange();
		var g = new CreasePattern();
		g.nodes = []; g.edges = []; g.faces = [];
		g.boundary = undefined;
		for(var i = 0; i < this.nodes.length; i++){
			var n = g.addNode(new CreaseNode(g));
			(<any>Object).assign(n, this.nodes[i]);
			n.graph = g; n.index = i;
		}
		for(var i = 0; i < this.edges.length; i++){
			var index = [this.edges[i].nodes[0].index, this.edges[i].nodes[1].index];
			var e = g.addEdge(new Crease(g, g.nodes[index[0]], g.nodes[index[1]]));
			(<any>Object).assign(e, this.edges[i]);
			e.graph = g; e.index = i;
			e.nodes = [g.nodes[index[0]], g.nodes[index[1]]];
			// e.orientation = this.edges[i].orientation;
		}
		for(var i = 0; i < this.faces.length; i++){
			var f = new PlanarFace(g);
			g.faces.push(f);
			f.graph = g; 
			f.index = i;
			// (<any>Object).assign(f, this.faces[i]);
			if(this.faces[i] !== undefined){
				if(this.faces[i].nodes !== undefined){
				for(var j=0;j<this.faces[i].nodes.length;j++){
					var nIndex = this.faces[i].nodes[j].index;
					f.nodes.push(g.nodes[nIndex]);
				} }
				if(this.faces[i].edges !== undefined){
				for(var j=0;j<this.faces[i].edges.length;j++){
					var eIndex = this.faces[i].edges[j].index;
					f.edges.push(g.edges[eIndex]);
				} }
			}
		}
		g.sectors = this.sectors.map(function(sector,i){
			var gSecEdges = sector.edges.map(function(edge){ return g.edges[edge.index]; },this);
			var s = new CreaseSector(gSecEdges[0], gSecEdges[1]);
			s.index = i;
			return s;
		},this);
		g.junctions = this.junctions.map(function(junction,i){
			var j = new CreaseJunction(undefined);
			// (<any>Object).assign(j, this.junctions[i]);
			j.origin = g.nodes[ junction.origin.index ];
			j.sectors = junction.sectors.map(function(sector){ return g.sectors[sector.index]; },this);
			j.edges = junction.edges.map(function(edge){ return g.edges[edge.index]; },this);
			j.index = i;
			return j;
		},this);
		g.boundary = this.boundary.copy();
		return g;
	}
}


