var annotationCache = {};

// Convenience
Arrow.db = (f, db) => new DBArrow(f, db);
Arrow.PiChart = (conf, fn, elem) => new ChartArrow(conf, fn, new PieChart(elem));
Arrow.BarChart = (conf, fn, elem) => new ChartArrow(conf, fn, new BarChart(elem));

class LiftedArrow extends Arrow {
    constructor(f) {
        if (!(f instanceof Function)) {
            throw new Error('Cannot lift non-function');
        }

        super(_construct(() => {
            var start = window.performance.now();

            var s = f.toString();
            var i = s.indexOf('/*');
            var j = s.indexOf('*/', i + 1);
            var c = s.substring(i + 2, j);

            if (annotationCache[c] !== undefined) {
                var parsed = annotationCache[c];
            } else {
                var comment;
                try {
                  comment = c.match(/\@arrow :: (.*)\n?/)[1]
                } catch (err) {
                  if (typecheck) {
                    console.warn('Function being lifted does not contain an @arrow annotation');
                  }

                  comment = '_ ~> _';
                }

                try {
                  parsed = parser.parse(comment);
                } catch (err) {
                  throw new ComposeError(`Function being lifted does not contain a parseable @arrow annotation.\n${err.message}\n`);
                }

                annotationCache[c] = parsed;
            }

            var elapsed = window.performance.now() - start;
            numannotations++;
            annotationParseTime += elapsed;

            var arg = parsed[0];
            var out = parsed[1];
            var ncs = new ConstraintSet([]).addAll(parsed[2][0]);

            return new ArrowType(arg, out, ncs, parsed[2][1]).sanitize();
        }));

        this.f = f;
    }

    call(x, p, k, h) {
        try {
            // If the function has more than one parameter and we have
            // an array argument, spread the elements. Else, just call
            // the function with a single argument.

            if (x && x.constructor === Array && this.f.length > 1) {
                var result = this.f.apply(null, x);
            } else {
                var result = this.f(x);
            }

            _check(this.type.out, result);
        } catch (err) {
            return h(err);
        }

        k(result);
    }

    equals(that) {
        return that instanceof LiftedArrow && this.f === that.f;
    }
}

class ElemArrow extends LiftedArrow {
    constructor(selector) {
        super(() => {
            /* @arrow :: _ ~> Elem */
            return $(selector);
        });

        this.selector = selector;
    }

    equals(that) {
        return that instanceof ElemArrow && this.selector === that.selector;
    }
}

//
// Simple Asynchronous Arrow Implementation
//

class SimpleAsyncArrow extends Arrow {
    isAsync() {
        return true;
    }
}

// Simple Asynchronous Arrow that takes in a config object

class SimpleConfigBasedAsyncArrow extends SimpleAsyncArrow {
     constructor(f, errorType) {
        super(_construct(() => {
            var start = window.performance.now();

            var s = f.toString();
            var i = s.indexOf('/*');
            var j = s.indexOf('*/', i + 1);
            var c = s.substring(i + 2, j);

            var ncs = new ConstraintSet([]);
            var err = [new NamedType(errorType)];

            if (annotationCache[c] !== undefined) {
                var conf = annotationCache[c][0];
                var resp = annotationCache[c][1];
            } else {
                try {
                    var conf = parser.parse(c.match(/\@conf :: (.*)\n?/)[1]);

                    ncs = ncs.addAll(conf[1][0]);
                    err = err.concat(conf[1][1]);
                } catch (err) {
                  throw new ComposeError(`Config does not contain a parseable @conf annotation.\n${err.message}\n`)
                }

                try {
                    var resp = parser.parse(c.match(/\@resp :: (.*)\n?/)[1]);

                    ncs = ncs.addAll(resp[1][0]);
                    err = err.concat(resp[1][1]);
                } catch (err) {
                  throw new ComposeError(`Config does not contain a parseable @resp annotation.\n${err.message}\n`)
                }

                annotationCache[c] = [conf, resp];
            }

            var elapsed = window.performance.now() - start;
            numannotations++;
            annotationParseTime += elapsed;

            return new ArrowType(conf[0], resp[0], ncs, err).sanitize();
        }));

        this.c = f;
    }
}

class AjaxArrow extends SimpleConfigBasedAsyncArrow {
    
	constructor(f, db) {
        super(f, 'AjaxError');
	}
	
