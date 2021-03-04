


function remove_empty_bins(source_group) {
    return {
        all:function () {
            return source_group.all().filter(function(d) {
                return d.value != 0;
            });
        }
    };
}


function makeGraphs(error, recordsJson){
	// Settings
	// Map 
    var map = L.map('map');
    var mytiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', 
        {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'});
    map.addLayer(mytiles);


    var markerClusters = L.markerClusterGroup();
    var legend = L.control({position:'bottomleft'});

    var myStyle = {
                radius: 3,
                fillColor: "#6baed6",
                color: "#666666",
                weight: 1,
                opacity: 1,
                fillOpacity: 1
    };

    map.setView([5, 0], 2);
    

    // Data
	var roundValue = 5;
    var stepLength = 5;
	var dateFormat = d3.time.format("%a %b %d %H:%M:%S %Z %Y");
    var records = recordsJson;
    var polarity = ["pos", "neg"];



    records.forEach(function(d){
        date = dateFormat.parse(d['timestamp']);
        date.setSeconds(0);
        date.setMinutes(roundX(roundValue, date.getMinutes()))
        d['timestamp'] = date;    

        var x =  Math.random();

        if (x > 0.7)
        	d['polarity'] = 'pos';
        else
        	d['polarity'] = 'neg';

    });


	// Crossfilter

	var ndx = crossfilter(records);

	// - Dimensions 
	var dateDim 	= ndx.dimension(function(d) {return d['timestamp']; });
	var freqTermDim = ndx.dimension(function(d){return d['term_freq']; }, true);
	var mentionsDim = ndx.dimension(function(d){return d['mention_freq']; }, true);
	var hashtagsDim = ndx.dimension(function(d){return d['hash_freq']; }, true);
	var allDim 		= ndx.dimension(function(d) {return d;});

	// - Groups
	var dateGroup 			= dateDim.group();
	var freqTermGroup 		= freqTermDim.group();
	var mentionsGroup 		= mentionsDim.group();
	var hashtagsGroup 		= hashtagsDim.group();
	var all 				= ndx.groupAll();

	//var posGroup           = dateDim.group().reduceSum(function(d){ return d['polarity'] === 'pos';});
	var allPos             = ndx.groupAll().reduceSum(function(d){ return d['polarity'] === 'pos';});
	var freqTermGroupPos   = freqTermDim.group().reduceSum(function(d){ return d['polarity'] === 'pos';}); 
    var mentionsGroupPos   = mentionsDim.group().reduceSum(function(d){ return d['polarity'] === 'pos';});
    var hashtagsGroupPos   = hashtagsDim.group().reduceSum(function(d){ return d['polarity'] === 'pos';});
	

	var negGroup 			= dateDim.group().reduceSum(function(d){ return d['polarity'] === 'neg';});
    var allNeg  			= ndx.groupAll().reduceSum(function(d){ return d['polarity'] === 'neg';});
    var freqTermGroupNeg   = freqTermDim.group().reduceSum(function(d){ return d['polarity'] === 'neg';}); 
    var mentionsGroupNeg    = mentionsDim.group().reduceSum(function(d){ return d['polarity'] === 'neg';});
    var hashtagsGroupNeg    = hashtagsDim.group().reduceSum(function(d){ return d['polarity'] === 'neg';});
	
	// - Charts

	var minDate = dateDim.bottom(1)[0]['timestamp'];
    var maxDate = dateDim.top(1)[0]['timestamp'];


    var timeChart 		= dc.barChart("#time-chart");
    var numberTweets 	= dc.numberDisplay("#number-tweets");
    var freqTermsChart 	= dc.rowChart("#term_freq");
    var mentionsChart 	= dc.rowChart("#mentions");
    var hashtagsChart 	= dc.rowChart("#hashtags");
    var datatable       = $('#table');

 	var timeWidth 		= document.getElementById('timeBox').offsetWidth;
 	var freqWidth 		= document.getElementById('freqBox').offsetWidth;
 	var mentionsWidth 	= document.getElementById('mentionsBox').offsetWidth;
 	var hashtagsWidth 	= document.getElementById('hashtagsBox').offsetWidth;

    var ydim = dateDim.group().reduce(
          function(p, v) {
            p[v.polarity] = (p[v.polarity] || 0) + 1;
            return p;}, 
          function(p, v) {
            p[v.polarity] = (p[v.polarity] || 0) - 1;
            return p;}, 
          function() {
            return {};
          });
            function sel_stack(valueKey) {
            return function(d) {
              return d.value[valueKey];
    };}
       

    timeChart
     	.height(185)
        .width(timeWidth)
            .margins({top: 10, right: 1, bottom: 30, left: 60})
            .dimension(dateDim)
            .group(dateGroup)
            .transitionDuration(500)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .colors("#6baed6")
            .elasticY(false)
            .renderHorizontalGridLines(true)
            .yAxis().ticks(4);

    numberTweets
    	.width(800)
        .height(140)
        .formatNumber(d3.format(".0f"))
        .valueAccessor(function(d){return d; })
        .group(all);

    freqTermsChart
        .height(370)
        .width(freqWidth)
        .dimension(freqTermDim)
        .group(freqTermGroup)
        .transitionDuration(200)
        .colors('#6baed6')
        .elasticX(true)
        .cap(10)
        .ordering(function(d){return -d.value;})
        .othersGrouper(null)
        .xAxis().ticks(4);

    mentionsChart
        .height(155)
        .width(mentionsWidth)
        .dimension(mentionsDim)
        .group(mentionsGroup)
        .transitionDuration(200)
        .colors('#6baed6')
        .elasticX(true)
        .cap(5)
        .ordering(function(d){return -d.value;})
        .othersGrouper(null)
        .xAxis().ticks(4);

    hashtagsChart
        .height(155)
        .width(hashtagsWidth)
        .dimension(hashtagsDim)
        .group(hashtagsGroup)
        .transitionDuration(200)
        .colors('#6baed6')
        .elasticX(true)
        .cap(5)
        .ordering(function(d){return -d.value;})
        .othersGrouper(null)
        .xAxis().ticks(4);

    var tableDimension = allDim;

    var dataTableOptions = {
        "bSort": true,
        columnDefs: [
            {
                 width: "20%" ,targets: 0,
                data: function (d) {
                    
                    return d['timestamp']; 
                },
                type: 'date',
                defaultContent: 'Not found'
            },
            {
                width: "15%" ,targets: 1,
                data: function (d) {return d['name']+"  <span style='color:grey;'>@"+d['user']+"</span>"; },
                defaultContent:'Not found'
            },
            {
                width: "45%" ,targets: 2,

                data: function (d) {if (d['text']) return d['text']
                                                    .replace(/#(\w+)/g, '<span style="color: darkblue;">$&</span>')
                                                    .replace(/@(\w+)/g, '<span style="font-weight: bold;">$&</span>'); },
                defaultContent: ''
            },
            {
                targets: 3,
                data: function (d) { return d['rt_count']; },
                defaultContent: ''
            },
            {
                targets: 4,
                data: function (d) { return d['likes_count'];},
                defaultContent: ''
            },
            {
                targets: 5,
                data: function (d) {
                    var p = d["polarity"];
                    if (p == "pos")
                        return '<span style="color: green;">Positive</span>' ;
                    else
                        return '<span style="color: red;">Negative</span>';
                },
                defaultContent: ''
            }
        ]
    };
    
    //initialize datatable
    datatable.dataTable(dataTableOptions);

    var polarity = 'both';

    function RefreshTable() {
            dc.events.trigger(function () {
                alldata = tableDimension.top(Infinity);
                var data = [];
                if (polarity != 'both'){
                    _.each(alldata, function (d) {
                        if(d['polarity'] === polarity){
                            data.push(d);
                        }
                    });
                }
                else
                    data = alldata;
                
                datatable.fnClearTable();
                datatable.fnAddData(data);
                datatable.fnDraw();
                drawMap();
            });
    }

    
    //filter all charts when using the datatables search box
     $(":input").on('keyup',function(){
        text_filter(tableDimension, this.value);
        function text_filter(dim,q){
             if (q!='') {
                dim.filter(function(d){
                    return d["text"].indexOf (q.toLowerCase()) !== -1;
                });
            } else {
                dim.filterAll();
                }
            RefreshTable();
        dc.redrawAll();}
    });


    // - Render
    RefreshTable();
    dc.renderAll();
    drawMap();



    // Update map and table when any filter is applied

    var dcCharts = [timeChart, freqTermsChart, mentionsChart, hashtagsChart];

	_.each(dcCharts, function (dcChart) {
	    dcChart.on("filtered", function (chart, filter) {
	       RefreshTable();
	       drawMap();
	    });
	});

    // Remove empty rows before redraw
    var freqCharts = [freqTermsChart, mentionsChart, hashtagsChart];

    _.each(freqCharts, function (dcChart) {
        dcChart.on("preRedraw", function (chart, filter) {
            dcChart.group(remove_empty_bins(dcChart.group()));
            
        });
    });


    // Animation
    var endDate = new Date();
    endDate.setDate(maxDate.getDate());
    endDate.setTime(maxDate.getTime());

    var startDate = new Date();
    startDate.setDate(minDate.getDate());
    startDate.setTime(minDate.getTime());

    maxDate.setDate(minDate.getDate());
    maxDate.setTime(minDate.getTime());

    var paused = true;

    freqTermsChart.on("postRedraw", nextStep);

    function nextStep(){
    	if(!paused)
    	   step();
    };

    function step(){   
        maxDate.setMinutes(maxDate.getMinutes()+stepLength);
        timeChart.filterAll();
        timeChart.filter(dc.filters.RangedFilter(minDate, maxDate));
        dc.redrawAll();
        if(endDate <= maxDate)
            paused = true;
    };

    $("#playButton").click(function(){
        paused = false;


        if(timeChart.filters().length == 0){
            maxDate.setDate(startDate.getDate())
            maxDate.setTime(startDate.getTime())
            minDate.setDate(startDate.getDate());
            minDate.setTime(startDate.getTime());
        }
        else{
            maxDate = timeChart.filters()[0][1];
            minDate = timeChart.filters()[0][0];      
        }
        
        step(); 
    });

    
    document.getElementById("pauseButton").onclick = function() {
    	paused = true;
       
    };


	window.onresize = function(event) {
	  var newWidthTimeChart = document.getElementById('timeBox').offsetWidth;
	  var newWidthFreqChart = document.getElementById('freqBox').offsetWidth;
	  var newWidthMentions = document.getElementById('mentionsBox').offsetWidth;
	  
	  freqTermsChart.width(newWidthFreqChart).transitionDuration(0);
	  mentionsChart.width(newWidthMentions).transitionDuration(0);
	  hashtagsChart.width(newWidthMentions).transitionDuration(0);
	  
	  dc.renderAll();
	 
	  freqTermsChart.transitionDuration(200);
	  mentionsChart.transitionDuration(200);
	  hashtagsChart.transitionDuration(200);
	};


	function drawMap(){

	    markerClusters.clearLayers();
        map.removeLayer(legend);

        var markers = L.AwesomeMarkers.icon({
            
            icon: "twitter",
            prefix: "fa",
            markerColor: 'darkblue'

        });

        
 
        var count = 0;
  

	    _.each(allDim.top(Infinity), function (d) {

	    	if(d['geo'] !== 0 && (d['polarity'] === polarity || polarity === 'both') ){

	    		var geo = d['geo'];
                count++;

		        var lat = geo['geometry']['coordinates'][0];
	            var lon = geo['geometry']['coordinates'][1];

	            var imageUrl = geo.properties.image; 

	            var user = "<b> "+d['name']+
	                        "</b><span style='font-size: 85%;color:grey;'>"+
	                        " @"+d['user']+"</span>";

	            var text = d['text']
	                .replace(/#(\w+)/g, '<span style="color: darkblue;">$&</span>')
	                .replace(/@(\w+)/g, '<span style="font-weight: bold;">$&</span>');

                var date = "<span style='text-align:right; font-size:85%'>"+d['timestamp'].toString().slice(8,24)+"</span>"

	            var rt = "<span style='font-size: 100%;color:grey;'>"+
	                        "</br>"+d['rt_count']+" retweets - "+d['likes_count']+" likes</span>";

	            var content = "<div class='tweet-popup'>"+
	                                "<div class='profile-img'><object data="+imageUrl+" type='image/png' >"+
	                                        "<img src='./static/css/profile-placeholder.png' /> </object>"+
	                          "</div>"+
	                                "<div class='tweet-content'>"+
	                                    "<h5 class='tweet-user'>"+user+"<br>"+date+"</h5>"+
	                                    "<p class='tweet-text'>"+text+rt+"</p></div>";

	            
	            var m = L.marker([lon, lat], {icon: markers}).bindPopup(content);
	            markerClusters.addLayer(m);
	        	   	 	
        	}


	    });

        legend.onAdd = function (map){

            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML += "<i>"+count+"</i>" + " tweets on the map"

            return div;
        };


        legend.addTo(map);
	    markerClusters.addTo(map);
        

	};

	document.getElementById("radioBoth").onclick = function() {
		

		numberTweets.group(all);
        timeChart.showStack("Positive").showStack("Negative");
		freqTermsChart.group(freqTermGroup);
		mentionsChart.group(mentionsGroup);
		hashtagsChart.group(hashtagsGroup);
        polarity = 'both';
        RefreshTable();
        drawMap();
		dc.renderAll();

	}
	document.getElementById("radioPos").onclick = function() {
		
		timeChart.hideStack("Negative");
        timeChart.showStack("Positive");
        freqTermsChart.group(freqTermGroupPos);
        mentionsChart.group(mentionsGroupPos);
        hashtagsChart.group(hashtagsGroupPos);
		numberTweets.group(allPos);
        polarity = 'pos';

        RefreshTable();
        drawMap();
		dc.renderAll();
	}

	document.getElementById("radioNeg").onclick = function() {
		
		timeChart.hideStack("Positive");
        timeChart.showStack("Negative");
        freqTermsChart.group(freqTermGroupPos);
        mentionsChart.group(mentionsGroupPos);
        hashtagsChart.group(hashtagsGroupPos);
        numberTweets.group(allNeg);
        polarity = 'neg';
        RefreshTable();
        drawMap();
        dc.renderAll();
	}
    
    document.getElementById("polarityCheck").onclick = function() {
        var x = document.getElementById('polarityOptions');
        var all = document.getElementById('time-chart');

        if ($('#polarityCheck').prop('checked')) {
            x.style.display = "block";
            timeChart
                .group(ydim, "Positive", sel_stack('pos'))
                .ordinalColors(['#009933','#cc3300'])
                .stack(ydim, 'Negative', sel_stack('neg'))
                //.hidableStacks(true)
                .legend(dc.legend().x(800).y(10).itemHeight(15).gap(5));
            timeChart.render();

            freqTermsChart.bars[0].color("rgb(0, 255, 0)");

        } else {
            x.style.display = "none";
            document.getElementById("radioBoth").click();
            timeChart
                .legend(dc.legend().x(2000).y(10).itemHeight(15).gap(5))
                .colors('#6baed6');   
            timeChart.render();
        }   
    };

    // Sliders

    var max = 6,
    min = 0,
    step2 = 1,
    output = $('#output').text(5);

    var values = [1,5,10,15,20,25,30]

    $("#range-slider")
        .attr({'max': max, 'min':min, 'step': step2,'value': 1})
        .on('input change', function() {
           output.text(values[this.value]);
           stepLength = values[this.value];
        });



	
}

// Round to multiple of x
function roundX(x, valor){
    return Math.ceil(valor/x)*x;
}


document.getElementById("configButton").onclick = function() {
    var x = document.getElementById('myDropdown');
    if (x.style.display == 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
};


jQuery("input#inputFile").change(function () {
    $("#contentbox").css('display','inline');
    var filename = $('input[type=file]')[0].files[0].name;
    queue().defer(d3.json, 'static/'+filename).await(makeGraphs);
    $("#inputFile").css('display','none');
    $("#reload").css('display','block');
    $("#title").text("#"+filename.slice(0,filename.length-5));

});

$("#reload").click(function(){
    location.reload();
});


