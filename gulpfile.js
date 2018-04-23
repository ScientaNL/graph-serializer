const
    gulp = require('gulp'),
    ts = require('gulp-typescript'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    tsProject = ts.createProject('tsconfig.json');

gulp.task('default',['build','watch']);

gulp.task('watch', function() {
   gulp.watch("src/**/*.ts",['build']);
});


gulp.task('build', function () {
	"use strict";

	var t = gulp.src("src/**/*.ts")
		.pipe(tsProject());

	t.js
		.pipe(gulp.dest('dist'))
		.pipe(uglify())
		.pipe(rename({extname:'.min.js'}))
		.pipe(gulp.dest('dist'));

	t.dts.pipe(gulp.dest('dist'));
});

