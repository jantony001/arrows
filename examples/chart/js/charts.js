function drawCharts() {
	Arrow.seq([load,
			Arrow.fanout([
					pieChart,
					barChart])]).run();
}

var transformationFn = function (rows, x) {
	var dataArr = [[x, 'count']],
	dataMap = {};
	rows.forEach(function (data) {
		var prop = dataMap[data[x]];
		if (!prop) {
			prop = 0;
		}
		dataMap[data[x]] = ++prop;
	});
	Object.keys(dataMap).forEach(function (key) {
		dataArr.push([key, dataMap[key]]);
	});
	return dataArr;
};

var pieChart = Arrow.PiChart(function (resp) {
		/* @conf :: { data: [_] }
		 * @resp :: _ */
		return {
			'data' : resp.data,
			'chart_options' : {
				title : 'Race Count Pie Chart'
			},
			'x' : 'race'
		}
	}, transformationFn, 'piechart');

var barChart = Arrow.BarChart(function (resp) {
		/* @conf :: { data: [_] }
		 * @resp :: _ */
		return {
			'data' : resp.data,
			'chart_options' : {
				title : 'Age Count Bar Chart'
			},
			'x' : 'age'
		}
	}, transformationFn, 'barchart');

//var load = new AjaxArrow(function (page) {
//		/**
//		 * @conf :: Number
//		 * @resp :: { data: [_] }
//		 */
//		return {
//			'url' : '../data/encounter.json',
//			'dataType' : 'json'
//		};
//});

var load = new LiftedArrow(function() {
	/* @arrow :: _ ~> { data: [_] }  */
	return {
		data:[{
			"id" : 61807848,
			"name" : "Patient Name",
			"encounter_num" : 45180,
			"age" : 69,
			"race" : "White",
			"date" : "2016-12-23T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 6405627,
			"name" : "Patient Name",
			"encounter_num" : 19977,
			"age" : 68,
			"race" : "White",
			"date" : "2016-08-04T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 12307052,
			"name" : "Patient Name",
			"encounter_num" : 1943,
			"age" : 65,
			"race" : "African American",
			"date" : "2016-04-11T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 13325309,
			"name" : "Patient Name",
			"encounter_num" : 66621,
			"age" : 79,
			"race" : "White",
			"date" : "2016-04-05T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 89657497,
			"name" : "Patient Name",
			"encounter_num" : 78657,
			"age" : 50,
			"race" : "Pacific Islander",
			"date" : "2016-09-18T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 2579877,
			"name" : "Patient Name",
			"encounter_num" : 84531,
			"age" : 76,
			"race" : "African American",
			"date" : "2016-08-23T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 28920822,
			"name" : "Patient Name",
			"encounter_num" : 3700,
			"age" : 55,
			"race" : "White",
			"date" : "2016-07-14T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 52915108,
			"name" : "Patient Name",
			"encounter_num" : 74333,
			"age" : 66,
			"race" : "African American",
			"date" : "2016-04-15T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 13113903,
			"name" : "Patient Name",
			"encounter_num" : 74710,
			"age" : 59,
			"race" : "Hispanic",
			"date" : "2016-05-17T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 18259908,
			"name" : "Patient Name",
			"encounter_num" : 71435,
			"age" : 69,
			"race" : "African American",
			"date" : "2016-11-20T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 91770313,
			"name" : "Patient Name",
			"encounter_num" : 94817,
			"age" : 58,
			"race" : "White",
			"date" : "2016-10-07T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 27686468,
			"name" : "Patient Name",
			"encounter_num" : 15243,
			"age" : 65,
			"race" : "Hispanic",
			"date" : "2016-12-24T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 90929259,
			"name" : "Patient Name",
			"encounter_num" : 91208,
			"age" : 77,
			"race" : "White",
			"date" : "2016-02-02T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 48883867,
			"name" : "Patient Name",
			"encounter_num" : 3029,
			"age" : 78,
			"race" : "African American",
			"date" : "2016-11-27T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 9463601,
			"name" : "Patient Name",
			"encounter_num" : 50542,
			"age" : 57,
			"race" : "American Indian",
			"date" : "2016-04-21T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 22452713,
			"name" : "Patient Name",
			"encounter_num" : 74679,
			"age" : 66,
			"race" : "White",
			"date" : "2016-09-13T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 86621568,
			"name" : "Patient Name",
			"encounter_num" : 13781,
			"age" : 78,
			"race" : "Hispanic",
			"date" : "2016-11-24T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 33340087,
			"name" : "Patient Name",
			"encounter_num" : 64865,
			"age" : 51,
			"race" : "African American",
			"date" : "2016-11-23T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 14014492,
			"name" : "Patient Name",
			"encounter_num" : 36056,
			"age" : 57,
			"race" : "African American",
			"date" : "2016-12-07T05:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 40199412,
			"name" : "Patient Name",
			"encounter_num" : 59444,
			"age" : 78,
			"race" : "White",
			"date" : "2016-09-05T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}, {
			"id" : 5518793,
			"name" : "Patient Name",
			"encounter_num" : 68886,
			"age" : 73,
			"race" : "American Indian",
			"date" : "2016-10-10T04:00:00.000Z",
			"rxnorm" : ["1303851"]
		}]
	}

});


drawCharts();