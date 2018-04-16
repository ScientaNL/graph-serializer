const
    gulp = require('gulp'),
    ts = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    tsProject = ts.createProject('tsconfig.json');

gulp.task('default',['build','watch']);

gulp.task('watch', function() {
   gulp.watch("src/**/*.ts",['build']);
});

gulp.task('build', function() {
    return gulp.src("src/**/*.ts")
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(concat("graph-serializer.js"))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(rename({extname:".min.js"}))
        .pipe(gulp.dest('dist'));
});