
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  GLOBAL VARIABLE 

var win = $(window), doc = $(document), wt = parseFloat( win.width() ),  ht = parseFloat( win.height() ), wst = parseFloat( win.scrollTop() ), sRatio = 0, scene, controller, container, bdy = $('body'), wrapper = $('.wrapper'), preloading = $('.preloading'), timeline = $('.timeline'), imgW = 640, imgH = 360, canvas = $('#Canvas'), update = true, SCALEX = 1, SCALEY = 1, videoType = checkVideoType();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// CANVAS SETTING

	scene = new createjs.Stage('Canvas');
	controller = new createjs.Stage('Controller');
	container = new createjs.Container();
	scene.addChild( container );
	createjs.Ticker.setFPS( 30 );
	createjs.Touch.enable( controller );
	controller.enableMouseOver( 10 );
	controller.mouseMoveOutside = true;
	
	
	createjs.Ticker.addEventListener('tick', tick);
	function tick( event ){
		if( update ){
			update = false;
			scene.update( event );
			controller.update( event );
		}
	}
	function stop(){
		createjs.Ticker.removeEventListener('tick', tick);
	}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// MATH FUNC.
var MATH = {
	
	keyCount : function(o) {
        if( typeof o == 'object' ){
            var i, count = 0;
            for( i in o ) {
                if( o.hasOwnProperty( i ) ){
                    count++;
                }
            }
            return count;
        } else {
            return false;
        }
    },
	
	getDistance: function( x1, y1, x2, y2 ){
		var dx = x2 - x1, dy = y2 - y1;
	    return Math.abs( Math.sqrt( dx * dx + dy * dy ) );	
	},
	
	getCurvePoints: function( ptsa, tension, numOfSegments ){
		
		tension = (tension != 'undefined') ? tension : 0.5;
		numOfSegments = numOfSegments ? numOfSegments : 16;
		
		var _pts = [],
			res = [], // clone array and result
			x, y, // our x,y coords
			t1x, t2x, t1y, t2y, // tension vectors
			c1, c2, c3, c4, // cardinal points
			st, st2, st3, st23, st32, // steps
			l, t, i; // steps based on num. of segments
		
		_pts = ptsa.concat();
		_pts.unshift( ptsa[ 1 ] );
		_pts.unshift( ptsa[ 0 ] );
		_pts.push( ptsa[ ptsa.length - 2 ] );
		_pts.push( ptsa[ ptsa.length - 1 ] );
		
		l = ( _pts.length - 4 );
		for( i = 2; i < l; i += 2 ){
			for( t = 0; t <= numOfSegments; t++ ){
		
				// calc tension vectors
				t1x = ( _pts[ i + 2 ] - _pts[ i - 2 ] ) * tension;
				t2x = ( _pts[ i + 4 ] - _pts[ i ] ) * tension;
		
				t1y = ( _pts[ i + 3 ] - _pts[ i - 1 ] ) * tension;
				t2y = ( _pts[ i + 5 ] - _pts[ i + 1 ] ) * tension;
		
				// pre-calc step
				st = t / numOfSegments;
				st2 = st * st;
				st3 = st2 * st;
				st23 = st3 * 2;
				st32 = st2 * 3;
		
				// calc cardinals
				c1 = st23 - st32 + 1;
				c2 = -( st23 ) + st32;
				c3 = st3 - 2 * st2 + st;
				c4 = st3 - st2;
		
				// calc x and y cords with common control vectors
				x = c1 * _pts[ i ] + c2 * _pts[ i + 2 ] + c3 * t1x + c4 * t2x;
				y = c1 * _pts[ i + 1 ] + c2 * _pts[ i + 3 ] + c3 * t1y + c4 * t2y;
		
				//store points in array
				res.push({ 'x': x, 'y': y });
				
			}
		}
		
		return res;
	
	}

};

