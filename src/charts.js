Arrow.PiChart = (conf, fn, elem) => new ChartArrow(conf, fn, new PieChart(elem));
Arrow.BarChart = (conf, fn, elem) => new ChartArrow(conf, fn, new BarChart(elem));


class Chart {
	constructor (elem) {
		this.elem = elem;
	}
	chart(){}
}

class PieChart extends Chart {
	chart() {
		return new google.visualization.PieChart(document.getElementById(this.elem));
	}
}

class BarChart extends Chart {
	chart() {
		return new google.visualization.BarChart(document.getElementById(this.elem));
	}
}

class ChartArrow extends SimpleConfigBasedAsyncArrow {

    constructor(f, fn, chart) {
        super(f, 'QueryError');
		this.fn = fn;
		this.chart = chart;
    }

    call(x, p, k, h) {
        if (x && x.constructor === Array && this.c.length > 1) {
            var conf = this.c.apply(null, x);
        } else {
            var conf = this.c(x);
        }
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
			var elem = document.getElementById(conf.elem);
			var data = google.visualization.arrayToDataTable(transformerFn.call(this, conf.data, conf.x));

			chart.chart().draw(data, conf.chart_options);
			 if (!abort) {
                    p.advance(cancelerId);
                    succ(conf.data);
            }
		});
        var cancelerId = p.addCanceler(cancel);
    }

    equals(that) {
        return that instanceof ChartArrow && this.config === that.config;
    }
}