var endTime = function(startTime, expr) {
    switch (expr.tag)
    {
        case 'note':
            return startTime + expr.dur;
        case 'seq':
            return endTime(
                endTime(startTime, expr.left),
                expr.right);
        case 'par':
            return Math.max(endTime(startTime, expr.left),
                            endTime(startTime, expr.right));
    }
};


var compile2 = function(startTime, musexpr) {
    switch (musexpr.tag)
    {
        case 'note':
            return [{
                tag : 'note',
                pitch : musexpr.pitch,
                start : startTime,
                dur : musexpr.dur
            }];
            
        case 'seq':
            var noteLeft = compile2(startTime, musexpr.left);
            var timeLeft = endTime(startTime, musexpr.left);
            var noteRight = compile2(timeLeft, musexpr.right);
            return noteLeft.concat(noteRight);
            
        case 'par':
            return compile2(startTime, musexpr.left)
                .concat(compile2(startTime, musexpr.right));
    }
};

var compile = function (musexpr) {
    return compile2(0, musexpr);
};