Arrow.PieChart = (conf, fn, elem) => new ChartArrow(conf, fn, new PieChart(elem));
Arrow.BarChart = (conf, fn, elem) => new ChartArrow(conf, fn, new BarChart(elem));


class Chart {
	constructor (elem) {
		this.elem = elem;
		this.evts = {};
	}
	addListeners(evt, fn) {
		this.evts[evt] = fn;
	}
	on(evt, fn) {
		google.visualization.events.addListener(this.chartObj, evt, fn);
	}
	chart(){}
}

class PieChart extends Chart {
	chart() {
		this.chartObj = new google.visualization.PieChart(document.getElementById(this.elem));
		var me = this;
		Object.keys(this.evts).forEach(function (evt) {
			google.visualization.events.addListener(me.chartObj, evt, me.evts[evt]);
		});
		if(!window.charts) { window.charts = {}; }
		window.charts[this.elem] = this;
		return this.chartObj;
	}
}

class BarChart extends Chart {
	chart() {
		this.chartObj = new google.visualization.BarChart(document.getElementById(this.elem));
		return this.chartObj;
	}
}

class ChartArrow extends LiftedArrow {

	constructor(f, fn, chart) {
        super(() => {
            /* @arrow :: _ ~> Elem */
            return $(chart.elem);
        });
		this.f = f;
        this.fn = fn;
		this.chart = chart;
    }
	isAsync() {
        return true;
    }

    call(x, p, k, h) {
        var conf = this.f(x);
		let abort = false;

        const cancel = () => {
            abort = true;
        }

        const fail = h;
        const succ = x => {
            _check(this.type.out, x);
            k(x);
        };
		var transformerFn = this.fn;
		var chart = this.chart;

		google.charts.load('current', {'packages' : ['corechart']});
		google.charts.setOnLoadCallback(function() {
			var elem = document.getElementById(chart.elem);
			chart.data = google.visualization.arrayToDataTable(transformerFn.call(this, conf.data, conf.x));
			chart.chart().draw(chart.data, conf.chart_options);
			 if (!abort) {
                    p.advance(cancelerId);
                    succ($(chart.elem));
            }
		});
        var cancelerId = p.addCanceler(cancel);
    }
	on(evt, fn) {
		this.chart.addListeners(evt, fn);
		return this;
	}
    equals(that) {
        return that instanceof ChartArrow && this.config === that.config;
    }
}