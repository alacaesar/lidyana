var prods = [594389, 490483, 436046, 584247];
    

function getData() {
	$.ajax({
		method: "GET",
		type: "jsonp",
		url: "http://dem.lidyana.com/mobile/getProduct?&uuid=1234567890123456789012345678901234567890&cid=1&productId=564372,608550,600928,366077,566448",
		})
	.done(function( obj ) {
		var data = obj.data;
		
		for( var i=0; i< data.length; ++i )
		{
			var size = '';
			
			if (data[i].sizes != null) {
				
				console.log(data[i].sizes.length);
				
				for(var j = 0; j<data[i].sizes.length; ++j)
				{
					console.log(data[i].sizes[j]);
					
					var s = data[i].sizes[j].split(",");
					
					size += '<li><button name="' + s[0] + '" value="'+ s[1] +'"' +( s[2] == 0 ? 'disabled':'' )+ '>' + s[1] + '</button></li>';
				}
			}
			$("section").append(
				'<div><h3>' + data[i].name + '</h3><small>'+ data[i].category_name +'</small><br />' +
				'<b>' + (data[i].special_price == null ? data[i].price : data[i].special_price + 'TL <s> '+ data[i].price +' TL</s>') + ' TL</b><br />' +
				'<ul><span>Beden: </span>' + size + '</ul><br /><a href="http://www.lidyana.com/' + data[i].url_path + '">detay</a></div>'
			);
			console.log(data[i]);
		}
	});
}
