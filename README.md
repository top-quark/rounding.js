# rounding.js
Exact rounding to a specified number of decimal places with a choice of rounding algorithms

## Usage

<code>toFixed</code> produces incorrect output for a large number of inputs. In contrast,
the <code>roundTo</code> method provided by rounding.js implements an algorithm that 
produces correct and exact results. To compare:
<pre>(1.015).toFixed(2); // 1.01
(1.015).roundTo(2); // 1.02</pre>

Unlike <code>toFixed</code>, <code>roundTo</code> handles arbitrarily large and small inputs:
<pre>(1.15e-26).toFixed(27); // browser-dependent; an exception is likely
(1.15e-26).roundTo(27); // 0.000000000000000000000000012</pre>

rounding.js offers a choice of algorithms. The default is round half to even, but this
behaviour can be overridden by setting the <code>Rounding.algorithm</code> property:
<pre>// Default algorithm is Rounding.HALF_TOWARDS_EVEN
(1.25e-26).roundTo(27); // 0.000000000000000000000000012
Rounding.algorithm = Rounding.HALF_TO_PLUS_INFINITY
(1.25e-26).roundTo(27); // 0.000000000000000000000000013</pre>

<code>Rounding.HALF_TO_PLUS_INFINITY</code> is what <code>Math.round</code> uses. To get
output similar to <code>toFixed</code> set the algorithm to <code>Rounding.HALF_AWAY_FROM_ZERO</code>

By default, <code>roundTo</code> suppresses trailing zeroes. You can override this with
a second parameter specifying the minimum number of fractional digits:
<pre>(1.1).roundTo(2);   // 1.1
(1.1).roundTo(2, 2); // 1.10</pre>
