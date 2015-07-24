"use strict";

var path = require('path');
var fs = require('fs-extra');
var byline = require('byline');
var util = require('util');
var stream = require('stream');
var Transform = stream.Transform;

var trim = function(str) {
	if (!str) {
		return str;
	}
	return str.replace(/^[\s\xA0]+/, '').replace(/[\s\xA0]+$/, '');
};


var parseColorFunction = function(colorFunc, result) {
	var startIdx = colorFunc.indexOf('(');
	var endIdx = colorFunc.lastIndexOf(')');

	var funcName = trim(colorFunc.substring(0, startIdx));
	var funcParams = trim(colorFunc.substring(startIdx + 1, endIdx));

	var lastComma = funcParams.lastIndexOf(',');
	var colorParam = funcParams.substring(0, lastComma);
	var valueParam = funcParams.substring(lastComma + 1, funcParams.length);

	colorParam = trim(colorParam);
	valueParam = trim(valueParam);

	if (colorParam.indexOf('lighten') >= 0 ||
		 colorParam.indexOf('darken') >= 0 ||
		 colorParam.indexOf('adjust-hue') >= 0) {
		parseColorFunction(funcParams, result);
		result.func.push({name: funcName, value: valueParam});
	} else {
		result.color = colorParam;
		result.func.push({name: funcName, value: valueParam});
	}
};

var isValidOperand = function(operand) {
	return operand[0] === '$' || !isNaN(parseFloat(operand, 10));
};

var processCalcExpression = function(line) {
	var openIdx = line.indexOf('(');
	var closeIdx = line.lastIndexOf(')');

	if (openIdx >= 0 && closeIdx > 0) {

		var firstLinePart = line.substring(0, openIdx + 1);
		var secondLinePart = line.substring(closeIdx, line.length);
		var exp = line.substring(openIdx + 1, closeIdx);

		var addOperatorIdx = exp.lastIndexOf('+');
		var subOperatorIdx = exp.lastIndexOf('-');
		var multOperatorIdx = exp.lastIndexOf('*');
		var divOperatorIdx = exp.lastIndexOf('/');
		var operatorIdx = Math.max(addOperatorIdx, subOperatorIdx, multOperatorIdx, divOperatorIdx);

		console.log('Check if we have a calc value for line : ' + line);
		console.log('firstLinePart: ' + firstLinePart);
		console.log('secondLinePart: ' + secondLinePart);
		console.log('exp: ' + exp);
		console.log('operatorIdx: ' + operatorIdx);

		if (operatorIdx > 0) {
			var operator = exp[operatorIdx];
			var operand1 = trim(exp.substr(0, operatorIdx));
			var operand2 = trim(exp.substr(operatorIdx + 1, exp.length));

			// Check operand is number or variable

			if (!isValidOperand(operand1) || operand1.indexOf(' ') > 0 || operand1.indexOf(',') >= 0 || operand1.indexOf('(') >= 0
					|| !isValidOperand(operand2) || operand2.indexOf(' ') > 0 || operand2.indexOf(',') >= 0 || operand2.indexOf('(') >= 0) {
				// ignore
				//console.log('ignore line: ' + line);
			} else {
				console.log('operator: ' + operator);
				console.log('operand1: ' + operand1);
				console.log('operand2: ' + operand2);

				if (operand1 && operand2 && operand1.length > 0 && operand2.length > 0) {
					line = firstLinePart + 'calc(' + operand1 + ' ' + operator + ' ' + operand2 + ')' + secondLinePart;

					console.log('line: ' + line);
				}
			}
		}
	}

	return line;
};

var ConvertToPostCSS = function(options) {
  // allow use without new
  if (!(this instanceof ConvertToPostCSS)) {
    return new ConvertToPostCSS(options);
  }

  // init Transform
  Transform.call(this, options);
};

util.inherits(ConvertToPostCSS, Transform);

