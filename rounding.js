/**
 * Rounding to n decimal places
 * Copyright (C) 2015 Christopher Williams.
 * This is distributed under the terms of the Apache License,
 *   http://www.apache.org/licenses/LICENSE-2.0
 * in the hope that you may find it useful.
 */
 
(function(window) {
    "use strict"
    // Rounding algorithms
    var _ralgs = {
        HALF_UP : 0,
        AWAY_FROM_0 : 1,
        TO_EVEN : 2
    },
    // Padding function
    _pad = function(s, padTo, padWith, right) {
        s = s + '';
        var pad = "", toPad = Math.max(padTo, s.length) - s.length;
        while (toPad) {
            if (toPad & 1) {
                pad += padWith;
            }
            toPad >>>= 1;
            if (toPad) {
                padWith += padWith;
            }
        }
        return right ? s + pad : pad + s;
    },
    // Stringifies numbers, paying attention to very large and very small quantities
    _toString = function(n) {
        var parts = n.toExponential().split("e"), mag = parseInt(parts[1], 10), 
            _n = parts[0];
        parts = _n.split(".");
        var iPart = parts[0], dPart = parts[1] || "", sig, ret;
        if (n < 0) {
            iPart = iPart.substring(1, iPart.length);
            sig = '-';
        }
        if (mag > 0) {
            ret = iPart + dPart;
            if (ret.length < mag + 1) {
                // Pad to the right with zeroes
                ret = _pad(ret, mag + 1, '0', true);
            }
            else {
                // Need to insert the decimal place at the right point
                iPart = ret.substring(0, 1 + mag);
                dPart = ret.substring(1 + mag, ret.length);
                ret = iPart;
                if (dPart) {
                    ret += '.' + dPart;
                }
            }
        }
        else if (mag < 0) {
            mag = -mag;
            // 0.0 followed by mag-1 x '0' followed by iPart + dPart
            ret = _pad("0.", mag + 1, '0', true) + iPart + dPart;
        }
        else {
            return _n;
        }
        if (sig) {
            ret = sig + ret;
        }
        return ret;
    },
    // Applies minimum / maximum fractional digits
    _trimFraction = function(s, minFd, maxFd) {
        var splitPoint = s.indexOf('.'), i = s, j, f = "";
        if (splitPoint === -1 && minFd === 0) {
            return s;
        }
        if (null == minFd) {
            minFd = 0;
        }
        if (null == maxFd) {
            maxFd = 2;
        }
        if (splitPoint >= 0) {
            f = s.substring(splitPoint + 1, s.length);
            i = s.substring(0, splitPoint);
        }
        if (minFd) {
            // Add trailing zeroes
            for (j = f.length; j < minFd; j++) {
                f += '0';
            }
        }
        else {
            // Trim excess seroes
            f = f.substring(minFd, maxFd).replace(/0+$/, "");
        }
        if (f) {
            return i + '.' + f;
        }
        return i;
    },
    // The numeric value of the '0' character
    _zero = '0'.charCodeAt(0),
    // For suppressing -0
    _likeZero = /^0(?:\.0*)?$/,
    // Numerically increments a string
    _incStr = function(s, pos) {
        if (pos >= 0) {
            var p1 = s.substring(0, pos), p2 = s.substring(pos, pos + 1);
            if ('.' === p2.charAt(0)) {
                return _incStr(p1, pos - 1) + '.';
            }
            var d = s.charCodeAt(pos) - _zero + 1;            
            if (d >= 10) {
                d -= 10;
                // Carry 1
                p1 = _incStr(p1, pos - 1);
            }
            p2 = String.fromCharCode(d + _zero);
            return p1 + p2;
        }
        // We've incremented off the left edge of the string so do the final carry
        return '1' + s;
    },
    // Implementation of round to plus infinity (exact)
    _round2PlusInfinity = function(n, fd) {
        var s = _toString(Math.abs(n)),
            pos = s.indexOf('.');
        // _toString gives x or x.yyy not .yyy
        if (pos >= 1) {
            var nd = s.length, rpos = pos + fd + 1;
            if (rpos < nd) {
                var d = s.charCodeAt(rpos) - _zero, up = d >= 5;
                if (d === 5 && n < 0) {
                    up = false;
                }                
                if (up) {
                    // Round up
                    s = _incStr(s.substring(0, rpos), rpos - 1);
                }
                else {
                    // Simply truncate
                    s = s.substring(0, rpos);
                }
            }
        }
        if (n < 0 && !_likeZero.test(s)) {
            s = '-' + s;
        }
        return s;
    },
    // Implementation of round half to even (exact)
    _roundTowardsEven = function(n, fd) {
        var neg = false;
        if (n < 0) {
            // Round half to even is symmetric
            neg = true;
            n = -n;
        }
        var s = _toString(Math.abs(n));
        var pos = s.indexOf('.');
        if (pos >= 1) {
            var nd = s.length, rpos = pos + fd + 1;
            if (rpos < nd) {
                var d = s.charCodeAt(rpos) - _zero, up = d > 5;
                if (d === 5) {
                    // Check the previous digit
                    var c, _rp = rpos, _d;
                    do {
                        c = s.charAt(--_rp);
                    }
                    while (c === '.');
                    _d = s.charCodeAt(_rp) - _zero + 1;
                    // Up if the previous digit will be even
                    up = (0 === _d % 2);
                }                
                if (up) {
                    // Round up
                    s = _incStr(s.substring(0, rpos), rpos - 1);
                }
                else {
                    // Simply truncate
                    s = s.substring(0, rpos);
                }
            }
        }
        if (neg && !_likeZero.test(s)) {
            s = '-' + s;
        }
        return s;
    },
    // Implementation of round half away from zero
    _roundAwayFromZero = function(n, fd) {
        if (n >= 0) {
            return _round2PlusInfinity(n, fd);
        }
        return '-' + _round2PlusInfinity(-n, fd);
    },
    // Rounding function with algorithm specified
    _round = function(n, fd, alg) {
        fd >>>= 0;
        switch (alg) {
            case _ralgs.HALF_UP:
                return _round2PlusInfinity(n, fd);
                
            case _ralgs.AWAY_FROM_0:
                return _roundAwayFromZero(n, fd);
                
            default:
                return _roundTowardsEven(n, fd);
        }
    };
    
    // Algorithm specification
    window.Rounding = {
        HALF_TO_PLUS_INFINITY : _ralgs.HALF_UP,
        HALF_AWAY_FROM_ZERO : _ralgs.AWAY_FROM_0,
        HALF_TO_EVEN : _ralgs.TO_EVEN,
        // Default rounding method is ROUND_HALF_TO_EVEN
        algorithm : _ralgs.TO_EVEN
    };
    
    // Add a roundTo method to Number
    var rt = function(maxFd, minFd) {
        if (!isFinite(this)) {
            return this + '';
        }
        // Require numbers >= 0
        maxFd = Number(maxFd);
        minFd = Number(minFd);
        if (!(isFinite(maxFd) && maxFd >= 0)) {
            maxFd = 0;
        }
        if (!(isFinite(minFd) && minFd >= 0)) {
            minFd = 0;
        }
        if (minFd > maxFd) {
            minFd = maxFd;
        }
        return _trimFraction(_round(this, maxFd, window.Rounding.algorithm), minFd, maxFd);
    }, mName = "roundTo", obj = window.Number.prototype;
    if (!(mName in obj)) {
        try {
            Object.defineProperty(obj, mName, {
                 value : rt,
                 enumerable : false
            });
        }
        catch(e) {
            // Do it the old fashioned way
            obj[mName] = rt;
        }
    }

})(this);