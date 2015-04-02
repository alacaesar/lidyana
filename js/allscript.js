/////////////////////////////////////////////////////////////////////////////////////////////////// DATA
var data = {
	'women_power_snatch':	{
		'small': 'images/power_snatch/small/LB_Training_W01.',
		'medium': 'images/power_snatch/medium/LB_Training_W01.',
		'large': 'images/power_snatch/large/LB_Training_W01.',
		'step': 4,
		'stepMobile': 8,
		'first': 1,
		'last': 100
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////////// GLOBAL FUNC.

$.extend({
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
    }
}); 
 
/////////////////////////////////////////////////////////////////////////////////////////////////// GLOBAL VAR 

/* GLOBAL VARIABLE */
var win = $(window), doc = $(document), wt = parseFloat( win.width() ),  ht = parseFloat( win.height() ), wst = parseFloat( win.scrollTop() ), sRatio = 0, scene, container, preload, el = $('.wrapper'), preloading = $('.preloading'), _loadItemsById, _loadedResults, maxCount = 0, imgW = 960, imgH = 450, canvas = $('#Canvas');

/////////////////////////////////////////////////////////////////////////////////////////////////// CANVAS SETTING

	scene = new createjs.Stage('Canvas');
	container = new createjs.Container();
	scene.addChild( container );
	createjs.Ticker.setFPS(30);

///////////////////////////////////////////////////////////////////////////////////////////////////  

$(function imageList(){
	var obj = data['women_power_snatch'], sml = obj['small'], md = obj['medium'], lrg = obj['large'], stp = isMobile ? obj['stepMobile'] : obj['step'], first = obj['first'], last = obj['last'], counter = 0, manifest = [];
	for( var i = first; i <= last; ++i ){
		if( i % stp == 1 ){
			
			var imgName = '', n = i.toString().length, o = {};
			if( n == 1 ) imgName = '000';
			else if( n == 2 ) imgName = '00';
			else if( n == 3 ) imgName = '0';
			imgName = imgName + i + '.jpg';
			
			o['id'] = counter;
			o['src'] = md + imgName;
			o['paths'] = { 'small': sml + imgName, 'medium': md + imgName, 'large': lrg + imgName };
			manifest.push( o );
			
			counter++;
		}
	}
	
	preloader( manifest );
}()); 

function stop() {
	if( preload != null )
		preload.close();
}

function preloader( obj ){
	preload = new createjs.LoadQueue( true );
	preload.on('progress', handleProgress);
	preload.on('complete', handleComplete);
	preload.on('fileload', handleFileLoad);
	preload.loadManifest( obj, true );
}

function handleProgress( e ) {
	preloading.css({ 'width': 100 * e.loaded + '%' });
}

function handleFileLoad( e ) {
	//console.log( 'handleFileLoad', e );	
}

function handleComplete( e ) {
	
	preloading.css({ 'width': '100%' });
	
	setTimeout(function(){ preloading.addClass('completed'); }, 100 );
	
	var target = e['target'];
		_loadItemsById = target['_loadItemsById'];
		_loadedResults = target['_loadedResults'];
		maxCount = $.keyCount( _loadItemsById ) - 1;
	
	drawCanvas( 0 );
	events.onResize();
	
	new Draggable( dragData['type1'] );
}

function drawCanvas( k ){
	if( container.getNumChildren() > 0 ) container.removeAllChildren();
	
	var bmp = new createjs.Bitmap( _loadedResults[ k ] );
		bmp.x = 0;
		bmp.y = 0;
		
	container.addChild( bmp );
	
	scene.update(); 
}


/////////////////////////////////////////////////////////////////////////////////////////////////// PATH

var dragData = {
	'type1':
	{
		'el': '.draggableAre.type1',
		'dragEl':'.draggableDiv',
		'pointerEl': '.motionDiv',
		'width': 146,
		'heigth': 347,
		'axis': 'y',
		'direction': 'top',
		'path':
		{
			'el': '.path svg',
			'd': 'M19,19.5c0,0,114,63,107.5,308.5',
			'stroke': 'rgb(255, 255, 255)',
			'strokeWidth': '2',
			'strokeDasharray': '10',
			'fill': 'none',
			'width': 146,
			'heigth': 347	
		},
	}
};


(function(window){
	
	function Draggable( obj ){
		
		var el = $( obj['el'] ), pathEl = $( obj['path']['el'], el ), dragEl = $(obj['dragEl'], el), pointerEl = $(obj['pointerEl'], el), path = createPath( obj['path'] ), len = path.getTotalLength(), w = obj['width'], h = obj['heigth'], dir = obj['direction'], rate = 0, stm = null;
		
		if( pathEl.length > 0 )	
			pathEl.append( path );
		
		if( dragEl.length > 0 )		
			dragEl.draggable({
				
				containment: obj['el'],
				
				axis: obj['axis'],
				
				start: function( event, ui ){
					
				},
				
				drag: function( event, ui ){
										
					var cr = 0;
					
					if( dir == 'bottom' || dir == 'top' ){
						
						 rate = ui.position.top  / ( h - dragEl.height() );
						 ui.position.left = pointerEl.position().left;
						 
					}else if( dir == 'left' || dir == 'rigth' ){
						
						// nothing
						
					}
					
					if( rate < 0 || rate > 1 ) return false;
					
					if( dir == 'bottom' || dir == 'rigth' ) cr = Math.round( ( 1 - rate ) * maxCount );
					else if( dir == 'top' || dir == 'left' ) cr = Math.round( rate * maxCount );
					
					calcPath( Math.round( rate * 100 ) );
					drawCanvas( cr ); 
				},
				
				stop: function( event, ui ){
					
					loop();				
					
					
					//dragEl.css({ 'left': pointerEl.position().left, 'top': pointerEl.position().top });
					
				}
				
			});
		var asd = [];
		function loop(){
			
			var cr = 0;
			
			stm = requestAnimFrame( loop );
			
			if( dir == 'bottom' || dir == 'rigth' ){
				rate += .025;		
				cr = Math.round( ( 1 - rate ) * maxCount );
			}
			else if( dir == 'top' || dir == 'left' ){
				 rate -= .025;
				 cr = Math.round( rate * maxCount );
			}
			
			if( rate <= 0 || rate >= 1 ){
				cancelRequestAnimFrame( stm );
				rate = 1;
				dragEl.css({ 'left': pointerEl.position().left, 'top': pointerEl.position().top });
			}
			
			if( cr <= 0 ) cr = 0;
			if( cr >= maxCount ) cr = maxCount;
			
			
			calcPath( Math.round( rate * 100 ) );
			drawCanvas( cr ); 
	
		}	
		
		
		function calcPath( percent ){
			var p = [], angle;
			p[ 0 ] = pointAt( percent - 1 );
			p[ 1 ] = pointAt( percent + 1 );
			angle = Math.atan2( p[ 1 ].y - p[ 0 ].y, p[ 1 ].x - p[ 0 ].x ) * 180 / Math.PI;
			calc( { pointers: pointAt( percent ), angle: angle } );
			if( percent >= 0 && percent <= 100 ){
				var obj =  pointAt( percent )
				 asd.push( obj.x );
				 asd.push( obj.y );
			}
			if( percent == 100 ){
			console.log('===========');
			console.log(asd.toString(), percent )
			console.log('===========');
			}
			
		}
		
		function pointAt( percent ){
			return path.getPointAtLength( len * percent / 100 );
		}
		
		function calc( obj ){
			pointerEl[0].style.cssText = "top:" + obj['pointers']['y'] + "px;" + 
												"left:" + obj['pointers']['x'] + "px;" +
												"transform:translate(-50%,-50%) rotate(" + obj['angle'] + "deg);" +
												"-webkit-transform:translate(-50%,-50%) rotate(" + obj['angle'] + "deg);";
		}
		
		//
		if( dir == 'bottom' || dir == 'rigth' ) calcPath( 100 );
		else if( dir == 'top' || dir == 'left' ) calcPath( 0 );
		dragEl.css({ 'left': pointerEl.position().left, 'top': pointerEl.position().top });
					
		// PUBLIC FUNC.
		this.adjust = function(){
		
		};
		this.destroy = function(){
		
		};
	};
	
	window.Draggable = Draggable;
	
})(window);


/* */
function createPath( obj ){
	
	var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', obj['d']);
		path.setAttribute('width', obj['width']);
		path.setAttribute('height', obj['height']);	
		path.style.stroke = obj['stroke'];
		path.style.strokeWidth = obj['strokeWidth'];
		path.style.strokeDasharray = obj['strokeDasharray'];
		path.style.fill = obj['fill'];
	
	return path;
}


/* */
function sceneResize(){
      
	var wRatio, hRatio, ratio = imgW / imgH;
	
	if ( wt / ht >= ratio ){
		
		wRatio = wt;
		hRatio = wt / ratio;
		
	}else{
		
		wRatio = ht * ratio;
		hRatio = ht;
		
	}
		
	canvas.attr( 'width', wt ).attr( 'height', ht );
			
	container.x = Math.round( ( wt - wRatio ) * .5 );
	container.y = Math.round( ( ht - hRatio ) * .5 ); 
	container.scaleX = wRatio / imgW;
	container.scaleY = hRatio / imgH;
	
	scene.update();
		
}

/* GLOBAL EVENTS */
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
win.resize( events.onResize );
win.scroll( events.onScroll ).scroll();	