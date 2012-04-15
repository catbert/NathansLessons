// gets end-time for an expression
var endTime = function (startTime, mexpr) {
    switch (mexpr.tag)
    {
        case 'note':
            return startTime + mexpr.dur;

        case 'rest':
            return startTime + mexpr.dur;

        case 'seq':
            return endTime(
                endTime(startTime, mexpr.left),
                mexpr.right
            );

        case 'par':
            return Math.max(endTime(startTime, mexpr.left),
                            endTime(startTime, mexpr.right));
    }
};

// converts a string-pitch into a midi number
var getMidi = function(pitch)
{
    if (typeof pitch == 'string') {
        var last = pitch.charAt(pitch.length - 1); // gets last letter
        var rest = pitch.substr(0, pitch.length - 1);
        var octave = 12 * (parseInt(last) + 2);
        var tone;

        switch (rest.toLowerCase()) {
            case 'c':
                tone = 0;
                break;
            case 'c#':
            case 'db':
                tone = 1;
                break;
            case 'd':
                tone = 2;
                break;
            case 'd#':
            case 'eb':
                tone = 3;
                break;
            case 'e':
                tone = 4;
                break;
            case 'f':
                tone = 5;
                break;
            case 'f#':
            case 'gb':
                tone = 6;
                break;
            case 'g':
                tone = 7;
                break;
            case 'g#':
            case 'ab':
                tone = 8;
                break;
            case 'a':
                tone = 9;
                break;
            case 'a#':
            case 'bb':
                tone = 10;
                break;
            case 'b':
                tone = 11;
                break;
        }

        return octave + tone;
    }
    else {
        return pitch;
    }
}

// compiles MUS expression, knowing when it starts
var compile2 = function (startTime, mexpr) {
    switch (mexpr.tag)
    {
        case 'note':
            return [{
                tag : 'note',
                pitch : getMidi(mexpr.pitch),
                start : startTime,
                dur : mexpr.dur
            }];

        case 'rest':
            return [{
                tag: 'rest',
                start: startTime,
                dur: mexpr.dur
            }];
            
        case 'seq':
            var noteLeft = compile2(startTime, mexpr.left);
            var timeLeft = endTime(startTime, mexpr.left);
            var noteRight = compile2(timeLeft, mexpr.right);
            return noteLeft.concat(noteRight);
            
        case 'par':
            return compile2(startTime, mexpr.left)
                .concat(compile2(startTime, mexpr.right));
    }
};

// repeats section count times
var repeatExpr = function (section, count) {
    switch (count) {
        case 0: // this is an error
            return { tag: 'error' };

        case 1: // repeat 1 time == no repeat
            return section;

        default: // returns a seq
            return {
                tag   : 'seq',
                left  : section,
                right : repeatExpr(section, count - 1)
            };
    }
};

var chordExpr = function (pitches, duration) {
    switch (pitches.length) {
        case 0: // this is an error
            return { tag: 'error' };

        case 1: // chord with 1 pitch is a note
            return {
                tag   : 'note',
                pitch : pitches[0],
                dur   : duration
            };

        default: // returns a par with recursion
            var head = [pitches.pop()];
            return {
                tag   : 'par',
                left  : chordExpr(head, duration),
                right : chordExpr(pitches, duration)
            };
    }
}

// simplifies MUS expression, leaving only notes, rests, seqs, and pars
var transform = function (mexpr) {
    switch (mexpr.tag) {
        // primitives do not change
        case 'note':
        case 'rest':
            return mexpr;

        // containers transform their items 
        case 'seq':
        case 'par':
            return {
                tag: mexpr.tag,
                left: transform(mexpr.left),
                right: transform(mexpr.right)
            };

        // repeats are transformed into seqs
        case 'repeat':
            return repeatExpr(transform(mexpr.section), mexpr.count);

        // chords are transformed into pars
        case 'chord':
            return chordExpr(mexpr.pitches, mexpr.dur);
    }
};

// compiles MUS program
var compile = function (mexpr) {
    return compile2(0, transform(mexpr));
};