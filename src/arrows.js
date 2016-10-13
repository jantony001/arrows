var numarrows = 0;
var numannotations = 0;
var typecheck = true;

function construct(f) {
    if (typecheck) {
        return f();
    } else {
        return new ArrowType(new TopType(), new TopType());
    }
}

Array.create = function(length, value) {
    var arr = [];
    while (--length >= 0) {
        arr.push(value);
    }

    return arr;
}

Array.copy = function(array) {
    return [].slice.call(array);
}

Array.prototype.unique = function() {
    return this.filter((v, i, s) => s.indexOf(v) === i);
}

Function.prototype.lift = function() {
  return new LiftedArrow(this);
}

Number.prototype.lift = function() {
  var value = this.valueOf();

  return new LiftedArrow(function() {
      /* @arrow :: _ ~> Number */
      return value;
  });
}

class Arrow {
    constructor(type) {
        numarrows++;
        this.type = type;
    }

    call(x, p, k, h) {
        throw new Error('Call undefined')
    }

    equals(that) {
        throw new Error('Equals undefined')
    }

    toString() {
        return this.constructor.name + ' :: ' + this.type.toString();
    }

    isAsync() {
        return false;
    }

    run() {
        var p = new Progress(true);
        this.call(null, p, () => {}, err => { throw err; });
        return p;
    }

    // Combinator constructors

    noemit() {
        return Arrow.noemit(this);
    }

    seq(/* ...arrows */) {
        return Arrow.seq([this].concat(Array.copy(arguments)));
    }

    any(/* ...arrows */) {
        return Arrow.any([this].concat(Array.copy(arguments)));
    }

    all(/* ...arrows */) {
        return Arrow.all([this].concat(Array.copy(arguments)));
    }

    try(success, failure) {
        return Arrow.try(this, success, failure);
    }

    // Convenience API

    lift() {
      return this;
    }

    wait(duration) {
        return this.seq(new Delay(duration));
    }

    after(duration) {
        return new Delay(duration).seq(this);
    }

    triggeredBy(selector, event) {
        return new ElemArrow(selector).seq(new EventArrow(event)).remember().seq(this);
    }

    then(success, failure) {
        if (failure === undefined) {
            return this.seq(success);
        } else {
            return this.try(success, failure);
        }
    }

    catch(failure) {
        return this.then(Arrow.id(), failure);
    }

    // Data Routing

    split(n) {
        return this.seq(new SplitArrow(n));
    }

    nth(n) {
        return this.seq(new NthArrow(n));
    }

    fanout(/* ...arrows */) {
        return Arrow.fanout([this].concat(Array.copy(arguments)));
    }

    tap(/* ...functions */) {
      var a = this;
      for (var i = 0; i < arguments.length; i++) {
        a = a.seq(arguments[i].lift().remember());
      }

      return a;
    }

    on(name, handler) {
        return this.seq(new SplitArrow(2), Arrow.id().all(new EventArrow(name)), handler);
    }

    remember() {
        return this.carry().nth(1);
    }

    carry() {
        return new SplitArrow(2).seq(Arrow.id().all(this));
    }

    // Repeating

    repeat() {
        return Arrow.fix(a => this.wait(0).seq(Arrow.try(Arrow.repeatTail(), a, Arrow.id())));
    }

    forever() {
        return this.seq(Arrow.reptop()).repeat();
    }

    whileTrue() {
        return this.carry().seq(Arrow.repcond()).repeat();
    }
}

// Unary combinators
Arrow.noemit = arrow => new NoEmitCombinator(arrow);

// N-ary combinators
Arrow.seq    = arrows    => new SeqCombinator(arrows);
Arrow.any    = arrows    => new AnyCombinator(arrows);
Arrow.all    = arrows    => new AllCombinator(arrows);
Arrow.try    = (a, s, f) => new TryCombinator(a, s, f);
Arrow.fanout = arrows    => new SplitArrow(arrows.length).seq(Arrow.all(arrows));

// Convenience
Arrow.repeat = a          => a.repeat();
Arrow.bind   = (event, a) => Arrow.seq([new SplitArrow(2), Arrow.id().all(new EventArrow(event)), a]);
Arrow.catch  = (a, f)     => Arrow.try(a, Arrow.id(), f);

// Built-ins
Arrow.id         = () => new LiftedArrow(x => /* @arrow :: 'a ~> 'a */ x);
Arrow.reptop     = () => new LiftedArrow(x => /* @arrow :: 'a ~> <loop: _, halt: _> */ Arrow.loop(null));
Arrow.repcond    = () => new LiftedArrow((x, f) => /* @arrow :: ('a, Bool) ~> <loop: 'a, halt: _> */ f ? Arrow.loop(x) : Arrow.halt(null));
Arrow.repcondInv = () => new LiftedArrow((x, f) => /* @arrow :: ('a, Bool) ~> <loop: 'a, halt: _> */ !f ? Arrow.loop(x) : Arrow.halt(null));
Arrow.throwFalse = () => new LiftedArrow(x => {
  /* @arrow :: Bool ~> _ \ ({}, {Bool}) */
  if (x) {
    throw x;
  }
});

Arrow.repeatTail = () => new LiftedArrow(x => {
    /* @arrow :: <loop: 'a, halt: 'b> ~> 'a \ ({}, {'b}) */
    if (x.hasTag('loop')) {
        return x.value();
    } else {
        throw x.value();
    }
});

class TaggedValue {
    constructor(tag, val) {
        this.tag = tag;
        this.val = val;
    }

    hasTag(tag) {
        return tag == this.tag;
    }

    value() {
        return this.val;
    }
}

// Utility Constructors
Arrow.loop = x => new TaggedValue('loop', x);
Arrow.halt = x => new TaggedValue('halt', x);

var _cancelerId = 0;

class Progress {
    constructor(canEmit) {
        this.canEmit = canEmit;
        this.cancelers = {};
        this.observers = [];
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    addCanceler(canceler) {
        var id = _cancelerId++;
        this.cancelers[id] = canceler;
        return id;
    }

    advance(cancelerId) {
        if (cancelerId != null) {
            this.cancelers[cancelerId] = null;
        }

        while (this.observers.length > 0) {
            var observer = this.observers.pop();

            if (this.canEmit) {
                observer();
            }
        }
    }

    cancel() {
        for (var id in this.cancelers) {
            if (this.cancelers[id] != null) {
                this.cancelers[id]();
            }
        }

        this.cancelers = {};
    }
}