Array.prototype.shuffle=function(){
	var len = this.length,tmp,i
	while(len){
		i=Math.random()*len-- |0;
		tmp=this[len],this[len]=this[i],this[i]=tmp;
	}
	return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// CREATEJS DASHED STROKE
(createjs.Graphics.StrokeDash = function( segments, offset ){
    this.segments = segments;
    this.offset = offset;
}).prototype.exec = function( ctx ){
    ctx.setLineDash( this.segments );
    ctx.lineDashOffset = this.offset;
};
createjs.Graphics.prototype.setStrokeDash = function( segments, offset ){
    return this.append( new createjs.Graphics.StrokeDash( segments, offset ) );
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// PRELOADER
(function(window){
	
	function Preloader( obj, callback ){
		
		var preload = new createjs.LoadQueue( true );
			preload.on('progress', handleProgress);
			preload.on('complete', handleComplete);
			preload.on('fileload', handleFileLoad);
			preload.loadManifest( obj, true );
		
		function handleProgress( e ){
			callbackDetect( {'type': 'progress', 'value': e.loaded } );
		}
		
		function handleFileLoad( e ){
			// nothing
		}
		
		function handleComplete( e ){
			callbackDetect( {'type': 'complete', 'value': e['target'] } );
			if( preload != null ){
				preload.close();
				preload = null;
			}
		}
		
		function callbackDetect( obj ){
			if( callback != undefined && obj != undefined ) callback( obj );
		}			
		
	};
	
	window.Preloader = Preloader;
	
})(window);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// SVG TO ARRAY
function convertToArr( o ){
	var path = document.createElementNS('http://www.w3.org/2000/svg', 'path'), len = 0, arr = [];
		path.setAttribute('d', o);
	len = path.getTotalLength();	
	for( var i = 0; i <= 100; ++i ){
		var o = path.getPointAtLength( len * i / 100 );
		arr.push( o['x'] );
		arr.push( o['y'] );
	}
	return arr;		
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// CONTROLLER


(function(window){
	
	function Controller( o, callback ){
		
		var con = new createjs.Container(), pathData = convertToArr( o['path']['d'] ), points = MATH.getCurvePoints( pathData, .5 ), ln, lnMsk = new createjs.Shape(), le = points.length - 1, dir = o['direction'] || 'bottom', rate, cPoint = o['controlPoint'] || .9, rtn = o['return'], content = $('#content'), scPoint = null;
			
		function init(){
			
			//
			resetRate();
			
			// Slogan
			initContent();
			
			// Setup 
			con.scaleX = SCALEX;
			con.scaleY = SCALEY;	
			con.x = con.y = 10;		
			controller.addChild( con );
			
			// Line
			ln = drawLine();
			add( ln );

			// Buttons
			if( o['manifest'] )
				new Preloader( o['manifest'], function( k ){ if( k['type'] == 'complete' ) complete( k['value'] ); });
		}
		
		function initContent(){
			var obj = o['content'];
			if( obj ){
				scPoint = obj['controlPoint'];
				content.html( obj['html'] ).removeAttr('class').addClass( obj['customClass'] ).css({ 'left': obj['x'], 'top': obj['y'] });
			}else{
				content.addClass('hidden');
			}
		}
		
		function checkContent( r ){
			if( scPoint != null ){
				if( dir == 'bottom' || dir == 'rigth' ) r = 1 - r;
				if( r > scPoint ) content.addClass('change');
				else content.removeClass('change'); 
			}
		}
	
		function complete( obj ){
						
			var result = obj['_loadedResults'], id = obj['_loadItemsById'], begin = { 'x': points[ 0 ]['x'], 'y': points[ 0 ]['y'] }, end = { 'x': points[ le ]['x'], 'y': points[ le ]['y'] };
			
			if( result['start'] ){ 
				if( dir == 'bottom' || dir == 'right' )
					add( drawBitmap( { 'img': result['start'], 'opacity': id['start']['opacity'], 'name': 'start', 'coor':{ 'x': end['x'], 'y': end['y'] } } ) );
				else if( dir == 'top' || dir == 'left' )
					add( drawBitmap( { 'img': result['start'], 'opacity': id['start']['opacity'], 'name': 'start', 'coor':{ 'x': begin['x'], 'y': begin['y'] } } ) );		
			}
			
			if( result['end'] ){ 	
				if( dir == 'bottom' || dir == 'right' )
					add( drawBitmap( { 'img': result['end'], 'opacity': id['end']['opacity'], 'name': 'end', 'coor':{ 'x': begin['x'], 'y': begin['y'] } } ) );
				else if( dir == 'top' || dir == 'left' )
					add( drawBitmap( { 'img': result['end'], 'opacity': id['end']['opacity'], 'name': 'end', 'coor':{ 'x': end['x'], 'y': end['y'] } } ) );				
			}
						
			dragBtn( { 'normal': result['drag1'], 'hover':result['drag2'], 'coor':{ 'begin': begin, 'end': end } } );
			
		}
		
		function drawBitmap( o, reg ){
			
			reg = reg == undefined ? true : reg;
			
			var b = new createjs.Bitmap( o['img'] ), w = b.image.width, h = b.image.height;
				b.x = o['coor']['x'];
				b.y = o['coor']['y'];
				if( reg ){
					b.regX = w * .5 | 0;
					b.regY = h * .5 | 0;
				}
				b.name = o['name'];
				b.alpha = o['opacity'];
				
			return b;	
		}
				
		function dragBtn( o ){
			var b = new createjs.Container(), w = 40, h = 40,
				nr = drawBitmap( { 'img': o['normal'], 'opacity': 1, 'name': 'normal', 'coor':{ 'x': 0, 'y': 0 } }, false ),
				hv = drawBitmap( { 'img': o['hover'], 'opacity': 0, 'name': 'hover', 'coor':{ 'x': 0, 'y': 0 } }, false );
			
			b.addChild( nr );
			b.addChild( hv );
			b.regX = w * .5 | 0;
			b.regY = h * .5 | 0;	
			b.name = 'dragBtn';
			b.cursor = 'pointer';
			b.alpha = .5;
			b.rotation = checkRotation( dir == 'bottom' || dir == 'right' ? le - 1 : 1 );			
			b.hitArea = new createjs.Shape( new createjs.Graphics().beginFill("#f00").drawRect( -w * .5, -h * .5, w * 2, h * 2 ) );
			
			if( dir == 'bottom' || dir == 'right' ){
				b.x = o['coor']['end']['x'];
				b.y = o['coor']['end']['y'];
			}else{
				b.x = o['coor']['begin']['x'];
				b.y = o['coor']['begin']['y'];
			}
			
			add( b );
		}
		
		function dragEvents( el ){
			
			var rX = 1 / SCALEX, rY = 1 / SCALEY;
						
			el.on('mousedown', function( evt ){
				this.getChildByName('normal').alpha = 0;
				this.getChildByName('hover').alpha = 1;			
				this.offset = { x: this.x - ( evt.stageX * rX ), y: this.y - ( evt.stageY * rY ) };
			});
		
			el.on('pressmove', function( evt ){
							
				update = true;
				
				if( this.offset ){
					var x = ( evt.stageX * rX ) + this.offset.x, y = ( evt.stageY * rY ) + this.offset.y, pIndex = -1, minDist = 999999999, dist;
					
					for( var i = 0; i < le; i += 2 ){
						dist = MATH.getDistance( x, y, points[ i ]['x'], points[ i ]['y'] );
						if( dist < minDist ){
							minDist = dist;
							pIndex = i;
						}
					}
					this.x = points[ pIndex ]['x'];
					this.y = points[ pIndex ]['y'];
					this.rotation =  checkRotation( pIndex );					
					
					rate = pIndex / le;
					callbackDetect( rate );
				
				}
					
			});
			
			el.on('pressup', function( evt ){
				if( rtn ) checkControlPoint( el, rate );
				this.getChildByName('normal').alpha = 1;
				this.getChildByName('hover').alpha = 0;
			});
	
			el.on('rollover', function( evt ){
				update = true;
			});
	
			el.on('rollout', function( evt ){
				update = true;
			});
		}
		
		function checkRotation( pIndex ){
			var p = [], angle = 0;
				if( pIndex == 0 ) pIndex = 1;
				if( pIndex == le ) pIndex = le - 1;
				p[ 0 ] = points[ pIndex - 1 ];
				p[ 1 ] = points[ pIndex + 1 ];
			if( p[ 0 ] != undefined && p[ 1 ] != undefined ){
				angle = Math.atan2( p[ 1 ].y - p[ 0 ].y, p[ 1 ].x - p[ 0 ].x ) * 180 / Math.PI - 90;
			}
			return angle;
		}
		
		function checkControlPoint( el, rate ){
			
			var _this = this, k = 0, r = ( dir == 'bottom' || dir == 'right' ) ? 1 - cPoint : cPoint;
				_this.value = rate;
			
			callbackDetect( rate );
				
			if( dir == 'bottom' || dir == 'right' ){
				if( rate <= r ) k = 0;
				else k = 1;
			}else{
				if( rate >= r ) k = 1;
				else k = 0;
			}
		
			createjs
			.Tween
			.get( _this )
			.to({ value: k }, 555)
			.call(function(){
				// complete
				callbackDetect( rate );
				resetRate();
			})
			.addEventListener('change', function(){
				var ind = Math.round( _this.value * le ), o = points[ ind ];
				if( o != undefined ){
					el.x = o['x'];
					el.y = o['y'];
					el.rotation = checkRotation( ind );
					update = true;
				}
				rate = _this.value;
				callbackDetect( rate );
			});
			
		}
		
		function drawLine(){
			var line = new createjs.Shape(), stroke = o['path'];
				line.graphics.setStrokeStyle( stroke['style'] ).setStrokeDash( stroke['dash']['segment'], stroke['dash']['offset'] ).beginStroke( stroke['color'] );
				line.alpha = stroke['opacity'] || 1;
				
			for( i = 0; i < le; i+=2 ){
				var x = points[ i ]['x'], y = points[ i ]['y'];
				if( i > 0 ) 
					line.graphics.lineTo( x, y );
				else 
					line.graphics.moveTo( x, y );
			}
			line.graphics.endStroke();
						
			return line;
		}
		
		function dynamicMasking( r ){
			var o = points[ Math.round( r * le ) ];
			lnMsk.graphics.beginFill("#ff0000").drawRect( 0, 0, 500, 500 ).arc( o['x'], o['y'], 19, 0, Math.PI * 2, true );
			ln.mask = lnMsk;
		}
		
		function checkElement( r ){
			var el, r = ( dir == 'bottom' || dir == 'rigth' ) ? 1 - r : r;
			
			// end
			if( cPoint != null ){
				el = con.getChildByName('end');
				if( r >= cPoint ){
					el.alpha = 1;
					el.scaleX = el.scaleY = 1.3;
				}
				else{
					el.alpha = .5; 
					el.scaleX = el.scaleY = 1;
				}
			}
			
			// start
			el = con.getChildByName('start');
			if( r >= .01 ) el.alpha = 1;
			else el.alpha = 0;
		}

		function callbackDetect( r ){
			checkElement( r );
			checkContent( r );
			dynamicMasking( r );
			if( callback != undefined ) callback({ 'rate': r });
		}
		
		function resetRate(){
			rate = ( dir == 'bottom' || dir == 'right' ) ? 1 : 0;
		}
		
		function add( k ){
			con.addChild( k );
			update = true;
		}
				
		init();
					
		// PUBLIC FUNC.
		this.activeEvents = function(){
			var el = con.getChildByName('dragBtn');
			if( el ){
				el.alpha = 1;
				dragEvents( el );
			}
		}
		this.adjust = function(){
		
		};
		this.destroy = function(){
		
		};
	};
	
	window.Controller = Controller;
	
})(window);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// CANVAS

(function(window){
	
	function Scrup( obj, callback ){
		
		var con = new createjs.Container(), _loadItemsById, _loadedResults, maxCount = 0, Cntrl;
		
		container.addChild( con );
			
		function init(){
			
			var type = 'pc', sml = obj[ type ]['small'], md = obj[ type ]['medium'], lrg = obj[ type ]['large'], stp = isMobile ? obj[ type ]['stepMobile'] : obj[ type ]['step'], first = obj[ type ]['first'], last = obj[ type ]['last'], counter = 0, manifest = [];
			for( var i = first; i <= last; ++i ){
				
				if( stp > 1 )
					if( i % stp != 1 ) continue; 
				
				var imgName = '', n = i.toString().length, o = {};
				if( n == 1 ) imgName = '0000';
				else if( n == 2 ) imgName = '000';
				else if( n == 3 ) imgName = '00';
				imgName = imgName + i + '.jpg';
				
				o['id'] = counter;
				o['src'] = md + imgName;
				o['paths'] = { 'small': sml + imgName, 'medium': md + imgName, 'large': lrg + imgName };

				manifest.push( o );
				
				counter++;
		
			}
			
			// Controller
			Cntrl = new Controller( obj['controller'], function( o ){
				if( maxCount > 0 ){			
					var dir = obj['controller']['direction'], rate = o['rate'], cr = 0;
					if( dir == 'bottom' || dir == 'rigth' ) cr = Math.round( ( 1 - rate ) * maxCount );
					else if( dir == 'top' || dir == 'left' ) cr = Math.round( rate * maxCount );
					drawCanvas( cr ); 
					//
					callbackDetect( rate );
				}
			});
			
			
			new Preloader( manifest, function( k ){ 
				if( k['type'] == 'progress' ) progress( k['value'] );
				else if( k['type'] == 'complete' ) complete( k['value'] ); 
			});
		
		}
		
		function progress( e ){
			preloading.css({ 'width': 100 * e + '%' });
		}
		
		function complete( e ) {
	
			preloading.css({ 'width': '100%' });
			
			setTimeout(function(){ preloading.addClass('completed'); }, 100 );
	
			_loadItemsById = e['_loadItemsById'];
			_loadedResults = e['_loadedResults'];
			maxCount = MATH.keyCount( _loadItemsById ) - 1;
			
			// controller active
			Cntrl.activeEvents();	
			
			drawCanvas( 0 );
			events.onResize();
		}
		
		function drawCanvas( k ){
			if( con.getNumChildren() > 0 ) con.removeAllChildren();
			
			var bmp = new createjs.Bitmap( _loadedResults[ k ] );
				bmp.x = 0;
				bmp.y = 0;
				
			con.addChild( bmp );
			
			update = true;
		}
		
		function callbackDetect( r ){
			if( callback != undefined ) callback({ 'rate': r });
		}
	
		init();
					
		// PUBLIC FUNC.
		this.adjust = function(){
		
		};
		this.destroy = function(){
		
		};
	};
	
	window.Scrup = Scrup;
	
})(window);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// VIDEO

(function(window){
	
	function Video( obj, callback ){
		
		var el = obj['el'], videoFrame, frmRate = 30, preview = true;
		
		function init(){
			
			console.log( videoType );
			el.get( 0 ).pause();
			el.removeAttr('src poster').attr('src', obj['video']['source']['mp4']).attr('poster', obj['video']['poster']);
			el.get( 0 ).load();
			
			videoFrame = VideoFrame({ id: obj['id'], frameRate: frmRate, callback: function(){ callbackDetect({ 'type': 'frame', 'value': videoFrame.get() }); } });
			videoFrame.listen('frame');
			videoFrame.seekTo( { frame: 730 } );	
			
			el[ 0 ].addEventListener('loadedmetadata', function(e){ callbackDetect({ 'type': 'loaded', 'value': Math.floor( el[ 0 ].duration.toFixed( 5 ) * frmRate ) }); });
			el.bind('click', function(){
				if( preview ){
					preview = false;
					el[ 0 ].pause();
				}else{
					preview = true;
					el[ 0 ].play();
				} 
			});
		}
		
		function callbackDetect( k ){
			if( callback != undefined )
				callback( k );
		}
		
		init();
		
		/* GLOBAL */
		this.play = function(){
			el[ 0 ].play();
		};
		this.pause = function(){
			el[ 0 ].pause();
		};
		this.seekto = function( k ){
			videoFrame.seekTo( { frame: k } );
		};
	};
	
	window.Video = Video;
	
})(window);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// SECTION

(function(window){
	
	function Section( obj, callback ){
		
		var scrup = obj['scrup'], loop, video, pointers = $('#pointers > a'), totalFrame = 0, cPoint = obj['main']['controlPoint'], preview = true;
			
		function init(){
			
			loop = new Video({ 'id': 'loopVideo', 'el': $('#loopVideo'), 'video': obj['selections'] });
			video = new Video({ 'id': 'mainVideo', 'el': $('#mainVideo'), 'video': obj['main'] }, function( k ){
				if( k['type'] == 'frame' ) progress( k['value'] );
				else if( k['type'] == 'loaded' ){
					totalFrame = k['value'];
					video.play();
				}
			});
			
			// Scrup
			if( scrup ){
				new Scrup(scrup, function( k ){
					var rate = k['rate'], dir = scrup['controller']['direction'], k = 0;
					if( dir == 'top' || dir == 'left' ) k = 1;
					if( rate == k ){
						$('.scene').removeClass('scrup');
						continua();
					}
				});	
			}
		}
		
		function progress( currentFrame ){
			pointerControl( currentFrame );
			progressBar( currentFrame );
			controlPoint( currentFrame );
		}
		
		function progressBar( k ){
			callbackDetect( { 'type': 'progress', 'value': k / totalFrame * 100 } );
		}
		
		function controlPoint( k ){
			
			// scrup
			if( k >= cPoint['begin'] - 2 && k <= cPoint['begin'] + 2 ){
				video.pause();
				if( scrup ) $('.scene').addClass('scrup');
				callbackDetect({ 'type': 'controlPoint', 'value': 'begin' });
			}

			// loop
			if(  k >= totalFrame - 2 ){
				video.pause();
				loop.play();
				$('.scene').removeClass('scrup').addClass('loop');
				callbackDetect({ 'type': 'selections' });
			}
			
		}
		
		function pointerControl( k ){
			if( obj['cue-point'] ){
				var c = cuePoint[ k ];
				if( c ){
					pointers.each(function( i, k ){
							var _this = $( this ), rel = _this.attr('rel');
							if( rel != undefined ){
								var o = c[ rel ];
								if( o != undefined ){
									var x = ( o['x'] / imgW * 100 ) + '%',
										y = ( o['y'] / imgH * 100 ) + '%';
									_this.css({ 'top': y, 'left': x });
									if( o['state'] ) _this.addClass('show');
									else  _this.removeClass('show');
								}
							}
					});
				}
			}
		}
		
		function continua(){
			video.seekto( cPoint['end'] );
			setTimeout(function(){
				play();
			}, 250);
			callbackDetect({ 'type': 'controlPoint', 'value': 'end' });
		}
		
		function callbackDetect( o ){
			if( callback != undefined ) callback( o );
		}
		
		function play(){
			video.play();
		}
		
		function pause(){
			video.pause();
		}
		
		init();
					
		// PUBLIC FUNC.
		this.continu = function(){ continua(); };
		this.adjust = function(){
		
		};
		this.destroy = function(){
		
		};
	};
	
	window.Section = Section;
	
})(window);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// TIMELINE

(function(window){
	
	function Timeline( obj, callback ){
		
		var sections = {}, le = MATH.keyCount( section ) - 1, rate = 100 / le, active = 0, current;
		
		function init(){
			
			initTemplate();
	
			// Start
			/*current = new Section( section['start'], function( k ){
				if( k['type'] == 'controlPoint' ) console.log( k['value']);
			});
			$('#startPage .bell').bind('click', function(){
				wrapper.removeClass('startingPage');
				current.continu();
			});
			*/
			
			
			wrapper.removeClass('startingPage');
			new Section( section['running'], function( k ){
				if( k['type'] == 'progress' )
					progressBar( k['value'] );
			});
			
		}
		
		
		function initTemplate(){
			var t = '';
			for( var i = 0; i < le; ++i )
				t += '<li style="width:'+ rate +'%"></li>';
			$('ul', timeline).html( t );
		}
		
		function progressBar( k ){
			$('.progress', timeline).css({ 'width': ( active * rate ) + ( k / 100 * rate ) + '%' });
		}
		
		init();
					
		// PUBLIC FUNC.
		this.adjust = function(){
		
		};
		this.destroy = function(){
		
		};
	};
	
	window.Timeline = Timeline;
	
})(window);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// SELECTION

var selection = {
	arr1: [ {id:0, type:0, name:"running"},
		{id:1, type:0, name:"boxing"},
		{id:2, type:0, name:"burpee"},
		{id:3, type:0, name:"yoga"},
		{id:4, type:0, name:"dancing"}],
	arr2: [ {id:5, type:1, name:"coffee"},
		{id:6, type:1, name:"music"},
		{id:7, type:1, name:"juice"}],
	arr3: [],
	temp: false,
	generate:function(callback)
	{	
		var arr1 = this.arr1, arr2 = this.arr2, arr3 = this.arr3;
		
		if (!this.temp){
			this.temp = arr1.shuffle().slice(0).slice(0, 3);
		}
		else
		{
			if (arr1.length >= 2 && arr2.length >= 1) {
				this.temp = arr1.shuffle().slice(0).slice(0, 2);
				this.temp.push(arr2[Math.floor(Math.random() * arr2.length)]);
			}
			else{
				arr3 = arr1.concat(arr2);
				this.temp = arr3.shuffle().slice(0).slice(0, 3);
			}
		}
		callback(this.temp.length > 1 ? this.temp : this.temp[0]);
	},
	subtract: function(str)
	{
		var arr1 = this.arr1, arr2 = this.arr2,
		    obj = str.split("|"),
		    array = obj[0] == 0 ? arr1 : arr2;
		
		for (var i=0; i<array.length; ++i)
			if (array[i].id == obj[1])
				array.splice(i, 1);
	}
}

function playselection( str ){
	selection.subtract( str );		
}

function generateRandom(){
	selection.generate(function( array ){
		if( array.length > 1 ){
			for( var i=0; i < array.length; ++i )
				console.log( array[ i ].type, array[ i ].id, array[ i ].name );
			//'<a href="javascript:playselection('+"'"+ array[i].type +"|"+ array[i].id + "'"+')">'+ array[i].name +'</a>'
		}
		else{
			console.log( array.type, array.id, array.name );
		}	
	});
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// VIDEO
/* http://www.webdevdoor.com/html-5/changing-html5-video-javascript-jquery/ */
function checkVideoType(){
	var k;
	if( Modernizr.video ){
		if( Modernizr.video.webm ) k = 'webm';
		else if( Modernizr.video.ogg ) k = 'ogg';
		else if( Modernizr.video.h264 ) k = 'mp4';
	}else k = null;
	
	return k;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////// CSS CLASS

// cssClass({ 'ID': wrapper, 'delay': 100, 'type': 'add', 'cls':['ready', 'animate'] });
function cssClass( o, callback ){
	var ID = o['ID'], k = o['delay'], type = o['type'], cls;
	if( ID.length > 0 ){
		if( type == 'add' ){
			cls = o['cls'] || ['ready', 'animate'];
			ID.addClass( cls[ 0 ] ).delay( k ).queue('fx', function(){ $( this ).dequeue().addClass( cls[ 1 ] ); if( callback != undefined ) callback(); });
		}else{
			cls = o['cls'] || ['animate', 'ready'];
			ID.removeClass( cls[ 0 ] ).delay( k ).queue('fx', function(){ $( this ).dequeue().removeClass( cls[ 1 ] ); if( callback != undefined ) callback(); });
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// RESIZE

/*  
	http://stackoverflow.com/questions/10212683/jquery-drag-resize-with-css-transform-scale  
	http://www.sitepoint.com/creating-a-simple-windows-8-game-with-javascript-game-basics-createjseaseljs/ 
	https://github.com/CreateJS/EaselJS/issues/14
*/

function sceneResize(){
    
	
	
	var wRatio, hRatio, ratio = imgW / imgH;
	
	
	/* ORANTI 1 */
	if ( wt / ht >= ratio ){
		wRatio = wt;
		hRatio = wt / ratio;
	}else{
		wRatio = ht * ratio;
		hRatio = ht;
	}

	/* ORANTI 2 */
	if( wt / ht >= ratio ){
		wRatio = ht * ratio;
		hRatio = ht;
	}else{
		wRatio = wt;
		hRatio = wt / ratio;
	}

	
	
	canvas.attr( 'width', wt ).attr( 'height', ht );
	
	container.x = Math.round( ( wt - wRatio ) * .5 );
	container.y = Math.round( ( ht - hRatio ) * .5 );
	container.scaleX = wRatio / imgW;
	container.scaleY = hRatio / imgH;
	
	
	
	
	//
	$('#mainVideo, #loopVideo, #pointers, #startPage, .scrupWrapper .controller').css({ 'left': Math.round( ( wt - wRatio ) * .5 ), 'top': Math.round( ( ht - hRatio ) * .5 ), 'width': wRatio, 'height': hRatio });
	
	scene.update();	
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// GLOBAL EVENTS
var events =
{
	
	init: function(){
	
	},
	
	onResize: function(){
		wt = parseFloat( win.width() );
		ht = parseFloat( win.height() );
		
		sceneResize();
	},
	
	onScroll: function(){
		wst = parseFloat( win.scrollTop() );
		sRatio = wst / ( doc.height() - ht );
	}
	
};

win.load( events.init );
win.resize( events.onResize ).resize();
win.scroll( events.onScroll ).scroll();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// INIT

new Timeline();