const gulp = require('gulp');
const ts = require('gulp-typescript');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const tsCJSProject = ts.createProject('tsconfig.json');
const tsESMProject = ts.createProject('tsconfig.esm.json');

/**
 * @param {compile.Project} tsProject
 * @param {boolean} minify
 * @param {string} dist
 */
function build(tsProject, minify, dist) {
	return function(done){
		"use strict";

		var t = gulp.src("src/**/*.ts")
			.pipe(tsProject());

		t.js.pipe(gulp.dest(dist));
		if (minify) {
			t.js.pipe(uglify())
				.pipe(rename({extname:'.min.js'}))
		}
		t.js.pipe(gulp.dest(dist));

		t.dts.pipe(gulp.dest(dist));
		done();
	}
}

gulp.task('build:cjs', build(tsCJSProject, true, 'dist'));
gulp.task('build:esm', build(tsESMProject, false, 'dist/esm'));

gulp.task('watch', function() {
	gulp.watch("src/**/*.ts", gulp.series('build'));
});

gulp.task('default', gulp.series('build:cjs','watch'));