    call(x, p, k, h) {
        // If the function has more than one parameter and we have
        // an array argument, spread the elements. Else, just call
        // the function with a single argument.

        // TODO - wrap this in try

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

        $.ajax($.extend(conf, {
            success: (x, status, xhr) => { if (!abort) { p.advance(cancelerId); succ(x); } },
            error  : (xhr, status, x) => { if (!abort) { p.advance(cancelerId); fail(x); } },
        }));

        var cancelerId = p.addCanceler(cancel);
    }

    equals(that) {
        // TODO - deep comparison of objects
        return that instanceof AjaxArrow && this.config === that.config;
    }
}

class DBArrow extends SimpleConfigBasedAsyncArrow {

    constructor(f, db) {
        super(f, 'QueryError');
        this.db = db;
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
        };

        const fail = h;
        const succ = x => {
            _check(this.type.out, x);
            k(x);
        };
        this.db.query(conf.query, conf.param, function (err, rows) {
            if (err) {
                if (!abort) {
                    p.advance(cancelerId);
                    fail(err);
                }
            } else {
                if (!abort) {
                    p.advance(cancelerId);
                    succ(rows);
                }
            }
        });
        var cancelerId = p.addCanceler(cancel);
    }

    equals(that) {
        return that instanceof DBArrow && this.config === that.config;
    }
}

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

    call(x) {
        if (x && x.constructor === Array && this.c.length > 1) {
            var conf = this.c.apply(null, x);
        } else {
            var conf = this.c(x);
        }
		var transformerFn = this.fn;
		var chart = this.chart;

		google.charts.load('current', {'packages' : ['corechart']});
		google.charts.setOnLoadCallback(function() {
			var elem = document.getElementById(conf.elem);
			var data = google.visualization.arrayToDataTable(transformerFn.call(this, conf.data, conf.x));

			chart.chart().draw(data, conf.chart_options);
		});

    }

    equals(that) {
        return that instanceof DBArrow && this.config === that.config;
    }
}
class EventArrow extends SimpleAsyncArrow {
    constructor(name) {
        // Elem ~> Event
        super(_construct(() => new ArrowType(new NamedType('Elem'), new NamedType('Event'))));
        this.name = name;
    }

    call(x, p, k, h) {
        let abort = false;

        const cancel = () => {
            abort = true;
            x.off(this.name, runner);
        };

        const runner = ev => {
            if (!abort) {
                cancel();
                p.advance(cancelerId);
                k(ev);
            }
        };

        x.on(this.name, runner);
        var cancelerId = p.addCanceler(cancel);
    }

    equals(that) {
        return that instanceof EventArrow && this.name === that.name;
    }
}

class DynamicDelayArrow extends SimpleAsyncArrow {
    constructor() {
        // Number ~> _
        super(_construct(() => {
            return new ArrowType(new NamedType('Number'), new TopType());
        }));
    }

    call(x, p, k, h) {
        const cancel = () => clearTimeout(timer);
        const runner = () => {
            p.advance(cancelerId);
            k();
        };

        var timer = setTimeout(runner, x);
        var cancelerId = p.addCanceler(cancel);
    }

    equals(that) {
        return that instanceof DynamicDelayArrow;
    }
}

class DelayArrow extends SimpleAsyncArrow {
    constructor(duration) {
        // 'a ~> 'a
        super(_construct(() => {
            var alpha = ParamType.fresh();
            return new ArrowType(alpha, alpha);
        }));

        this.duration = duration;
    }

    call(x, p, k, h) {
        const cancel = () => clearTimeout(timer);
        const runner = () => {
            p.advance(cancelerId);
            k(x);
        };

        var timer = setTimeout(runner, this.duration);
        var cancelerId = p.addCanceler(cancel);
    }

    equals(that) {
        return that instanceof Delay && this.duration === that.duration;
    }
}

//
// Simple (Generalized) Arrows
//

class SplitArrow extends Arrow {
    constructor(n) {
        super(_construct(() => {
            var arg = ParamType.fresh();
            var out = Array.create(n, arg);

            return new ArrowType(arg, new TupleType(out));
        }));

        this.n = n;
    }

    call(x, p, k, h) {
        // TODO - clone values
        k(Array.create(this.n, x));
    }

    equals(that) {
        return that instanceof SplitArrow && this.n === that.n;
    }
}

class NthArrow extends Arrow {
    constructor(n) {
        super(_construct(() => {
            var arg = Array.create(n).map(() => ParamType.fresh());
            var out = arg[n - 1];

            return new ArrowType(new TupleType(arg), out);
        }));

        this.n = n;
    }

    call(x, p, k, h) {
        k(x[this.n - 1]);
    }

    equals(that) {
        return that instanceof NthArrow && this.n === that.n;
    }
}