ConvertToPostCSS.prototype._transform = function(chunk, encoding, callback) {


	// TODO: fixme @fonf-face in glyphicons.css (remove manually to test)
	var firstLinePart, secondLinePart;

	var line = chunk.toString();
	//var trimmedLine = trim(line);

	// Remove inline comment
	var commentIdx = line.indexOf('//');
	if (commentIdx>= 0) {
		line = line.substring(0, commentIdx);
	}

	// Fix icon-font-path (yes this is ugly)
	if (line === '$icon-font-path: if($bootstrap-sass-asset-helper, "bootstrap/", "../fonts/bootstrap/") !default;') {
		line = '$icon-font-path: "../fonts/bootstrap/");';
	}

	// Remove !default
	line = line.replace('!default', '');


	// Replace "@mixin mixin-name($var1, $var2: default) {"
	// by "@define-mixin mixin-name $var1, $var2: default {"
	if (line.indexOf('@mixin ') >= 0) {
		line = line.replace('@mixin ', '@define-mixin ');
		line = line.replace('...', '');
		line = line.replace('(', ' ');
		line = line.replace(')', '');
	}

	//@include gradient-vertical($start-color: $btn-color, $end-color: darken($btn-color, 12%));
	//@include alert-variant($alert-success-bg, $alert-success-border, $alert-success-text);

	// Replace @include mixin-name($var1, $var2);
	// by @mixin mixin-name var1, var2 {}
	if (line.indexOf('@include ') >= 0) {
		line = line.replace('@include ', '@mixin ');
		line = line.replace(/'/g, '');
		line = line.replace('(', ' ');
		line = line.replace(')', '');
		line = line.replace(';', ' {}');
	}

	// Remove @extend (FIXME)
	if (line.indexOf('@extend ') >= 0) {
		line = '';
	}

	// Replace #{$var} by $(var)
	line = line.replace(/\#\{\$([a-z]+)\}/ig, '$($1)');


	// Special case of import deps (yes this is ugly)
	if (line === '@import "mixins/vendor-prefixes";') {
		line = '@import "mixins/border-radius";\n' + line;
	} else if (line === '@import "mixins/progress-bar";') {
		line = '@import "mixins/gradients";\n' + line;
	} else if (line === '@import "mixins/border-radius";') {
		line = '';
	} else if (line === '@import "mixins/gradients";') {
		line = '';
	}

	// Color
	var lightenIdx = line.indexOf('lighten');
	var darkenIdx = line.indexOf('darken');
	// TODO: adjust-hue
	var minIdx = lightenIdx;
	//var indexLength = 'lighten'.length;
	if (darkenIdx >= 0 && (minIdx < 0 || darkenIdx < minIdx)) {
		minIdx = darkenIdx;
		//indexLength = 'darken'.length;
	}

	if (minIdx >= 0) {
		firstLinePart = line.substring(0, minIdx);
		secondLinePart = line.substring(minIdx, line.length);

		//console.log('firstLinePart: ' + firstLinePart);
		//console.log('secondLinePart: ' + secondLinePart);

		var result = {
			color: null,
			func: []
		};
		parseColorFunction(secondLinePart, result);

		var color = 'color(' + result.color;
		result.func.forEach(function(func) {
			var value = func.value;
			if (value[0] !== '-' || value[0] !== '+') {
				value = '+' + value;
			}

			if (func.name === 'lighten') {
				color += ' lightness(' + value + ')';
			} else if (func.name === 'darken') {
				color += ' blackness(' + value + ')';
			} else if (func.name === 'adjust-hue') {
				color += ' hue(' + value + ')';
			} else {
				console.error('color func ' + func.name + ' not supported');
				//throw new Error('color func ' + func.name + ' not supported');
			}
		});
		color += ');';

		line = firstLinePart + color;
		//console.log('result: ' + line);
	}


	// Calc
	line = processCalcExpression(line);


	if (line !== '') {
		this.push(line + '\n');
	}

	callback();
};

var cleanFiles = function(directory) {
	fs.readdirSync(directory).forEach(function(fileName) {
		var file = path.join(directory, fileName);
		var stat = fs.statSync(file);

		if (stat.isDirectory()) {
			// Recursive call
			cleanFiles(file);

		} else {
			var cleanFileName;
			var extIndex = fileName.lastIndexOf('.');
			if (extIndex < 0) {
				cleanFileName = fileName;
			} else {
				cleanFileName = fileName.substring(0, extIndex);
			}

			if (cleanFileName[0] === '_') {
				cleanFileName = cleanFileName.substring(1, cleanFileName.length);
			}

			var newFile = path.join(directory, cleanFileName + '.css');

			var convertToPostCSS = new ConvertToPostCSS();

			byline(fs.createReadStream(file))
				.pipe(convertToPostCSS)
				.pipe(fs.createWriteStream(newFile));

			fs.unlink(file);
		}
	});
};


var line = '  font-size: ($font-size-base - 1); ';
console.log(processCalcExpression(line));

var bootstrapSassModule = path.join(process.cwd(), 'node_modules/bootstrap-sass');
if (!fs.existsSync(bootstrapSassModule)) {
	throw new Error('bootstrap-sass module not found, missing npm install?');
}

var bootstrapAssets = path.join(bootstrapSassModule, 'assets');
if (!fs.existsSync(bootstrapAssets)) {
	throw new Error('assets directory not found, bootstrap-sass version not supported. Try downgrade');
}

var copyAssets = path.join(process.cwd(), 'assets');
fs.emptyDirSync(copyAssets);
fs.copySync(bootstrapAssets, copyAssets);

var styles = path.join(copyAssets, 'stylesheets');
cleanFiles(styles);
